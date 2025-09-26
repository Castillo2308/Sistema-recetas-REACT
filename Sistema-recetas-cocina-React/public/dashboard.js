// ===================================
// DASHBOARD - LÓGICA PRINCIPAL
// Maneja la pantalla principal del usuario autenticado
// ===================================

// Configuración base de la API
const API_BASE_URL = '/api';
let currentUser = null; // Almacena datos del usuario actual

// ===================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ===================================

// Se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();    // Verifica que el usuario esté logueado
    loadDashboardData();  // Carga los datos del dashboard
});

// ===================================
// FUNCIONES DE AUTENTICACIÓN
// ===================================

/**
 * Verifica si el usuario está autenticado y tiene un token válido
 * Redirige al login si no está autenticado
 */
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

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        
        // Cargar estadísticas
        const [recipesResponse, ingredientsResponse, votesStatsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/recipes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/ingredients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/votes/stats`)
        ]);
        
        if (recipesResponse.ok) {
            const recipesData = await recipesResponse.json();
            const pag = recipesData?.data?.pagination || {};
            // Nuestro endpoint de recetas expone totalItems como conteo total
            const totalRecipes = pag.totalRecipes ?? pag.totalItems ?? recipesData?.data?.recipes?.length ?? 0;
            document.getElementById('totalRecipes').textContent = totalRecipes;
        }

        if (ingredientsResponse.ok) {
            const ingredientsData = await ingredientsResponse.json();
            const pagI = ingredientsData?.data?.pagination || {};
            // Ingredientes expone totalIngredients explícitamente
            const totalIngs = pagI.totalIngredients ?? pagI.totalItems ?? ingredientsData?.data?.ingredients?.length ?? 0;
            document.getElementById('totalIngredients').textContent = totalIngs;
        }
        
        // Cargar total de votos real
        if (votesStatsResponse.ok) {
            const votesStatsData = await votesStatsResponse.json();
            document.getElementById('totalVotes').textContent = votesStatsData.data?.totalVotes ?? 0;
        } else {
            document.getElementById('totalVotes').textContent = '0';
        }
        
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        showToast('error', 'Error', 'No se pudieron cargar las estadísticas');
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
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