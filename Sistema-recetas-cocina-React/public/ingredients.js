// Configuración de la API
const API_BASE_URL = '/api';
let currentUser = null;
let ingredients = [];
let editingIngredientId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadIngredients();
    setupEventListeners();
});

// (Se elimina la implementación duplicada de checkAuthStatus; la versión completa está más abajo)

// Configurar event listeners
function setupEventListeners() {
    // Botón agregar ingrediente
    const btnAdd = document.getElementById('btnAddIngredient');
    if (btnAdd) btnAdd.addEventListener('click', showAddIngredientModal);

    // Buscar
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', searchIngredients);

    // Filtro
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) categoryFilter.addEventListener('change', filterIngredients);

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', logout);

    // Formulario de ingrediente
    const ingredientForm = document.getElementById('ingredientForm');
    if (ingredientForm) ingredientForm.addEventListener('submit', handleIngredientSubmit);

    // Cerrar modal (X y botón cancelar)
    const modalClose = document.getElementById('ingredientModalClose');
    if (modalClose) modalClose.addEventListener('click', closeIngredientModal);
    const cancelBtn = document.getElementById('ingredientCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeIngredientModal);

    // Cerrar modal al hacer click fuera del contenido
    const modal = document.getElementById('ingredientModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeIngredientModal();
        });
    }

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const isOpen = document.getElementById('ingredientModal')?.classList.contains('show');
            if (isOpen) closeIngredientModal();
        }
    });

    // Delegación de eventos para editar/eliminar
    const grid = document.getElementById('ingredientsGrid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-ingredient');
            const deleteBtn = e.target.closest('.delete-ingredient');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                if (id) editIngredient(id);
            } else if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                if (id) deleteIngredient(id);
            }
        });
    }
}

