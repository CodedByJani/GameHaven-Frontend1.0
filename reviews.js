// --- Ensure user is logged in ---
if (typeof checkLogin === 'function') {
  checkLogin();
} else {
  console.error("checkLogin not found. Make sure auth.js is loaded first.");
}

// --- API URLs ---
const gamesApiUrl = 'http://localhost:3001/api/games';
const reviewsApiUrl = 'http://localhost:3001/api/reviews';

/* --- Elements --- */
const selectGameForReview = document.getElementById('selectGameForReview');
const reviewsList = document.getElementById('reviewsList');
const reviewForm = document.getElementById('reviewForm');
const ratingInput = document.getElementById('rating');
const commentInput = document.getElementById('comment');
const averageRatingDisplay = document.getElementById('averageRating');

// Create a container for user's reviews above all reviews
let userReviewsContainer = document.getElementById('userReviewsContainer');
if (!userReviewsContainer) {
  userReviewsContainer = document.createElement('div');
  userReviewsContainer.id = 'userReviewsContainer';
  selectGameForReview.insertAdjacentElement('afterend', userReviewsContainer);
}

let userReviewsList = document.createElement('ul');
userReviewsList.id = 'userReviewsList';
userReviewsContainer.appendChild(document.createElement('h3')).textContent = 'Your Reviews';
userReviewsContainer.appendChild(userReviewsList);

/* --- Helper: decode username from JWT --- */
function getUsernameFromToken() {
  const token = localStorage.getItem('userToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username;
  } catch (err) {
    console.error("Failed to decode token:", err);
    return null;
  }
}

/* --- Populate game dropdown --- */
async function populateGameDropdown() {
  const res = await authFetch(gamesApiUrl);
  const games = await res.json();

  selectGameForReview.innerHTML = '<option value="">Select a game</option>';
  games.forEach(game => {
    const option = document.createElement('option');
    option.value = game._id;
    option.textContent = game.name;
    selectGameForReview.appendChild(option);
  });
}

/* --- Load reviews for selected game --- */
async function loadReviews(gameId) {
  if (!gameId) {
    reviewsList.innerHTML = '';
    averageRatingDisplay.textContent = '';
    return;
  }

  const res = await authFetch(`${reviewsApiUrl}/game/${gameId}`);
  const reviews = await res.json();

  reviewsList.innerHTML = '';
  let totalRating = 0;

  reviews.forEach(r => {
    totalRating += r.rating;
    const li = document.createElement('li');
    li.textContent = `${r.username}: ${r.rating} ⭐ - ${r.comment || ''}`;
    reviewsList.appendChild(li);
  });

  averageRatingDisplay.textContent = reviews.length > 0
    ? `Average Rating: ${(totalRating / reviews.length).toFixed(2)} ⭐`
    : 'No reviews yet';
}

/* --- Load all reviews by logged-in user --- */
async function loadUserReviews() {
  const username = getUsernameFromToken();
  if (!username) return;

  const res = await authFetch(`${reviewsApiUrl}/user/${username}`);
  if (!res.ok) return; // avoid crash if route doesn't exist
  const reviews = await res.json();

  userReviewsList.innerHTML = '';

  if (reviews.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No reviews yet';
    userReviewsList.appendChild(li);
    return;
  }

  reviews.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.gameName || 'Unknown Game'}: ${r.rating} ⭐ - ${r.comment || ''}`;

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', async () => {
      const newRating = prompt('Edit rating (1-10):', r.rating);
      if (!newRating) return;
      const newComment = prompt('Edit comment:', r.comment || '');

      await authFetch(`${reviewsApiUrl}/${r._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: Number(newRating), comment: newComment })
      });

      loadUserReviews();
      loadReviews(selectGameForReview.value);
    });
    li.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this review?')) return;
      await authFetch(`${reviewsApiUrl}/${r._id}`, { method: 'DELETE' });
      loadUserReviews();
      loadReviews(selectGameForReview.value);
    });
    li.appendChild(delBtn);

    userReviewsList.appendChild(li);
  });
}

/* --- Event listeners --- */
if (selectGameForReview) {
  selectGameForReview.addEventListener('change', () => {
    loadReviews(selectGameForReview.value);
  });
}

if (reviewForm) {
  reviewForm.addEventListener('submit', async e => {
    e.preventDefault();
    const gameId = selectGameForReview.value;
    if (!gameId) return alert('Select a game first');

    const username = getUsernameFromToken();
    if (!username) return alert("Invalid login token");

    const newReview = {
      game: gameId,
      rating: Number(ratingInput.value),
      comment: commentInput.value,
      username: username
    };

    await authFetch(reviewsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview)
    });

    reviewForm.reset();
    loadUserReviews();
    loadReviews(gameId);
  });
}

/* --- Initial load --- */
populateGameDropdown();
loadUserReviews();
