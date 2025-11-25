// --- API URL ---
const postsApiUrl = 'http://localhost:3001/api/friends';

// --- Elements ---
const postsList = document.getElementById('postsList');
const postForm = document.getElementById('postForm');
const postText = document.getElementById('postText');

// --- Get logged-in username from token ---
function getUsernameFromToken() {
  const token = localStorage.getItem('userToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).username;
  } catch {
    return null;
  }
}
const loggedUser = getUsernameFromToken();

// --- Load all posts ---
async function loadPosts() {
  try {
    const res = await authFetch(postsApiUrl);
    const posts = await res.json();
    displayPosts(posts);
  } catch (err) {
    console.error('Error loading posts:', err);
  }
}

// --- Display posts and comments ---
function displayPosts(posts) {
  postsList.innerHTML = '';

  posts.forEach(post => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${post.username}</strong>: ${post.text}`;

    // Edit/Delete buttons for own post
    if (post.username === loggedUser) {
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => editPost(post._id, post.text));
      li.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => deletePost(post._id));
      li.appendChild(delBtn);
    }

    // Comments
    if (post.comments && post.comments.length > 0) {
      const cUl = document.createElement('ul');
      post.comments.forEach(c => {
        const cLi = document.createElement('li');
        cLi.innerHTML = `<strong>${c.username}</strong>: ${c.text}`;

        // Edit/Delete for own comment
        if (c.username === loggedUser) {
          const cEditBtn = document.createElement('button');
          cEditBtn.textContent = 'Edit';
          cEditBtn.addEventListener('click', () =>
            editComment(post._id, c._id, c.text)
          );
          cLi.appendChild(cEditBtn);

          const cDelBtn = document.createElement('button');
          cDelBtn.textContent = 'Delete';
          cDelBtn.addEventListener('click', () =>
            deleteComment(post._id, c._id)
          );
          cLi.appendChild(cDelBtn);
        }

        cUl.appendChild(cLi);
      });
      li.appendChild(cUl);
    }

    // Comment input for any user
    const commentInput = document.createElement('input');
    commentInput.placeholder = 'Write a comment...';

    const commentBtn = document.createElement('button');
    commentBtn.textContent = 'Add Comment';
    commentBtn.addEventListener('click', () => {
      const text = commentInput.value.trim();
      if (!text) return;
      addComment(post._id, text);
      commentInput.value = '';
    });

    li.appendChild(commentInput);
    li.appendChild(commentBtn);

    postsList.appendChild(li);
  });
}

// --- Add new post ---
if (postForm) {
  postForm.addEventListener('submit', async e => {
    e.preventDefault();
    const text = postText.value.trim();
    if (!text) return;

    try {
      await authFetch(postsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }) // backend uses req.user.username
      });
      postForm.reset();
      loadPosts();
    } catch (err) {
      console.error('Error creating post:', err);
    }
  });
}

// --- Add comment ---
async function addComment(postId, text) {
  try {
    await authFetch(`${postsApiUrl}/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }) // backend uses req.user.username
    });
    loadPosts();
  } catch (err) {
    console.error('Error adding comment:', err);
  }
}

// --- Edit post ---
async function editPost(postId, oldText) {
  const newText = prompt('Edit your post:', oldText);
  if (!newText) return;

  try {
    await authFetch(`${postsApiUrl}/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText })
    });
    loadPosts();
  } catch (err) {
    console.error('Error editing post:', err);
  }
}

// --- Delete post ---
async function deletePost(postId) {
  if (!confirm('Delete your post?')) return;
  try {
    await authFetch(`${postsApiUrl}/${postId}`, { method: 'DELETE' });
    loadPosts();
  } catch (err) {
    console.error('Error deleting post:', err);
  }
}

// --- Edit comment ---
async function editComment(postId, commentId, oldText) {
  const newText = prompt('Edit your comment:', oldText);
  if (!newText) return;

  try {
    await authFetch(`${postsApiUrl}/${postId}/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText })
    });
    loadPosts();
  } catch (err) {
    console.error('Error editing comment:', err);
  }
}

// --- Delete comment ---
async function deleteComment(postId, commentId) {
  if (!confirm('Delete your comment?')) return;
  try {
    await authFetch(`${postsApiUrl}/${postId}/comments/${commentId}`, {
      method: 'DELETE'
    });
    loadPosts();
  } catch (err) {
    console.error('Error deleting comment:', err);
  }
}

// --- Initial load ---
loadPosts();
