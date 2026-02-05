const express = require('express');
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

app.listen(port, () => {
    console.log(`API Server running at http://localhost:${port}`);
});
