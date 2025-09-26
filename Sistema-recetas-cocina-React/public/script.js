// Configuración de la API
const API_BASE_URL = '/api';

// Estado global de la aplicación
let currentUser = null;
let currentRecipeId = null;
let currentPage = 1;
let isAuthenticated = false;

// Variables para filtros y búsqueda
let currentFilters = {
    search: '',
    category: '',
    difficulty: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
};

// Ingredientes temporales para el formulario de recetas
let tempIngredients = [];
let selectedIngredientId = null;

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aplicación iniciada');
    
    // Verificar autenticación al cargar
    checkAuthStatus();
    
    // Cargar contenido inicial
    loadRecipes();
    loadIngredients();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Configurar navegación
    setupNavigation();
});

// Verificar estado de autenticación
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        updateAuthUI(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.data.user;
            isAuthenticated = true;
            updateAuthUI(true);
            console.log('✅ Usuario autenticado:', currentUser.username);
        } else {
            localStorage.removeItem('token');
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        localStorage.removeItem('token');
        updateAuthUI(false);
    }
}

// Actualizar UI de autenticación
function updateAuthUI(authenticated) {
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');
    const userName = document.getElementById('user-name');
    const misRecetasLink = document.getElementById('mis-recetas-link');
    const gestionarIngredientesLink = document.getElementById('gestionar-ingredientes-link');
    const createIngredientBtn = document.getElementById('create-ingredient-btn');
    const gestionarIngredientesBtn = document.getElementById('gestionar-ingredientes-btn');
    const irRecetasLink = document.getElementById('ir-recetas-link');
    const irIngredientesLink = document.getElementById('ir-ingredientes-link');

    if (authenticated && currentUser) {
        navAuth.style.display = 'none';
        navUser.style.display = 'block';
        userName.textContent = currentUser.firstName;
        misRecetasLink.style.display = 'block';
        if (gestionarIngredientesLink) gestionarIngredientesLink.style.display = 'block';
        if (createIngredientBtn) createIngredientBtn.style.display = 'block';
        if (gestionarIngredientesBtn) gestionarIngredientesBtn.style.display = 'block';
        if (irRecetasLink) irRecetasLink.style.display = 'inline-flex';
        if (irIngredientesLink) irIngredientesLink.style.display = 'inline-flex';
    } else {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
        misRecetasLink.style.display = 'none';
        if (gestionarIngredientesLink) gestionarIngredientesLink.style.display = 'none';
        if (createIngredientBtn) createIngredientBtn.style.display = 'none';
        if (gestionarIngredientesBtn) gestionarIngredientesBtn.style.display = 'none';
        if (irRecetasLink) irRecetasLink.style.display = 'none';
        if (irIngredientesLink) irIngredientesLink.style.display = 'none';
    }

    isAuthenticated = authenticated;
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda de ingredientes en formulario de recetas
    const ingredientSearch = document.getElementById('ingredient-search');
    if (ingredientSearch) {
        ingredientSearch.addEventListener('input', debounce(searchIngredients, 300));
        ingredientSearch.addEventListener('blur', () => {
            setTimeout(() => hideIngredientSuggestions(), 150);
        });
    }

    // Búsqueda de ingredientes en sección principal
    const ingredientsSearch = document.getElementById('ingredients-search');
    if (ingredientsSearch) {
        ingredientsSearch.addEventListener('input', debounce(loadIngredients, 300));
    }

    // Vista previa de imagen
    const recipeImage = document.getElementById('recipe-image');
    if (recipeImage) {
        recipeImage.addEventListener('change', handleImagePreview);
    }

    // Rating con estrellas
    setupStarRating();

    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Cerrar dropdown de usuario al hacer clic fuera
    document.addEventListener('click', function(e) {
        const userMenu = document.querySelector('.user-menu');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenu && !userMenu.contains(e.target)) {
            userDropdown.classList.remove('show');
        }
    });
}

// Configurar navegación suave
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos los links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase active al link clickeado
            this.classList.add('active');
            
            // Obtener destino
            const targetId = this.getAttribute('href').substring(1);
            
            if (targetId === 'inicio') {
                scrollToTop();
            } else if (targetId) {
                scrollToSection(targetId);
            }
        });
    });
}

// Funciones de utilidad
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

