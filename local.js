// local.js
require('dotenv').config() // 載入 .env 環境變數
const express = require('express')
const handler = require('./api/index') // 引入您的主要邏輯

const app = express()
const port = process.env.PORT || 3000

// 模擬 Vercel 的 Request/Response 處理
app.use(express.json())

// 將所有請求導向到 handler
app.get('/', async (req, res) => {
  try {
    await handler(req, res)
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})

// 也可以處理 /api 的路徑 (視您的呼叫習慣而定)
app.get('/api', async (req, res) => {
  try {
    await handler(req, res)
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})

app.listen(port, () => {
  console.log(`🚀 Local Server running at http://localhost:${port}`)
  console.log(
    `Testing URL: http://localhost:${port}/?url=https://maps.app.goo.gl/pwkhYkD4ankvVAo18?g_st=ic`
  )
})
