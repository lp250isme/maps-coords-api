const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  // 1. 取得輸入的 url
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: '請提供 url 參數' });
  }

  let browser = null;

  try {
    // 設定字型路徑 (避免因為缺字型報錯，雖然抓座標不需要顯示文字)
    await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');

    // 2. 啟動瀏覽器
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--disable-dev-shm-usage', // 關鍵優化：避免記憶體共享錯誤
        '--no-sandbox'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // 3. 前往目標網址
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });

    // 4. 等待網址轉換
    try {
      await page.waitForFunction(() => window.location.href.includes('@'), { timeout: 5000 });
    } catch (e) {
      // 忽略超時，直接解析當前網址
    }

    const finalUrl = page.url();

    // 5. 正則表達式提取座標
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = finalUrl.match(regex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      res.status(200).send(`${lat},${lng}`);
    } else {
      res.status(404).json({ 
        error: '找不到座標', 
        finalUrl: finalUrl 
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '伺服器錯誤', details: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
