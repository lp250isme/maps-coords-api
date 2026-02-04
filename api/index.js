module.exports = async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).send('Missing url')

  let current = url
  let location

  try {
    for (let i = 0; i < 5; i++) {
      const r = await fetch(current, {
        redirect: 'manual'
      })

      location = r.headers.get('location')
      if (!location) break

      if (location.startsWith('/')) {
        const u = new URL(current)
        current = u.origin + location
      } else {
        current = location
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
