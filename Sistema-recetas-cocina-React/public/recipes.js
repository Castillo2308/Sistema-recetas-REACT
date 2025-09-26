// ===================================
// GESTIÓN DE RECETAS - FRONTEND
// Maneja la creación, edición, visualización y eliminación de recetas
// ===================================

// Configuración y variables globales
const API_BASE_URL = '/api';              // URL base de la API
let currentUser = null;                   // Usuario actual logueado
let recipes = [];                         // Lista de recetas cargadas
let ingredients = [];                     // Lista de ingredientes disponibles
let currentRecipeIngredients = [];        // Ingredientes de la receta actual en edición
let editingRecipeId = null;               // ID de la receta que se está editando
let ingredientsLoaded = false;            // Flag para controlar si se cargaron los ingredientes

// ===================================
// FUNCIONES AUXILIARES DE UI
// ===================================

/**
 * Retorna la clase CSS apropiada según el nivel de dificultad
 * @param {string} difficulty - Nivel de dificultad
 * @returns {string} Clase CSS correspondiente
 */
function getDifficultyClass(difficulty) {
    const map = {
        'Fácil': 'difficulty-easy',
        'Intermedio': 'difficulty-intermedio',
        'Difícil': 'difficulty-difícil'
    };
    return map[difficulty] || 'difficulty-intermedio';
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadRecipes();
    loadIngredients();
    setupEventListeners();
});

// Verificar autenticación
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(user);
        document.getElementById('userName').textContent = currentUser.firstName;
    } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
    }
    
    // Verificar token con el servidor
    fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            logout();
        }
    })
    .catch(error => {
        console.error('Error verificando token:', error);
        logout();
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Header/nav
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', logout);

    // Page header actions
    const btnAdd = document.getElementById('btnAddRecipe');
    if (btnAdd) btnAdd.addEventListener('click', showAddRecipeModal);

    // Search and filter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', searchRecipes);
    const btnSearch = document.getElementById('btnSearchRecipe');
    if (btnSearch) btnSearch.addEventListener('click', searchRecipes);
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) categoryFilter.addEventListener('change', filterRecipes);
    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) difficultyFilter.addEventListener('change', filterRecipes);

    // Formulario de receta
    const recipeForm = document.getElementById('recipeForm');
    if (recipeForm) recipeForm.addEventListener('submit', handleRecipeSubmit);

    // Preview de imagen
    const imageInput = document.getElementById('image');
    if (imageInput) imageInput.addEventListener('change', handleImagePreview);
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) imagePreview.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-image-preview');
        if (btn) removeImagePreview();
    });

    // Añadir ingrediente a la lista
    const btnAddIng = document.getElementById('btnAddRecipeIngredient');
    if (btnAddIng) btnAddIng.addEventListener('click', addIngredient);
    const ingredientsList = document.getElementById('ingredientsList');
    if (ingredientsList) ingredientsList.addEventListener('click', (e) => {
        const btn = e.target.closest('.ingredient-remove');
        if (btn) {
            const idx = btn.getAttribute('data-index');
            if (idx !== null) removeIngredient(parseInt(idx, 10));
        }
    });

    // Cerrar modales (X, cancelar, click fuera y Escape)
    const recipeModalClose = document.getElementById('recipeModalClose');
    if (recipeModalClose) recipeModalClose.addEventListener('click', closeRecipeModal);
    const recipeCancelBtn = document.getElementById('recipeCancelBtn');
    if (recipeCancelBtn) recipeCancelBtn.addEventListener('click', closeRecipeModal);
    const recipeModal = document.getElementById('recipeModal');
    if (recipeModal) recipeModal.addEventListener('click', (e) => { if (e.target === recipeModal) closeRecipeModal(); });
    const viewRecipeModal = document.getElementById('viewRecipeModal');
    if (viewRecipeModal) viewRecipeModal.addEventListener('click', (e) => { if (e.target === viewRecipeModal) closeViewRecipeModal(); });
    const viewClose = document.getElementById('viewRecipeModalClose');
    if (viewClose) viewClose.addEventListener('click', closeViewRecipeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.getElementById('recipeModal')?.classList.contains('show')) closeRecipeModal();
            if (document.getElementById('viewRecipeModal')?.classList.contains('show')) closeViewRecipeModal();
        }
    });

    // Delegación de acciones en el grid
    const grid = document.getElementById('recipesGrid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.recipe-card');
            const editBtn = e.target.closest('.edit-recipe');
            const delBtn = e.target.closest('.delete-recipe');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                if (id) editRecipe(id);
                e.stopPropagation();
                return;
            }
            if (delBtn) {
                const id = delBtn.getAttribute('data-id');
                if (id) deleteRecipe(id);
                e.stopPropagation();
                return;
            }
            if (card) {
                const id = card.getAttribute('data-id');
                if (id) viewRecipe(id);
            }
        });
    }
}

