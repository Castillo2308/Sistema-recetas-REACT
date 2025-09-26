(function() {
  const PLACEHOLDER_IMG = "data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>\
<rect width='100%' height='100%' fill='%23e5e7eb'/>\
<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='24'>Receta</text>\
</svg>";
  // Simple, CSP-safe toast helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const msg = document.createElement('span');
    msg.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Cerrar notificación');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => toast.remove());

    toast.appendChild(msg);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }

  // Auth helpers
  function getToken() {
    return localStorage.getItem('token');
  }

  async function checkAuth() {
    const token = getToken();
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
    // Optionally verify token via backend if route exists
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Token inválido');
        const json = await res.json();
        const user = json.data?.user || {};
        const display = (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user.username || 'Usuario');
        document.getElementById('userName').textContent = display;
    } catch {
      window.location.href = '/login.html';
    }
  }

  // DOM refs
  const recipesGrid = document.getElementById('recipesGrid');
  const loadingEl = document.getElementById('loading');
  const searchInput = document.getElementById('searchInput');
  const btnSearch = document.getElementById('btnSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const difficultyFilter = document.getElementById('difficultyFilter');

  // Vote modal refs
  const voteModal = document.getElementById('voteModal');
  const voteModalClose = document.getElementById('voteModalClose');
  const voteRecipeTitle = document.getElementById('voteRecipeTitle');
  const voteRecipeHeading = document.getElementById('voteRecipeHeading');
  const voteRecipeDesc = document.getElementById('voteRecipeDesc');
  const voteRecipeImage = document.getElementById('voteRecipeImage');
  const voteAvg = document.getElementById('voteAvg');
  const voteCount = document.getElementById('voteCount');

  const voteForm = document.getElementById('voteForm');
  const starRating = document.getElementById('starRating');
  const starValue = document.getElementById('starValue');
  const voteComment = document.getElementById('voteComment');
  const votesList = document.getElementById('votesList');
  const btnPrevVotes = document.getElementById('btnPrevVotes');
  const btnNextVotes = document.getElementById('btnNextVotes');
  const btnDeleteVote = document.getElementById('btnDeleteVote');

  const btnLogout = document.getElementById('btnLogout');

  let currentRecipes = [];
  let currentVoteRecipe = null; // holds recipe object
  let myVoteId = null; // for delete

  let votesPage = 1;
  const votesLimit = 5;

  function setLoading(isLoading) {
    if (isLoading) {
      loadingEl.style.display = 'flex';
      // skeletons
      if (recipesGrid && !recipesGrid.dataset.originalContent) {
        recipesGrid.dataset.originalContent = recipesGrid.innerHTML;
      }
      if (recipesGrid) {
        recipesGrid.dataset.state = 'loading';
        const skeletonCards = Array.from({ length: 6 }).map(() => `
          <div class="card skeleton-card">
            <div class="card-image skeleton skeleton-img"></div>
            <div class="card-content">
              <div class="skeleton skeleton-line full"></div>
              <div class="skeleton skeleton-line medium"></div>
              <div class="skeleton skeleton-line short"></div>
            </div>
            <div class="card-actions" style="padding:.75rem 0.75rem 1rem;">
              <div class="skeleton skeleton-line medium" style="height:34px; border-radius: var(--radius);"></div>
            </div>
          </div>
        `).join('');
        recipesGrid.innerHTML = skeletonCards;
      }
    } else {
      loadingEl.style.display = 'none';
      if (recipesGrid) recipesGrid.dataset.state = 'idle';
    }
  }

  function difficultyBadgeClass(d) {
    const map = { 'Fácil': 'badge-easy', 'Intermedio': 'badge-medium', 'Difícil': 'badge-hard' };
    return map[d] || 'badge-easy';
  }

  function renderRecipes(recipes) {
    if (!recipes || recipes.length === 0) {
      recipesGrid.innerHTML = '<p class="empty">No hay recetas para mostrar.</p>';
      return;
    }

    recipesGrid.innerHTML = recipes.map(r => {
      const avg = (r.avgRating ?? r.averageRating ?? 0).toFixed(1);
      const count = r.totalVotes ?? r.votesCount ?? 0;
  const imgSrc = r.image?.path ? '/' + r.image.path : PLACEHOLDER_IMG;
      return `
        <div class="card" data-id="${r._id}">
          <div class="card-image">
            <img src="${imgSrc}" alt="${r.title}">
            <span class="badge ${difficultyBadgeClass(r.difficulty)}">${r.difficulty || ''}</span>
          </div>
          <div class="card-content">
            <h3 class="card-title">${r.title}</h3>
            <p class="card-desc">${(r.description || '').slice(0, 120)}${(r.description||'').length>120?'...':''}</p>
            <div class="card-meta" style="display:flex; gap:1rem; align-items:center;">
              <span><i class="fas fa-star" style="color:#f59e0b"></i> <span class="card-avg" data-role="avg">${avg}</span></span>
              <span><i class="fas fa-user"></i> <span class="card-count" data-role="count">${count}</span> votos</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-primary action-vote"><i class="fas fa-star"></i> Votar / Opinar</button>
          </div>
        </div>
      `;
    }).join('');
  }

  async function loadRecipes() {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
      if (categoryFilter.value) params.set('category', categoryFilter.value);
      if (difficultyFilter.value) params.set('difficulty', difficultyFilter.value);

      const res = await fetch(`/api/recipes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('No se pudieron cargar recetas');
        const json = await res.json();

        // API returns { success, data: { recipes, pagination } }
        currentRecipes = (json && json.data && Array.isArray(json.data.recipes)) ? json.data.recipes : (Array.isArray(json) ? json : []);

      // No multiplicamos requests: usamos los campos ya presentes en la receta (averageRating/totalVotes)
      renderRecipes(currentRecipes);
      attachImageErrorHandlers();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error cargando recetas', 'error');
    } finally {
      setLoading(false);
    }
  }

  function attachImageErrorHandlers() {
    document.querySelectorAll('.card-image img').forEach(img => {
      img.addEventListener('error', () => {
        img.src = PLACEHOLDER_IMG;
      }, { once: true });
    });
  }

  function openVoteModal(recipe) {
    currentVoteRecipe = recipe;
    votesPage = 1;
    myVoteId = null;

    voteRecipeTitle.textContent = recipe.title;
    voteRecipeHeading.textContent = recipe.title;
    voteRecipeDesc.textContent = recipe.description || '';
    voteRecipeImage.src = recipe.image?.path ? '/' + recipe.image.path : PLACEHOLDER_IMG;
    voteRecipeImage.addEventListener('error', () => {
      voteRecipeImage.src = PLACEHOLDER_IMG;
    }, { once: true });

    // Reset form
    setStarValue(0);
    voteComment.value = '';
    btnDeleteVote.style.display = 'none';

    // Load stats + my vote + first page of comments
    loadVotesAndStats();

    voteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeVoteModal() {
    voteModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function renderStars(current = 0) {
    starRating.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'star-btn';
      btn.setAttribute('aria-checked', i === current ? 'true' : 'false');
      btn.setAttribute('role', 'radio');
      btn.dataset.value = i.toString();
      btn.innerHTML = `<i class="${i <= current ? 'fas' : 'far'} fa-star"></i>`;
      btn.addEventListener('click', () => setStarValue(i));
      starRating.appendChild(btn);
    }
    starValue.textContent = `${current}/5`;
  }

  function setStarValue(v) {
    starRating.dataset.value = v.toString();
    renderStars(v);
  }

  async function loadVotesAndStats() {
    if (!currentVoteRecipe) return;

    try {
      const res = await fetch(`/api/votes/recipe/${currentVoteRecipe._id}?page=${votesPage}&limit=${votesLimit}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('No se pudieron cargar las opiniones');
      const json = await res.json();
      const data = json.data || {};
      const stats = data.stats || {};
      const votes = data.votes || [];
      const pagination = data.pagination || {};

      voteAvg.textContent = (stats.averageRating || 0).toFixed(1);
      voteCount.textContent = stats.totalVotes || 0;

      // Render opinions/comments
      if (votes.length === 0) {
        votesList.innerHTML = '<p class="empty">Sin opiniones aún.</p>';
      } else {
        votesList.innerHTML = votes.map(v => {
          const stars = '★'.repeat(v.rating) + '☆'.repeat(5 - v.rating);
          const u = v.user || {};
          const composed = (u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (u.username || 'Usuario');
          const date = v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '';
          const comment = (v.comment || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `
            <div class="ingredient-item" data-vote-id="${v._id}">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${composed}</strong>
                <span style="color:#f59e0b;">${stars}</span>
              </div>
              <p style="margin:0.25rem 0; color:var(--gray-700);">${comment || '<i>Sin comentario</i>'}</p>
              <small style="color:var(--gray-500);">${date}</small>
            </div>
          `;
        }).join('');
      }

      // Try to fetch my vote to prefill form and enable delete
      try {
        const myRes = await fetch(`/api/votes/recipe/${currentVoteRecipe._id}/my-vote`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (myRes.ok) {
          const myVoteJson = await myRes.json();
          const myVote = (myVoteJson.data && myVoteJson.data.vote) ? myVoteJson.data.vote : null;
          if (myVote && myVote._id) {
            myVoteId = myVote._id;
            setStarValue(myVote.rating || 0);
            voteComment.value = myVote.comment || '';
            btnDeleteVote.style.display = 'inline-flex';
          } else {
            myVoteId = null;
            setStarValue(0);
            voteComment.value = '';
            btnDeleteVote.style.display = 'none';
          }
        }
      } catch {}

      // Pagination controls visibility
      btnPrevVotes.disabled = !pagination.hasPrevPage;
      btnNextVotes.disabled = !pagination.hasNextPage;

      // Return stats so caller can update cards
      return stats;
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error cargando opiniones', 'error');
    }
  }

  function updateRecipeCardStats(recipeId, averageRating, totalVotes) {
    const card = recipesGrid?.querySelector(`.card[data-id="${recipeId}"]`);
    if (!card) return;
    const avgEl = card.querySelector('[data-role="avg"]');
    const cntEl = card.querySelector('[data-role="count"]');
    if (avgEl) avgEl.textContent = (averageRating || 0).toFixed(1);
    if (cntEl) cntEl.textContent = totalVotes || 0;
  }

  async function submitVote(e) {
    e.preventDefault();
    if (!currentVoteRecipe) return;
    const rating = parseInt(starRating.dataset.value || '0', 10);
    if (!rating || rating < 1 || rating > 5) {
      showToast('Selecciona una calificación de 1 a 5 estrellas', 'warning');
      return;
    }

    const payload = {
      recipeId: currentVoteRecipe._id,
      rating,
      comment: voteComment.value.trim() || undefined,
    };

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || 'No se pudo registrar el voto';
        showToast(msg, 'error');
        return;
      }

      showToast('¡Voto registrado!', 'success');
      // Refresh stats/comments in modal and update card numbers using weighted average from stats
      const stats = await loadVotesAndStats();
      if (stats) {
        // Persist in local recipe cache so future modal openings show updated info immediately
        const idx = currentRecipes.findIndex(r => r._id === currentVoteRecipe._id);
        if (idx !== -1) {
          currentRecipes[idx].averageRating = stats.averageRating;
          currentRecipes[idx].totalVotes = stats.totalVotes;
          currentVoteRecipe.averageRating = stats.averageRating;
          currentVoteRecipe.totalVotes = stats.totalVotes;
        }
        updateRecipeCardStats(currentVoteRecipe._id, stats.averageRating, stats.totalVotes);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al enviar el voto', 'error');
    }
  }

  async function deleteVote() {
    if (!myVoteId) return;
    try {
      const res = await fetch(`/api/votes/${myVoteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('No se pudo eliminar el voto');
      showToast('Voto eliminado', 'success');
      myVoteId = null;
      setStarValue(0);
      voteComment.value = '';
      btnDeleteVote.style.display = 'none';
      const stats = await loadVotesAndStats();
      if (stats) {
        const idx = currentRecipes.findIndex(r => r._id === currentVoteRecipe._id);
        if (idx !== -1) {
          currentRecipes[idx].averageRating = stats.averageRating;
          currentRecipes[idx].totalVotes = stats.totalVotes;
          currentVoteRecipe.averageRating = stats.averageRating;
          currentVoteRecipe.totalVotes = stats.totalVotes;
        }
        updateRecipeCardStats(currentVoteRecipe._id, stats.averageRating, stats.totalVotes);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error eliminando voto', 'error');
    }
  }

  function setupEvents() {
    // Navbar
    btnLogout?.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });

    // Filters
    btnSearch?.addEventListener('click', loadRecipes);
    searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadRecipes(); });
    categoryFilter?.addEventListener('change', loadRecipes);
    difficultyFilter?.addEventListener('change', loadRecipes);

    // Grid actions
    recipesGrid?.addEventListener('click', (e) => {
      const btn = e.target.closest('.action-vote');
      if (!btn) return;
      const card = e.target.closest('.card');
      const id = card?.dataset.id;
      const recipe = currentRecipes.find(r => r._id === id);
      if (recipe) openVoteModal(recipe);
    });

    // Modal controls
    voteModalClose?.addEventListener('click', closeVoteModal);
    voteModal?.addEventListener('click', (e) => { if (e.target === voteModal) closeVoteModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && voteModal.style.display === 'block') closeVoteModal(); });

    // Voting
    voteForm?.addEventListener('submit', submitVote);
    btnDeleteVote?.addEventListener('click', deleteVote);

    // Pagination
  btnPrevVotes?.addEventListener('click', () => { if (votesPage > 1) { votesPage--; loadVotesAndStats(); }});
  btnNextVotes?.addEventListener('click', () => { votesPage++; loadVotesAndStats(); });

    // Initial stars render
    renderStars(0);
  }

  // Init
  (async function init() {
    await checkAuth();
    setupEvents();
    await loadRecipes();
  })();
})();
