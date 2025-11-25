// --- Ensure user is logged in ---
if (typeof checkLogin === 'function') {
  checkLogin();
} else {
  console.error("checkLogin not found. Make sure auth.js is loaded first.");
}

// --- API URLs ---
const gamesTipsApiUrl = 'http://localhost:3001/api/games';
const tipsApiUrl = 'http://localhost:3001/api/tips';

/* --- Elements --- */
const selectGameForTip = document.getElementById('selectGameForTip');
const tipsList = document.getElementById('tipsList');
const tipForm = document.getElementById('tipForm');
const tipText = document.getElementById('tipText');
const tipTags = document.getElementById('tipTags');
const tipTagFilter = document.getElementById('tipTagFilter');
const applyTipFilter = document.getElementById('applyTipFilter');

// --- Helper: decode username from JWT ---
function getUsernameFromToken() {
  const token = localStorage.getItem('userToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).username;
  } catch (err) {
    console.error("Failed to decode token:", err);
    return null;
  }
}

/* --- Populate game dropdown --- */
async function populateTipDropdown() {
  const res = await authFetch(gamesTipsApiUrl);
  const games = await res.json();
  selectGameForTip.innerHTML = '<option value="">Select a game</option>';
  games.forEach(game => {
    const option = document.createElement('option');
    option.value = game._id;
    option.textContent = game.name;
    selectGameForTip.appendChild(option);
  });
}

/* --- Load tips --- */
async function loadTips(gameId, tag = '') {
  if (!gameId) {
    tipsList.innerHTML = '';
    return;
  }

  const res = await authFetch(`${tipsApiUrl}/game/${gameId}`);
  let tips = await res.json();

  if (tag.trim() !== '') {
    tips = tips.filter(t => t.tags.map(x => x.toLowerCase()).includes(tag.toLowerCase()));
  }

  tipsList.innerHTML = '';
  tips.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.username}: ${t.text} [${t.tags.join(', ')}]`;

    const loggedUser = getUsernameFromToken();
    if (loggedUser === t.username) {
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', async () => {
        const newText = prompt('Edit tip text:', t.text);
        if (!newText) return;
        const newTags = prompt('Edit tags (comma-separated):', t.tags.join(','));
        await authFetch(`${tipsApiUrl}/${t._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: newText,
            tags: newTags ? newTags.split(',').map(tag => tag.trim()) : []
          })
        });
        loadTips(selectGameForTip.value, tipTagFilter.value);
      });
      li.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this tip?')) return;
        await authFetch(`${tipsApiUrl}/${t._id}`, { method: 'DELETE' });
        loadTips(selectGameForTip.value, tipTagFilter.value);
      });
      li.appendChild(delBtn);
    }

    tipsList.appendChild(li);
  });
}

/* --- Event listeners --- */
if (selectGameForTip) {
  selectGameForTip.addEventListener('change', () => {
    loadTips(selectGameForTip.value, tipTagFilter.value);
  });
}

if (tipForm) {
  tipForm.addEventListener('submit', async e => {
    e.preventDefault();
    const gameId = selectGameForTip.value;
    if (!gameId) return alert('Select a game first');

    const username = getUsernameFromToken();
    if (!username) return alert("Invalid login token");

    const newTip = {
      game: gameId,
      username, // Use logged-in username automatically
      text: tipText.value,
      tags: tipTags.value ? tipTags.value.split(',').map(t => t.trim()) : []
    };

    await authFetch(tipsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTip)
    });

    tipForm.reset();
    loadTips(gameId, tipTagFilter.value);
  });
}

if (applyTipFilter) {
  applyTipFilter.addEventListener('click', () => {
    loadTips(selectGameForTip.value, tipTagFilter.value);
  });
}

if (tipTagFilter) {
  tipTagFilter.addEventListener('input', () => {
    loadTips(selectGameForTip.value, tipTagFilter.value);
  });
}

/* --- Initial load --- */
if (selectGameForTip) {
  populateTipDropdown();
}
