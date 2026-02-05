require('dotenv').config()
const express = require('express')
const app = express()

const handler = require('./api/index')

// Serve static files from public directory
app.use(express.static('public'));

app.get('/api', async (req, res) => {
  await handler(req, res)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
