// --- CHECK LOGIN ---
function checkLogin() {
  const token = localStorage.getItem('userToken')
  if (!token) window.location.href = 'login.html'
}

// --- AUTH FETCH helper ---
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('userToken')
  if (!options.headers) options.headers = {}
  options.headers['Authorization'] = `Bearer ${token}`
  return fetch(url, options)
}

// --- LOGIN & SIGNUP ---
const apiUrl = 'http://localhost:3001/api/users'

const loginForm = document.getElementById('loginForm')
const loginMessage = document.getElementById('loginMessage')

if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault()
    const username = document.getElementById('loginUsername').value
    const password = document.getElementById('loginPassword').value

    const res = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('userToken', data.token)
      window.location.href = 'index.html'
    } else {
      loginMessage.textContent = data.error || 'Login failed'
    }
  })
}

const signupForm = document.getElementById('signupForm')
const signupMessage = document.getElementById('signupMessage')

if (signupForm) {
  signupForm.addEventListener('submit', async e => {
    e.preventDefault()
    const username = document.getElementById('signupUsername').value
    const password = document.getElementById('signupPassword').value

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('userToken', data.token)
      window.location.href = 'index.html'
    } else {
      signupMessage.textContent = data.error || 'Signup failed'
    }
  })
}

// --- LOGOUT ---
function logout() {
  localStorage.removeItem('userToken')
  window.location.href = 'login.html'
}


// Make functions global
window.checkLogin = checkLogin
window.authFetch = authFetch
window.logout = logout