// Manejo de autenticación
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = Object.fromEntries(formData);
    
    try {
        showLoading('Iniciando sesión...');
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.data.token);
            currentUser = data.data.user;
            isAuthenticated = true;
            updateAuthUI(true);
            closeModal('login-modal');
            showToast('success', 'Bienvenido', `Hola ${currentUser.firstName}! Has iniciado sesión correctamente.`);
            
            // Recargar recetas para mostrar las del usuario
            loadRecipes();
        } else {
            showToast('error', 'Error de autenticación', data.message);
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
        hideLoading();
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const registerData = Object.fromEntries(formData);
    
    try {
        showLoading('Creando cuenta...');
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.data.token);
            currentUser = data.data.user;
            isAuthenticated = true;
            updateAuthUI(true);
            closeModal('register-modal');
            showToast('success', 'Cuenta creada', `¡Bienvenido ${currentUser.firstName}! Tu cuenta ha sido creada exitosamente.`);
            
            // Recargar recetas
            loadRecipes();
        } else {
            showToast('error', 'Error de registro', data.message || 'No se pudo crear la cuenta');
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
        hideLoading();
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    isAuthenticated = false;
    updateAuthUI(false);
    
    // Cerrar dropdown
    document.getElementById('user-dropdown').classList.remove('show');
    
    showToast('success', 'Sesión cerrada', 'Has cerrado sesión correctamente.');
    
    // Recargar recetas públicas
    loadRecipes();
}

