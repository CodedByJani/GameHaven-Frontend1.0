// --- Redirect to login if not logged in ---
if (typeof checkLogin === 'function') checkLogin()

// --- API URL ---
const gamesApiUrl = 'http://localhost:3001/api/games'

// --- Elements ---
const gameForm = document.getElementById('gameForm')
const gamesList = document.getElementById('gamesList')
const filterType = document.getElementById('filterType')
const filterPlatform = document.getElementById('filterPlatform')
const filterStatus = document.getElementById('filterStatus')
const applyFilters = document.getElementById('applyFilters')
const sortGames = document.getElementById('sortGames')

const typeSelect = document.getElementById('type')
const customTypeInput = document.getElementById('customType')
const platformSelect = document.getElementById('platform')
const customPlatformInput = document.getElementById('customPlatform')

// --- Helper: fetch with token ---
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('userToken')
  if (!options.headers) options.headers = {}
  options.headers['Authorization'] = `Bearer ${token}`
  if (!options.headers['Content-Type']) options.headers['Content-Type'] = 'application/json'

  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('API error:', err)
    return []
  }
  try {
    return await res.json()
  } catch {
    return []
  }
}

// --- Show custom type/platform inputs ---
typeSelect.addEventListener('change', () => {
  if (typeSelect.value === 'Other') {
    customTypeInput.style.display = 'inline-block'
    customTypeInput.required = true
  } else {
    customTypeInput.style.display = 'none'
    customTypeInput.required = false
  }
})

platformSelect.addEventListener('change', () => {
  if (platformSelect.value === 'Other') {
    customPlatformInput.style.display = 'inline-block'
    customPlatformInput.required = true
  } else {
    customPlatformInput.style.display = 'none'
    customPlatformInput.required = false
  }
})

// --- Load games ---
async function loadGames() {
  const params = new URLSearchParams()
  if (filterType.value) params.append('type', filterType.value)
  if (filterPlatform.value) params.append('platform', filterPlatform.value)
  if (filterStatus.value) params.append('status', filterStatus.value)

  const games = await authFetch(`${gamesApiUrl}?${params.toString()}`)
  if (!Array.isArray(games)) return

  // --- Sorting ---
  const sortValue = sortGames.value
  if (sortValue === 'name_asc') games.sort((a, b) => a.name.localeCompare(b.name))
  else if (sortValue === 'name_desc') games.sort((a, b) => b.name.localeCompare(a.name))
  else if (sortValue === 'status') {
    const statusOrder = { want_to_play: 0, playing: 1, played: 2 }
    games.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  } else if (sortValue === 'type_asc') games.sort((a, b) => a.type.localeCompare(b.type))
  else if (sortValue === 'platform_asc') games.sort((a, b) => a.platform.localeCompare(b.platform))

  // --- Render games ---
  gamesList.innerHTML = ''
  games.forEach(game => {
    const li = document.createElement('li')
    li.textContent = `${game.name} [${game.type}] - ${game.platform} (${game.status})`

    // Edit button
    const editBtn = document.createElement('button')
    editBtn.textContent = 'Edit'
    editBtn.classList.add('game-btn')
    editBtn.addEventListener('click', async () => {
      const newName = prompt('Edit game name:', game.name)
      if (!newName) return
      const newType = prompt('Edit game type:', game.type)
      if (!newType) return
      const newPlatform = prompt('Edit platform:', game.platform)
      if (!newPlatform) return
      const newStatus = prompt('Edit status (want_to_play/playing/played):', game.status)
      if (!newStatus) return
      const newDescription = prompt('Edit description:', game.description || '')

      await authFetch(`${gamesApiUrl}/${game._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: newName,
          type: newType,
          platform: newPlatform,
          status: newStatus,
          description: newDescription
        })
      })
      loadGames()
    })
    li.appendChild(editBtn)

    // Delete button
    const delBtn = document.createElement('button')
    delBtn.textContent = 'Delete'
    delBtn.classList.add('game-btn')
    delBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this game?')) return
      await authFetch(`${gamesApiUrl}/${game._id}`, { method: 'DELETE' })
      loadGames()
    })
    li.appendChild(delBtn)

    gamesList.appendChild(li)
  })

  updateFilterOptions(games)
}

// --- Update filter dropdowns dynamically ---
function updateFilterOptions(games) {
  const types = Array.from(new Set(games.map(g => g.type).filter(t => t)))
  filterType.innerHTML = '<option value="">All Types</option>'
  types.forEach(t => {
    const option = document.createElement('option')
    option.value = t
    option.textContent = t
    filterType.appendChild(option)
  })

  const platforms = Array.from(new Set(games.map(g => g.platform).filter(p => p)))
  filterPlatform.innerHTML = '<option value="">All Platforms</option>'
  platforms.forEach(p => {
    const option = document.createElement('option')
    option.value = p
    option.textContent = p
    filterPlatform.appendChild(option)
  })
}

// --- Submit new game ---
if (gameForm) {
  gameForm.addEventListener('submit', async e => {
    e.preventDefault()
    const genre = typeSelect.value === 'Other' ? customTypeInput.value : typeSelect.value
    const platform = platformSelect.value === 'Other' ? customPlatformInput.value : platformSelect.value

    const newGame = {
      name: document.getElementById('name').value,
      type: genre,
      platform: platform,
      description: document.getElementById('description').value,
      status: document.getElementById('status').value
    }

    await authFetch(gamesApiUrl, {
      method: 'POST',
      body: JSON.stringify(newGame)
    })

    gameForm.reset()
    customTypeInput.style.display = 'none'
    customPlatformInput.style.display = 'none'

    await loadGames() // ensure the new game shows up immediately
  })
}

// --- Apply filters and sorting ---
if (applyFilters) applyFilters.addEventListener('click', loadGames)
if (sortGames) sortGames.addEventListener('change', loadGames)

// --- Initial load ---
loadGames()
