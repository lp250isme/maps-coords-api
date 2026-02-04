// local.js
require('dotenv').config()
const express = require('express')
const app = express()

// 引入你的主程式 (假設它在 api/index.js)
const handler = require('./api/index')

// 這樣當你訪問 http://localhost:3000/api?url=... 時才會執行
app.get('/api', async (req, res) => {
  await handler(req, res)
})

// 根目錄給個簡單提示就好，不要列出檔案
app.get('/', (req, res) => {
  res.send('API is running. Please use /api?url=...')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
