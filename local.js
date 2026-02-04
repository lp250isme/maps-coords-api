// local.js
const express = require('express')
const handler = require('./api/index') // 引入你的 API 邏輯

const app = express()

// 模擬 Vercel 的 Request/Response 物件
app.get('/api', async (req, res) => {
  await handler(req, res)
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`本地伺服器已啟動: http://localhost:${PORT}`)
  console.log(
    `測試網址範例: http://localhost:${PORT}/api?url=https://maps.app.goo.gl/WUkNwbLLjtt6XhN67`
  )
})
