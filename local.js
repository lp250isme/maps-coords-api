require('dotenv').config()
const express = require('express')
const app = express()

const handler = require('./api/index')

app.get('/api', async (req, res) => {
  await handler(req, res)
})

app.get('/', (req, res) => {
  res.send('API is running. Please use /api?url=...')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