// Cargar ingredientes
async function loadIngredients() {
    try {
        showLoading();
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/ingredients`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            ingredients = data.data.ingredients;
            displayIngredients(ingredients);
        } else {
            showToast('error', 'Error', 'No se pudieron cargar los ingredientes');
        }
    } catch (error) {
        console.error('Error cargando ingredientes:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Mostrar ingredientes
function displayIngredients(ingredientsToShow) {
    const ingredientsGrid = document.getElementById('ingredientsGrid');
    
    if (!ingredientsToShow || ingredientsToShow.length === 0) {
        ingredientsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-carrot" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">No hay ingredientes</h3>
                <p style="color: var(--gray-500);">Crea tu primer ingrediente haciendo clic en "Agregar Ingrediente"</p>
            </div>
        `;
        return;
    }
    
    ingredientsGrid.innerHTML = ingredientsToShow.map(ingredient => `
        <div class="ingredient-card">
            <div class="ingredient-content">
                <h3 class="ingredient-name">${ingredient.name}</h3>
                <div class="category-badge">${ingredient.category}</div>
                
                ${ingredient.description ? `
                    <p class="ingredient-description">${ingredient.description}</p>
                ` : ''}
                
                ${ingredient.commonUnits && ingredient.commonUnits.length > 0 ? `
                    <div style="margin-top: 1rem;">
                        <strong style="font-size: 0.875rem; color: var(--gray-700);">Unidades comunes:</strong>
                        <div style="margin-top: 0.5rem;">
                            ${ingredient.commonUnits.map(unit => `
                                <span style="background: var(--gray-100); color: var(--gray-700); padding: 0.25rem 0.5rem; border-radius: var(--radius); font-size: 0.75rem; margin-right: 0.5rem; display: inline-block; margin-bottom: 0.25rem;">${unit}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="ingredient-actions">
                    <button class="btn-secondary edit-ingredient" data-id="${ingredient._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger delete-ingredient" data-id="${ingredient._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Mostrar modal de agregar ingrediente
function showAddIngredientModal() {
    if (!currentUser) {
        showToast('warning', 'Autenticación requerida', 'Debes iniciar sesión para crear ingredientes.');
        return;
    }
    
    editingIngredientId = null;
    document.getElementById('modalTitle').textContent = 'Agregar Nuevo Ingrediente';
    document.getElementById('ingredientForm').reset();
    document.getElementById('ingredientModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de ingrediente
function closeIngredientModal() {
    document.getElementById('ingredientModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

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

// Manejar envío de formulario
async function handleIngredientSubmit(event) {
    event.preventDefault();
    const form = event.target;
    // Validación nativa visible dentro del modal
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const raw = Object.fromEntries(formData);
    const ingredientData = {};
    // Normalizar campos
    if (raw.name) ingredientData.name = String(raw.name).trim();
    if (raw.category) ingredientData.category = String(raw.category).trim();
    if (raw.description) ingredientData.description = String(raw.description).trim();
    if (raw.commonUnits) {
        // backend acepta array o string JSON; enviaremos array limpio
        ingredientData.commonUnits = String(raw.commonUnits)
            .split(',')
            .map(u => u.trim())
            .filter(Boolean);
    }
    
    // commonUnits ya se procesó arriba a un arreglo
    
    try {
        showLoading(editingIngredientId ? 'Actualizando ingrediente...' : 'Creando ingrediente...');
        
        const token = localStorage.getItem('token');
        const url = editingIngredientId ? 
            `${API_BASE_URL}/ingredients/${editingIngredientId}` : 
            `${API_BASE_URL}/ingredients`;
        const method = editingIngredientId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ingredientData)
        });
        
        let data;
        try {
            data = await response.json();
        } catch (_) {
            data = { success: false, message: 'Respuesta inválida del servidor' };
        }
        
        if (data.success) {
            showToast('success', 'Éxito', editingIngredientId ? 'Ingrediente actualizado correctamente' : 'Ingrediente creado correctamente');
            closeIngredientModal();
            loadIngredients();
        } else {
            showToast('error', 'Error', data.message || 'No se pudo guardar el ingrediente');
            // Mantener el modal abierto para permitir correcciones
        }
        
    } catch (error) {
        console.error('Error guardando ingrediente:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Editar ingrediente
async function editIngredient(ingredientId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/ingredients/${ingredientId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const ingredient = data.data.ingredient;
            
            // Llenar formulario
            editingIngredientId = ingredientId;
            document.getElementById('modalTitle').textContent = 'Editar Ingrediente';
            document.getElementById('name').value = ingredient.name;
            document.getElementById('category').value = ingredient.category;
            document.getElementById('description').value = ingredient.description || '';
            document.getElementById('commonUnits').value = ingredient.commonUnits ? ingredient.commonUnits.join(', ') : '';
            
            document.getElementById('ingredientModal').classList.add('show');
        } else {
            showToast('error', 'Error', 'No se pudo cargar el ingrediente para editar');
        }
    } catch (error) {
        console.error('Error cargando ingrediente para editar:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    }
}

// Eliminar ingrediente
async function deleteIngredient(ingredientId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingrediente? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        showLoading('Eliminando ingrediente...');
        
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/ingredients/${ingredientId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('success', 'Éxito', 'Ingrediente eliminado correctamente');
            loadIngredients();
        } else {
            showToast('error', 'Error', data.message || 'No se pudo eliminar el ingrediente');
        }
        
    } catch (error) {
        console.error('Error eliminando ingrediente:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Buscar ingredientes
function searchIngredients() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredIngredients = ingredients.filter(ingredient => 
        ingredient.name.toLowerCase().includes(searchTerm) ||
        ingredient.description?.toLowerCase().includes(searchTerm) ||
        ingredient.category.toLowerCase().includes(searchTerm)
    );
    displayIngredients(filteredIngredients);
}

// Filtrar ingredientes
function filterIngredients() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredIngredients = ingredients;
    
    if (categoryFilter) {
        filteredIngredients = filteredIngredients.filter(ingredient => ingredient.category === categoryFilter);
    }
    
    displayIngredients(filteredIngredients);
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
    if (!loading) return;
    const loadingText = loading.querySelector('p');
    if (loadingText) loadingText.textContent = message;
    loading.style.display = 'flex';
}

// Ocultar loading
function hideLoading() {
    const loading = document.getElementById('loading');
    if (!loading) return;
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
    // Listener de cierre para respetar CSP
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => removeToast(toastId));
    }
    
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

// Exponer funciones en window para uso desde atributos onclick en el HTML
window.showAddIngredientModal = showAddIngredientModal;
window.closeIngredientModal = closeIngredientModal;
window.logout = logout;
window.searchIngredients = searchIngredients;
window.filterIngredients = filterIngredients;
window.editIngredient = editIngredient;
window.deleteIngredient = deleteIngredient;
window.removeToast = removeToast;