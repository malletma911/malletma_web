import './style.css'

document.querySelector('#app').innerHTML = `
  <div>
    <div style="position:fixed;top:1rem;right:1rem;">
      <a href="/api/auth/logout">
        <button type="button">Logout</button>
      </a>
    </div>
    <h1>Meine Aktivitäten</h1>
    <div id="connect-strava" style="display:none;" class="card">
      <a href="/api/strava/connect">
        <button type="button">Strava verbinden</button>
      </a>
    </div>
    <div id="activities">Lade Aktivitäten...</div>
  </div>
`

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function loadActivities() {
  const container = document.getElementById('activities')
  const connectBtn = document.getElementById('connect-strava')
  try {
    const res = await fetch('/api/strava/activities')

    if (res.status === 404) {
      connectBtn.style.display = 'block'
      container.innerHTML = '<p>Strava noch nicht verbunden.</p>'
      return
    }

    if (!res.ok) {
      const err = await res.json()
      container.innerHTML = `<p>${esc(err.error)}</p>`
      return
    }

    const activities = await res.json()
    if (activities.length === 0) {
      container.innerHTML = '<p>Keine Aktivitäten gefunden.</p>'
      return
    }

    container.innerHTML = activities.map(a => `
      <div style="border:1px solid #ccc;border-radius:8px;padding:1rem;margin:0.5rem 0;">
        <strong>${esc(a.name)}</strong><br>
        <span>${esc(a.type)} · ${(a.distance / 1000).toFixed(1)} km · ${Math.round(a.moving_time / 60)} min</span><br>
        <small>${new Date(a.start_date).toLocaleDateString('de-DE')}</small>
      </div>
    `).join('')
  } catch {
    container.innerHTML = '<p>Fehler beim Laden der Aktivitäten.</p>'
  }
}

loadActivities()
