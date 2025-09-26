// Configuración de la API
const API_BASE_URL = '/api';

// Forzar inicio de sesión fresco siempre que se ingrese a login/register
document.addEventListener('DOMContentLoaded', function() {
    enforceFreshLogin();
    setupEventListeners();
});

// Limpiar cualquier sesión previa al entrar a login/register
function enforceFreshLogin() {
    try {
        const isLoginPage = window.location.pathname.endsWith('/login.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
        const isRegisterPage = window.location.pathname.endsWith('/register.html');
        if (isLoginPage || isRegisterPage) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    } catch (e) {
        console.warn('No se pudo limpiar la sesión previa:', e);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Manejar login
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
            // Guardar token
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            showToast('success', 'Éxito', `Bienvenido ${data.data.user.firstName}!`);
            
            // Redirigir al dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            showToast('error', 'Error de autenticación', data.message);
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Manejar registro
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
            // Guardar token
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            showToast('success', 'Cuenta creada', `¡Bienvenido ${data.data.user.firstName}!`);
            
            // Redirigir al dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            showToast('error', 'Error de registro', data.message || 'No se pudo crear la cuenta');
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
        hideLoading();
    }
}

// Alternar visibilidad de contraseña
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Mostrar loading
function showLoading(message = 'Cargando...') {
    const loading = document.getElementById('loading');
    const loadingText = loading.querySelector('p');
    loadingText.textContent = message;
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
            <i class="fas ${iconMap[type]} toast-icon" style="color: var(--${type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'primary'}-color);"></i>
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