// Cargar recetas
async function loadRecipes(page = 1) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 12,
            ...currentFilters
        });
        
        // Procesar filtro de ordenamiento
        if (currentFilters.sortBy && currentFilters.sortOrder) {
            params.set('sortBy', currentFilters.sortBy);
            params.set('sortOrder', currentFilters.sortOrder);
        }
        
        showLoadingState('recipes-loading');
        
        const headers = {};
        if (isAuthenticated) {
            headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/recipes?${params}`, { headers });
        const data = await response.json();
        
        if (data.success) {
            displayRecipes(data.data.recipes);
            displayPagination(data.data.pagination, loadRecipes);
            currentPage = page;
        } else {
            showToast('error', 'Error', 'No se pudieron cargar las recetas');
        }
        
    } catch (error) {
        console.error('Error cargando recetas:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
        displayRecipes([]);
    } finally {
        hideLoadingState('recipes-loading');
    }
}

function displayRecipes(recipes) {
    const recipesGrid = document.getElementById('recipes-grid');
    
    if (!recipes || recipes.length === 0) {
        recipesGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-utensils text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron recetas</h3>
                <p class="text-gray-500">Intenta ajustar los filtros o crea una nueva receta.</p>
            </div>
        `;
        return;
    }
    
    recipesGrid.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" onclick="showRecipeDetail('${recipe._id}')">
            <img src="${recipe.image?.path ? '/' + recipe.image.path : 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}" 
                 alt="${recipe.title}" 
                 class="recipe-image"
                 loading="lazy"
                 onerror="this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'">
            
            <div class="recipe-content">
                <div class="recipe-header">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <p class="recipe-description">${recipe.description}</p>
                </div>
                
                <div class="recipe-meta">
                    <div class="recipe-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${recipe.preparationTime + recipe.cookingTime} min</span>
                    </div>
                    <div class="recipe-meta-item">
                        <i class="fas fa-users"></i>
                        <span>${recipe.servings} porciones</span>
                    </div>
                    <div class="recipe-meta-item difficulty-badge difficulty-${recipe.difficulty.toLowerCase()}">
                        ${recipe.difficulty}
                    </div>
                    <div class="recipe-meta-item category-badge">
                        ${recipe.category}
                    </div>
                </div>
                
                ${recipe.tags && recipe.tags.length > 0 ? `
                    <div class="recipe-tags">
                        ${recipe.tags.slice(0, 3).map(tag => `
                            <span class="recipe-tag">${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="recipe-footer">
                    <div class="recipe-author">
                        <i class="fas fa-user"></i>
                        por ${recipe.author?.firstName || 'Anónimo'}
                    </div>
                    <div class="recipe-rating">
                        <i class="fas fa-star"></i>
                        <span>${recipe.averageRating?.toFixed(1) || '0.0'} (${recipe.totalVotes || 0})</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Mostrar detalle de receta
async function showRecipeDetail(recipeId) {
    try {
        showLoadingState('recipe-detail-modal');
        
        const headers = {};
        if (isAuthenticated) {
            headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, { headers });
        const data = await response.json();
        
        if (data.success) {
            currentRecipeId = recipeId;
            displayRecipeDetail(data.data.recipe, data.data.votes, data.data.userVote);
            showModal('recipe-detail-modal');
        } else {
            showToast('error', 'Error', data.message);
        }
        
    } catch (error) {
        console.error('Error cargando receta:', error);
        showToast('error', 'Error', 'No se pudo cargar la receta');
    } finally {
        hideLoadingState('recipe-detail-modal');
    }
}

function displayRecipeDetail(recipe, votes = [], userVote = null) {
    const modal = document.getElementById('recipe-detail-modal');
    const title = document.getElementById('recipe-detail-title');
    const content = document.getElementById('recipe-detail-content');
    const actions = document.getElementById('recipe-actions');
    
    title.textContent = recipe.title;
    
    // Mostrar acciones si es el autor
    if (isAuthenticated && currentUser && recipe.author._id === currentUser.id) {
        actions.style.display = 'flex';
    } else {
        actions.style.display = 'none';
    }
    
    // Calcular estadísticas de votos
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    votes.forEach(vote => {
        ratingDistribution[vote.rating]++;
    });
    
    content.innerHTML = `
        <div class="recipe-detail-header">
            <img src="${recipe.image?.path ? '/' + recipe.image.path : 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}" 
                 alt="${recipe.title}" 
                 class="recipe-detail-image"
                 onerror="this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'">
            
            <div class="recipe-detail-info">
                <h3>${recipe.title}</h3>
                <p style="color: var(--gray-600); margin-bottom: var(--space-4);">${recipe.description}</p>
                
                <div class="recipe-detail-meta">
                    <div class="recipe-detail-meta-item">
                        <strong>${recipe.preparationTime}</strong>
                        <span>min preparación</span>
                    </div>
                    <div class="recipe-detail-meta-item">
                        <strong>${recipe.cookingTime}</strong>
                        <span>min cocción</span>
                    </div>
                    <div class="recipe-detail-meta-item">
                        <strong>${recipe.servings}</strong>
                        <span>porciones</span>
                    </div>
                    <div class="recipe-detail-meta-item">
                        <strong class="difficulty-badge difficulty-${recipe.difficulty.toLowerCase()}">${recipe.difficulty}</strong>
                    </div>
                </div>
                
                ${recipe.tags && recipe.tags.length > 0 ? `
                    <div class="recipe-tags" style="margin-top: var(--space-4);">
                        ${recipe.tags.map(tag => `<span class="recipe-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="recipe-ingredients">
            <h3><i class="fas fa-list"></i> Ingredientes</h3>
            <div class="recipe-ingredients-list">
                <ul>
                    ${recipe.ingredients.map(ing => `
                        <li>
                            <span><strong>${ing.ingredient?.name || 'Ingrediente'}</strong></span>
                            <span>${ing.quantity} ${ing.unit}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
        
        <div class="recipe-instructions">
            <h3><i class="fas fa-clipboard-list"></i> Instrucciones</h3>
            <div class="recipe-instructions-content">${recipe.instructions}</div>
        </div>
        
        <div class="recipe-votes">
            <h3><i class="fas fa-star"></i> Calificaciones y Comentarios</h3>
            
            <div class="recipe-stats">
                <div class="recipe-stats-item">
                    <strong>${recipe.averageRating?.toFixed(1) || '0.0'}</strong>
                    <span>Promedio</span>
                </div>
                <div class="recipe-stats-item">
                    <strong>${recipe.totalVotes || 0}</strong>
                    <span>Votos</span>
                </div>
                <div class="recipe-stats-item">
                    <strong>${recipe.author?.firstName || 'Anónimo'}</strong>
                    <span>Autor</span>
                </div>
            </div>
            
            ${isAuthenticated && (!currentUser || recipe.author._id !== currentUser.id) ? `
                <div style="margin-bottom: var(--space-6);">
                    <button class="btn btn-primary" onclick="showVoteModal('${recipe._id}')">
                        <i class="fas fa-star"></i>
                        ${userVote ? 'Actualizar Calificación' : 'Calificar Receta'}
                    </button>
                </div>
            ` : ''}
            
            <div class="votes-list">
                ${votes.length > 0 ? votes.map(vote => `
                    <div class="vote-item">
                        <div class="vote-header">
                            <span class="vote-author">${vote.user?.firstName || 'Usuario'} ${vote.user?.lastName || ''}</span>
                            <div class="vote-rating">
                                ${'★'.repeat(vote.rating)}${'☆'.repeat(5 - vote.rating)}
                            </div>
                        </div>
                        ${vote.comment ? `<div class="vote-comment">${vote.comment}</div>` : ''}
                        <div class="vote-date">${new Date(vote.createdAt).toLocaleDateString()}</div>
                    </div>
                `).join('') : '<p style="color: var(--gray-500); font-style: italic;">Aún no hay calificaciones para esta receta.</p>'}
            </div>
        </div>
    `;
}

// Búsqueda y filtros
function searchRecipes() {
    const searchInput = document.getElementById('search-input');
    currentFilters.search = searchInput.value.trim();
    currentPage = 1;
    loadRecipes(1);
}

function applyFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    currentFilters.category = categoryFilter.value;
    currentFilters.difficulty = difficultyFilter.value;
    
    // Procesar ordenamiento
    const sortValue = sortFilter.value.split(':');
    currentFilters.sortBy = sortValue[0];
    currentFilters.sortOrder = sortValue[1];
    
    currentPage = 1;
    loadRecipes(1);
}

function clearFilters() {
    // Limpiar filtros
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('difficulty-filter').value = '';
    document.getElementById('sort-filter').value = 'createdAt:desc';
    
    // Resetear filtros
    currentFilters = {
        search: '',
        category: '',
        difficulty: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    };
    
    currentPage = 1;
    loadRecipes(1);
}

// Manejo de ingredientes
async function loadIngredients() {
    try {
        const searchTerm = document.getElementById('ingredients-search')?.value || '';
        const category = document.getElementById('ingredients-category-filter')?.value || '';
        
        const params = new URLSearchParams({
            limit: 50,
            search: searchTerm,
            category: category
        });
        
        showLoadingState('ingredients-loading');
        
        const response = await fetch(`${API_BASE_URL}/ingredients?${params}`);
        const data = await response.json();
        
        if (data.success) {
            displayIngredients(data.data.ingredients);
        } else {
            showToast('error', 'Error', 'No se pudieron cargar los ingredientes');
        }
        
    } catch (error) {
        console.error('Error cargando ingredientes:', error);
        displayIngredients([]);
    } finally {
        hideLoadingState('ingredients-loading');
    }
}

function displayIngredients(ingredients) {
    const ingredientsGrid = document.getElementById('ingredients-grid');
    
    if (!ingredients || ingredients.length === 0) {
        ingredientsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-carrot text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron ingredientes</h3>
                <p class="text-gray-500">Intenta ajustar la búsqueda o crea un nuevo ingrediente.</p>
            </div>
        `;
        return;
    }
    
    ingredientsGrid.innerHTML = ingredients.map(ingredient => `
        <div class="ingredient-card">
            <h3 class="ingredient-name">${ingredient.name}</h3>
            <div class="ingredient-category">${ingredient.category}</div>
            ${ingredient.description ? `<p class="ingredient-description">${ingredient.description}</p>` : ''}
            ${ingredient.commonUnits && ingredient.commonUnits.length > 0 ? `
                <div class="ingredient-units">
                    <strong>Unidades comunes:</strong> ${ingredient.commonUnits.join(', ')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Búsqueda de ingredientes para recetas
async function searchIngredients() {
    const searchInput = document.getElementById('ingredient-search');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm.length < 2) {
        hideIngredientSuggestions();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/ingredients/search/${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (data.success) {
            displayIngredientSuggestions(data.data.ingredients);
        }
    } catch (error) {
        console.error('Error buscando ingredientes:', error);
    }
}

function displayIngredientSuggestions(ingredients) {
    const suggestionsContainer = document.getElementById('ingredient-suggestions');
    
    if (ingredients.length === 0) {
        hideIngredientSuggestions();
        return;
    }
    
    suggestionsContainer.innerHTML = ingredients.map(ingredient => `
        <div class="ingredient-suggestion" onclick="selectIngredient('${ingredient._id}', '${ingredient.name}')">
            <strong>${ingredient.name}</strong>
            <small> - ${ingredient.category}</small>
        </div>
    `).join('');
    
    suggestionsContainer.classList.add('show');
}

function selectIngredient(ingredientId, ingredientName) {
    selectedIngredientId = ingredientId;
    document.getElementById('ingredient-search').value = ingredientName;
    hideIngredientSuggestions();
}

function hideIngredientSuggestions() {
    document.getElementById('ingredient-suggestions').classList.remove('show');
}

function addIngredient() {
    const ingredientName = document.getElementById('ingredient-search').value.trim();
    const quantity = document.getElementById('ingredient-quantity').value.trim();
    const unit = document.getElementById('ingredient-unit').value.trim();
    
    if (!ingredientName || !quantity || !unit || !selectedIngredientId) {
        showToast('warning', 'Campos incompletos', 'Debes seleccionar un ingrediente y especificar cantidad y unidad.');
        return;
    }
    
    // Verificar que no esté duplicado
    if (tempIngredients.find(ing => ing.ingredient === selectedIngredientId)) {
        showToast('warning', 'Ingrediente duplicado', 'Este ingrediente ya está en la lista.');
        return;
    }
    
    // Agregar a lista temporal
    tempIngredients.push({
        ingredient: selectedIngredientId,
        name: ingredientName,
        quantity: quantity,
        unit: unit
    });
    
    // Limpiar campos
    document.getElementById('ingredient-search').value = '';
    document.getElementById('ingredient-quantity').value = '';
    document.getElementById('ingredient-unit').value = '';
    selectedIngredientId = null;
    
    // Actualizar visualización
    updateIngredientsDisplay();
}

function updateIngredientsDisplay() {
    const ingredientsList = document.getElementById('ingredients-list');
    
    if (tempIngredients.length === 0) {
        ingredientsList.innerHTML = '<p style="color: var(--gray-500); font-style: italic;">No hay ingredientes agregados.</p>';
        return;
    }
    
    ingredientsList.innerHTML = tempIngredients.map((ingredient, index) => `
        <div class="ingredient-item">
            <div class="ingredient-info">
                <strong>${ingredient.name}</strong>
                <span>${ingredient.quantity} ${ingredient.unit}</span>
            </div>
            <button type="button" class="ingredient-remove" onclick="removeIngredient(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeIngredient(index) {
    tempIngredients.splice(index, 1);
    updateIngredientsDisplay();
}

// Manejo de formulario de recetas
async function handleRecipeSubmit(event) {
    event.preventDefault();
    
    if (!isAuthenticated) {
        showToast('warning', 'Autenticación requerida', 'Debes iniciar sesión para crear recetas.');
        return;
    }
    
    if (tempIngredients.length === 0) {
        showToast('warning', 'Ingredientes requeridos', 'Debes agregar al menos un ingrediente.');
        return;
    }
    
    const formData = new FormData(event.target);
    
    // Agregar ingredientes
    formData.append('ingredients', JSON.stringify(tempIngredients));
    
    try {
        showLoading('Guardando receta...');
        
        const isEdit = currentRecipeId && currentRecipeId !== 'new';
        const url = isEdit ? `${API_BASE_URL}/recipes/${currentRecipeId}` : `${API_BASE_URL}/recipes`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('create-recipe-modal');
            showToast('success', isEdit ? 'Receta actualizada' : 'Receta creada', 
                     isEdit ? 'La receta se ha actualizado correctamente.' : 'Tu receta se ha creado exitosamente.');
            
            // Resetear formulario
            resetRecipeForm();
            
            // Recargar recetas
            loadRecipes(currentPage);
        } else {
            showToast('error', 'Error', data.message || 'No se pudo guardar la receta');
        }
        
    } catch (error) {
        console.error('Error guardando receta:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

function resetRecipeForm() {
    document.getElementById('recipe-form').reset();
    tempIngredients = [];
    selectedIngredientId = null;
    currentRecipeId = null;
    updateIngredientsDisplay();
    removeImagePreview();
    document.getElementById('recipe-modal-title').textContent = 'Crear Nueva Receta';
    document.getElementById('recipe-submit-btn').textContent = 'Crear Receta';
}

// Editar receta
function editRecipe() {
    if (!currentRecipeId) return;
    
    // Cargar datos de la receta en el formulario
    loadRecipeForEdit(currentRecipeId);
    closeModal('recipe-detail-modal');
    showCreateRecipeModal();
}

async function loadRecipeForEdit(recipeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const recipe = data.data.recipe;
            
            // Llenar formulario
            document.getElementById('recipe-title').value = recipe.title;
            document.getElementById('recipe-category').value = recipe.category;
            document.getElementById('recipe-description').value = recipe.description;
            document.getElementById('recipe-prep-time').value = recipe.preparationTime;
            document.getElementById('recipe-cook-time').value = recipe.cookingTime;
            document.getElementById('recipe-servings').value = recipe.servings;
            document.getElementById('recipe-difficulty').value = recipe.difficulty;
            document.getElementById('recipe-instructions').value = recipe.instructions;
            document.getElementById('recipe-tags').value = recipe.tags ? recipe.tags.join(', ') : '';
            document.getElementById('recipe-public').checked = recipe.isPublic;
            
            // Cargar ingredientes
            tempIngredients = recipe.ingredients.map(ing => ({
                ingredient: ing.ingredient._id,
                name: ing.ingredient.name,
                quantity: ing.quantity,
                unit: ing.unit
            }));
            updateIngredientsDisplay();
            
            // Actualizar títulos
            document.getElementById('recipe-modal-title').textContent = 'Editar Receta';
            document.getElementById('recipe-submit-btn').textContent = 'Actualizar Receta';
            
            currentRecipeId = recipeId;
        }
    } catch (error) {
        console.error('Error cargando receta para editar:', error);
        showToast('error', 'Error', 'No se pudo cargar la receta');
    }
}

// Eliminar receta
async function deleteRecipe() {
    if (!currentRecipeId) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        showLoading('Eliminando receta...');
        
        const response = await fetch(`${API_BASE_URL}/recipes/${currentRecipeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('recipe-detail-modal');
            showToast('success', 'Receta eliminada', 'La receta se ha eliminado correctamente.');
            
            // Recargar recetas
            loadRecipes(currentPage);
        } else {
            showToast('error', 'Error', data.message || 'No se pudo eliminar la receta');
        }
        
    } catch (error) {
        console.error('Error eliminando receta:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Manejo de votaciones
function showVoteModal(recipeId) {
    if (!isAuthenticated) {
        showToast('warning', 'Autenticación requerida', 'Debes iniciar sesión para calificar recetas.');
        return;
    }
    
    currentRecipeId = recipeId;
    showModal('vote-modal');
}

function setupStarRating() {
    const starRating = document.getElementById('star-rating');
    const ratingInput = document.getElementById('vote-rating');
    
    if (!starRating) return;
    
    const stars = starRating.querySelectorAll('i');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = index + 1;
            ratingInput.value = rating;
            
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
        
        star.addEventListener('mouseenter', () => {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.style.color = 'var(--warning-500)';
                } else {
                    s.style.color = 'var(--gray-300)';
                }
            });
        });
    });
    
    starRating.addEventListener('mouseleave', () => {
        const currentRating = parseInt(ratingInput.value) || 0;
        stars.forEach((s, i) => {
            if (i < currentRating) {
                s.style.color = 'var(--warning-500)';
            } else {
                s.style.color = 'var(--gray-300)';
            }
        });
    });
}

async function handleVoteSubmit(event) {
    event.preventDefault();
    
    if (!isAuthenticated) {
        showToast('warning', 'Autenticación requerida', 'Debes iniciar sesión para votar.');
        return;
    }
    
    const formData = new FormData(event.target);
    const voteData = {
        recipeId: currentRecipeId,
        rating: parseInt(formData.get('rating')),
        comment: formData.get('comment')
    };
    
    if (!voteData.rating) {
        showToast('warning', 'Calificación requerida', 'Debes seleccionar una calificación.');
        return;
    }
    
    try {
        showLoading('Enviando calificación...');
        
        const response = await fetch(`${API_BASE_URL}/votes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(voteData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('vote-modal');
            showToast('success', 'Calificación enviada', 'Tu calificación se ha registrado correctamente.');
            
            // Recargar detalle de receta si está abierto
            if (document.getElementById('recipe-detail-modal').classList.contains('show')) {
                showRecipeDetail(currentRecipeId);
            }
            
            // Recargar lista de recetas
            loadRecipes(currentPage);
        } else {
            showToast('error', 'Error', data.message || 'No se pudo enviar la calificación');
        }
        
    } catch (error) {
        console.error('Error enviando voto:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Manejo de ingredientes
async function handleIngredientSubmit(event) {
    event.preventDefault();
    
    if (!isAuthenticated) {
        showToast('warning', 'Autenticación requerida', 'Debes iniciar sesión para crear ingredientes.');
        return;
    }
    
    const formData = new FormData(event.target);
    const ingredientData = Object.fromEntries(formData);
    
    try {
        showLoading('Creando ingrediente...');
        
        const response = await fetch(`${API_BASE_URL}/ingredients`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ingredientData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('create-ingredient-modal');
            showToast('success', 'Ingrediente creado', 'El ingrediente se ha creado correctamente.');
            
            // Resetear formulario
            document.getElementById('ingredient-form').reset();
            
            // Recargar ingredientes
            loadIngredients();
        } else {
            showToast('error', 'Error', data.message || 'No se pudo crear el ingrediente');
        }
        
    } catch (error) {
        console.error('Error creando ingrediente:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Manejo de imágenes
function handleImagePreview(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        removeImagePreview();
    }
}

function removeImagePreview() {
    const previewContainer = document.getElementById('image-preview');
    const fileInput = document.getElementById('recipe-image');
    
    previewContainer.style.display = 'none';
    fileInput.value = '';
}

// Funciones de UI
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    // Resetear formularios al cerrar
    if (modalId === 'create-recipe-modal') {
        resetRecipeForm();
    } else if (modalId === 'vote-modal') {
        document.getElementById('vote-form').reset();
        document.getElementById('vote-rating').value = '';
        const stars = document.querySelectorAll('#star-rating i');
        stars.forEach(star => star.classList.remove('active'));
    }
}

function showLoginModal() {
    closeModal('register-modal');
    showModal('login-modal');
}

function showRegisterModal() {
    closeModal('login-modal');
    showModal('register-modal');
}

function showCreateRecipeModal() {
    if (!isAuthenticated) {
        showToast('warning', 'Autenticación requerida', 'Debes iniciar sesión para crear recetas.');
        showLoginModal();
        return;
    }
    
    resetRecipeForm();
    showModal('create-recipe-modal');
}

function showCreateIngredientModal() {
    if (!isAuthenticated) {
        showToast('warning', 'Autenticación requerida', 'Debes iniciar sesión para crear ingredientes.');
        showLoginModal();
        return;
    }
    
    showModal('create-ingredient-modal');
}

function showProfileModal() {
    // TODO: Implementar modal de perfil
    showToast('info', 'Próximamente', 'La funcionalidad de perfil estará disponible pronto.');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('show');
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('show');
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Estados de carga
function showLoading(message = 'Cargando...') {
    // TODO: Implementar overlay de carga global
    console.log('Loading:', message);
}

function hideLoading() {
    // TODO: Ocultar overlay de carga global
    console.log('Loading hidden');
}

function showLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'flex';
    }
}

function hideLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

// Paginación
function displayPagination(pagination, loadFunction) {
    const paginationContainer = document.getElementById('pagination');
    
    if (!pagination || pagination.totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    const { currentPage, totalPages, hasPrevPage, hasNextPage } = pagination;
    
    let paginationHTML = '';
    
    // Botón anterior
    paginationHTML += `
        <button ${!hasPrevPage ? 'disabled' : ''} onclick="${loadFunction.name}(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Páginas
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button onclick="${loadFunction.name}(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += '<span>...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button ${i === currentPage ? 'class="active"' : ''} onclick="${loadFunction.name}(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span>...</span>';
        }
        paginationHTML += `<button onclick="${loadFunction.name}(${totalPages})">${totalPages}</button>`;
    }
    
    // Botón siguiente
    paginationHTML += `
        <button ${!hasNextPage ? 'disabled' : ''} onclick="${loadFunction.name}(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Sistema de notificaciones toast
function showToast(type, title, message) {
    const toastContainer = document.getElementById('toast-container');
    const toastId = 'toast-' + Date.now();
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${iconMap[type]} toast-icon" style="color: var(--${type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'primary'}-500);"></i>
            <div class="toast-message">
                <div class="toast-title">${title}</div>
                <div class="toast-description">${message}</div>
            </div>
        </div>
        <button class="toast-close" onclick="removeToast('${toastId}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
        removeToast(toastId);
    }, 5000);
}

function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.remove();
    }
}

// Manejo de errores global
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    showToast('error', 'Error inesperado', 'Ocurrió un error inesperado. Por favor, recarga la página.');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rechazada:', e.reason);
    showToast('error', 'Error de conexión', 'Problema de conectividad. Verifica tu conexión a internet.');
});