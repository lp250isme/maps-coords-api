module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  let current = url

  try {
    // ========= 1️⃣ 跟 Google Maps redirect =========
    for (let i = 0; i < 8; i++) {
      const r = await fetch(current, {
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
            'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
            'Version/17.0 Mobile/15E148 Safari/604.1'
        }
      })

      const nextLocation = r.headers.get('location')
      if (!nextLocation) break

      if (nextLocation.startsWith('/')) {
        const u = new URL(current)
        current = u.origin + nextLocation
      } else {
        current = nextLocation
      }
    }

    // ========= 2️⃣ 嘗試直接從 URL 拿座標 =========
    let match = current.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (match) {
      return res.status(200).send(`${match[1]},${match[2]}`)
    }

    match = current.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (match) {
      return res.status(200).send(`${match[1]},${match[2]}`)
    }

    // ========= 3️⃣ OpenStreetMap fallback =========
    let query = null

    if (current.includes('/maps?q=')) {
      query = new URL(current).searchParams.get('q')
    }

    if (!query) {
      return res.status(404).json({
        error: 'Coords not found',
        finalUrl: current
      })
    }

    const osmUrl =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1'
      })

    const osmRes = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'maps-coords-api/1.0 (contact: you@example.com)'
      }
    })

    const data = await osmRes.json()

    if (data.length > 0) {
      return res.status(200).send(`${data[0].lat},${data[0].lon}`)
    }

    return res.status(404).json({
      error: 'Coords not found (OSM)',
      query
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
