const express = require('express');
require('dotenv').config();
const app = express();
const port = 3001;

// Import the Vercel serverless function handler
// Note: We need to adapt it slightly to work with Express if it exports a default function (req, res)
const apiHandler = require('./api/index.js');

app.use(express.json());

// Proxy API requests to the handler
app.get('/api', async (req, res) => {
    // Pass the express req/res objects to the handler
    // The handler is expected to be `module.exports = (req, res) => { ... }`
    try {
        await apiHandler(req, res);
    } catch (error) {
        console.error("API proxy error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Intercept Root Path for Headless Redirects
app.get('/', async (req, res, next) => {
    // Only intercept if 'api' or 'apiKey' is present
    if (req.query.api || req.query.apiKey) {
        // Mock response object to capture API result
        const mockRes = {
            status: (code) => mockRes,
            json: (data) => {
                if (data.redirect) {
                    return res.redirect(302, data.redirect);
                }
                // If API returns success but no redirect (e.g. invalid key or no direct open),
                // Fallback to Web UI.
                // We construct the Web UI URL manually to ensure it loads
                next(); // Continue to Vite/Static handling
            },
            setHeader: () => {},
            send: () => {}, // Should not happen as we reverted API to JSON
        };

        try {
            // Force JSON format for API handler to ensure we get data object
            req.query.format = 'json'; 
            await apiHandler(req, mockRes);
        } catch (e) {
            next();
        }
    } else {
        next();
    }
});

app.listen(port, () => {
    console.log(`API Server running at http://localhost:${port}`);
});