// Cargar recetas
async function loadRecipes() {
    try {
        showLoading();
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/recipes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            recipes = data.data.recipes;
            displayRecipes(recipes);
        } else {
            showToast('error', 'Error', 'No se pudieron cargar las recetas');
        }
    } catch (error) {
        console.error('Error cargando recetas:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Cargar ingredientes
async function loadIngredients() {
    try {
        // Mostrar estado de carga en el select si existe
        const select = document.getElementById('ingredientSelect');
        if (select) {
            select.disabled = true;
            select.innerHTML = '<option value="">Cargando ingredientes...</option>';
        }
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/ingredients`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            ingredients = data.data.ingredients;
            ingredientsLoaded = true;
            populateIngredientSelect();
        }
    } catch (error) {
        console.error('Error cargando ingredientes:', error);
    }
}

// Mostrar recetas
function displayRecipes(recipesToShow) {
    const recipesGrid = document.getElementById('recipesGrid');
    
    if (!recipesToShow || recipesToShow.length === 0) {
        recipesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-utensils" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">No hay recetas</h3>
                <p style="color: var(--gray-500);">Crea tu primera receta haciendo clic en "Agregar Receta"</p>
            </div>
        `;
        return;
    }
    
    recipesGrid.innerHTML = recipesToShow.map(recipe => `
        <div class="recipe-card" data-id="${recipe._id}">
            <img src="${recipe.image?.path ? '/' + recipe.image.path : 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}" 
                 alt="${recipe.title}" 
                 class="recipe-image">
            
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <p class="recipe-description">${recipe.description}</p>
                
                <div class="recipe-meta">
                    <div class="recipe-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${recipe.preparationTime + recipe.cookingTime} min</span>
                    </div>
                    <div class="recipe-meta-item">
                        <i class="fas fa-users"></i>
                        <span>${recipe.servings} porciones</span>
                    </div>
                    <div class="category-badge">${recipe.category}</div>
                    <div class="difficulty-badge ${getDifficultyClass(recipe.difficulty)}">${recipe.difficulty}</div>
                </div>
                
                <div class="recipe-actions">
                    <button class="btn-secondary edit-recipe" data-id="${recipe._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger delete-recipe" data-id="${recipe._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Fallback de imagen sin inline handlers
    const imgs = recipesGrid.querySelectorAll('.recipe-image');
    imgs.forEach(img => {
        img.addEventListener('error', () => {
            img.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
        });
    });
}

// Poblar select de ingredientes
function populateIngredientSelect() {
    const select = document.getElementById('ingredientSelect');
    if (!select) return;
    select.innerHTML = '';
    
    if (!ingredients || ingredients.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = ingredientsLoaded ? 'No hay ingredientes disponibles' : 'Cargando ingredientes...';
        opt.disabled = true;
        opt.selected = true;
        select.appendChild(opt);
        select.disabled = !ingredientsLoaded;
        return;
    }
    
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleccionar ingrediente';
    placeholder.selected = true;
    placeholder.disabled = true;
    select.appendChild(placeholder);
    
    ingredients.forEach(ingredient => {
        const option = document.createElement('option');
        option.value = ingredient._id;
        option.textContent = `${ingredient.name} (${ingredient.category})`;
        select.appendChild(option);
    });
    select.disabled = false;
}

// Mostrar modal de agregar receta
function showAddRecipeModal() {
    if (!currentUser) {
        showToast('warning', 'Autenticación requerida', 'Debes iniciar sesión para crear recetas.');
        return;
    }
    
    editingRecipeId = null;
    currentRecipeIngredients = [];
    document.getElementById('modalTitle').textContent = 'Agregar Nueva Receta';
    document.getElementById('recipeForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    updateIngredientsList();
    // Asegurar que el select esté poblado con lo más reciente
    if (!ingredientsLoaded) {
        loadIngredients().then(() => populateIngredientSelect());
    } else {
        populateIngredientSelect();
    }
    document.getElementById('recipeModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de receta
function closeRecipeModal() {
    document.getElementById('recipeModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Agregar ingrediente a la lista
function addIngredient() {
    const ingredientSelect = document.getElementById('ingredientSelect');
    const quantityInput = document.getElementById('quantity');
    const unitInput = document.getElementById('unit');
    
    const ingredientId = ingredientSelect.value;
    const quantity = quantityInput.value.trim();
    const unit = unitInput.value.trim();
    
    if (!ingredientId || !quantity || !unit) {
        showToast('warning', 'Campos incompletos', 'Selecciona un ingrediente y especifica cantidad y unidad');
        return;
    }
    
    // Verificar si ya existe
    if (currentRecipeIngredients.find(ing => ing.ingredient === ingredientId)) {
        showToast('warning', 'Ingrediente duplicado', 'Este ingrediente ya está en la lista');
        return;
    }
    
    const ingredient = ingredients.find(ing => ing._id === ingredientId);
    
    currentRecipeIngredients.push({
        ingredient: ingredientId,
        name: ingredient.name,
        quantity: quantity,
        unit: unit
    });
    
    // Limpiar campos
    ingredientSelect.value = '';
    quantityInput.value = '';
    unitInput.value = '';
    
    updateIngredientsList();
}

// Actualizar lista de ingredientes
function updateIngredientsList() {
    const ingredientsList = document.getElementById('ingredientsList');
    
    if (currentRecipeIngredients.length === 0) {
        ingredientsList.innerHTML = '<p style="color: var(--gray-500); padding: 1rem; text-align: center;">No hay ingredientes agregados</p>';
        return;
    }
    
    ingredientsList.innerHTML = currentRecipeIngredients.map((ingredient, index) => `
        <div class="ingredient-item">
            <div>
                <strong>${ingredient.name}</strong>
                <span> - ${ingredient.quantity} ${ingredient.unit}</span>
            </div>
            <button type="button" class="ingredient-remove" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Remover ingrediente
function removeIngredient(index) {
    currentRecipeIngredients.splice(index, 1);
    updateIngredientsList();
}

// Manejar preview de imagen
function handleImagePreview(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: var(--radius); object-fit: cover;">
                <button type="button" class="remove-image-preview" style="display: block; margin: 0.5rem auto; background: var(--error-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: var(--radius); cursor: pointer;">
                    Eliminar imagen
                </button>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        previewContainer.innerHTML = '';
    }
}

// Remover preview de imagen
function removeImagePreview() {
    document.getElementById('image').value = '';
    document.getElementById('imagePreview').innerHTML = '';
}

// Manejar envío de formulario
async function handleRecipeSubmit(event) {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    if (currentRecipeIngredients.length === 0) {
        showToast('warning', 'Ingredientes requeridos', 'Debes agregar al menos un ingrediente');
        return;
    }
    
    const formData = new FormData(form);
    
    // Agregar ingredientes como JSON
    formData.append('ingredients', JSON.stringify(currentRecipeIngredients));
    
    try {
        showLoading(editingRecipeId ? 'Actualizando receta...' : 'Creando receta...');
        
        const token = localStorage.getItem('token');
        const url = editingRecipeId ? 
            `${API_BASE_URL}/recipes/${editingRecipeId}` : 
            `${API_BASE_URL}/recipes`;
        const method = editingRecipeId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = { success: false, message: 'Respuesta inválida del servidor' };
        }
        
        if (data.success) {
            showToast('success', 'Éxito', editingRecipeId ? 'Receta actualizada correctamente' : 'Receta creada correctamente');
            closeRecipeModal();
            loadRecipes();
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

// Ver receta
async function viewRecipe(recipeId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayRecipeDetails(data.data.recipe);
            document.getElementById('viewRecipeModal').classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            showToast('error', 'Error', 'No se pudo cargar la receta');
        }
    } catch (error) {
        console.error('Error cargando receta:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    }
}

// Mostrar detalles de receta
function displayRecipeDetails(recipe) {
    document.getElementById('viewRecipeTitle').textContent = recipe.title;
    
    const recipeDetails = document.getElementById('recipeDetails');
    recipeDetails.innerHTML = `
        <div class="recipe-detail-header">
            <img src="${recipe.image?.path ? '/' + recipe.image.path : 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}" 
                 alt="${recipe.title}" 
                 class="recipe-detail-image">
            
            <div class="recipe-detail-info">
                <h3>${recipe.title}</h3>
                <p style="color: var(--gray-600); margin-bottom: 1rem;">${recipe.description}</p>
                
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
                        <strong class="difficulty-badge ${getDifficultyClass(recipe.difficulty)}">${recipe.difficulty}</strong>
                    </div>
                </div>
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
    `;

    const detailImg = recipeDetails.querySelector('.recipe-detail-image');
    if (detailImg) {
        detailImg.addEventListener('error', () => {
            detailImg.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
        });
    }
}

// Cerrar modal de ver receta
function closeViewRecipeModal() {
    document.getElementById('viewRecipeModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Editar receta
async function editRecipe(recipeId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const recipe = data.data.recipe;
            
            // Llenar formulario
            editingRecipeId = recipeId;
            document.getElementById('modalTitle').textContent = 'Editar Receta';
            document.getElementById('title').value = recipe.title;
            document.getElementById('category').value = recipe.category;
            document.getElementById('description').value = recipe.description;
            document.getElementById('preparationTime').value = recipe.preparationTime;
            document.getElementById('cookingTime').value = recipe.cookingTime;
            document.getElementById('servings').value = recipe.servings;
            document.getElementById('difficulty').value = recipe.difficulty;
            document.getElementById('instructions').value = recipe.instructions;
            
            // Cargar ingredientes
            currentRecipeIngredients = recipe.ingredients.map(ing => ({
                ingredient: ing.ingredient._id,
                name: ing.ingredient.name,
                quantity: ing.quantity,
                unit: ing.unit
            }));
            updateIngredientsList();
            
            document.getElementById('recipeModal').classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            showToast('error', 'Error', 'No se pudo cargar la receta para editar');
        }
    } catch (error) {
        console.error('Error cargando receta para editar:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    }
}

// Eliminar receta
async function deleteRecipe(recipeId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        showLoading('Eliminando receta...');
        
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('success', 'Éxito', 'Receta eliminada correctamente');
            loadRecipes();
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

// Buscar recetas
function searchRecipes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredRecipes = recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm)
    );
    displayRecipes(filteredRecipes);
}

// Filtrar recetas
function filterRecipes() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    
    let filteredRecipes = recipes;
    
    if (categoryFilter) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.category === categoryFilter);
    }
    
    if (difficultyFilter) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.difficulty === difficultyFilter);
    }
    
    displayRecipes(filteredRecipes);
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Mostrar loading
function showLoading(message = 'Cargando...') {
    const loading = document.getElementById('loading');
    const loadingText = loading.querySelector('p');
    if (loadingText) {
        loadingText.textContent = message;
    }
    loading.style.display = 'flex';
}

// Ocultar loading
function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'none';
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
            <i class="fas ${iconMap[type]} toast-icon"></i>
            <div class="toast-message">
                <div class="toast-title">${title}</div>
                <div class="toast-description">${message}</div>
            </div>
        </div>
        <button class="toast-close" data-toast-id="${toastId}">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) closeBtn.addEventListener('click', () => removeToast(toastId));
    
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