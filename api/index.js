module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  let current = url

  try {
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

    const match = current.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (match) {
      return res.status(200).send(`${match[1]},${match[2]}`)
    }

    return res.status(404).json({
      error: 'Coords not found',
      finalUrl: current
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
