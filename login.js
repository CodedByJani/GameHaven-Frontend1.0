const loginForm = document.getElementById('loginForm')
const signupForm = document.getElementById('signupForm')
const messageDiv = document.getElementById('message')

const apiUrl = 'http://localhost:3001/api/users'

// --- LOGIN ---
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
    window.location.href = 'index.html' // redirect to main page
  } else {
    messageDiv.textContent = data.error || 'Login failed'
  }
})

// --- SIGNUP ---
signupForm.addEventListener('submit', async e => {
  e.preventDefault()
  const username = document.getElementById('signupUsername').value
  const password = document.getElementById('signupPassword').value

  const res = await fetch(`${apiUrl}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  const data = await res.json()
  if (res.ok) {
    messageDiv.textContent = 'Signup successful! You can now log in.'
    signupForm.reset()
  } else {
    messageDiv.textContent = data.error || 'Signup failed'
  }
})
