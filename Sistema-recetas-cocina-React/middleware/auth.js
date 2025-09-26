// ===================================
// MIDDLEWARE DE AUTENTICACIÓN
// Maneja la verificación de tokens JWT para rutas protegidas
// ===================================

const jwt = require('jsonwebtoken');  // Librería para manejar JWT tokens
const User = require('../models/User'); // Modelo de usuario para verificar existencia

// Obtiene la clave secreta desde variables de entorno (más seguro)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_2024';

// ===================================
// MIDDLEWARE PRINCIPAL DE AUTENTICACIÓN
// ===================================

/**
 * Middleware que verifica si el usuario tiene un token JWT válido
 * Se usa en rutas que requieren autenticación (crear recetas, votar, etc.)
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extrae el header Authorization de la petición
    const authHeader = req.headers['authorization'];
    
    // Extrae el token del formato "Bearer TOKEN_AQUI"
    const token = authHeader && authHeader.split(' ')[1];

    // Si no hay token, rechaza la petición
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verifica que el token sea válido y no haya expirado
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Busca al usuario en la base de datos (sin incluir la contraseña)
    const user = await User.findById(decoded.userId).select('-password');

    // Verifica que el usuario exista y esté activo
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario inactivo'
      });
    }

    // Adjunta la información del usuario a la petición
    // Ahora en las rutas se puede acceder a req.user
    req.user = user;
    next(); // Continúa con la siguiente función
    
  } catch (error) {
    console.error('Error en autenticación:', error);
    
    // Manejo específico de errores de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    // Error cuando el token ha expirado
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado, por favor inicia sesión nuevamente'
      });
    }

    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ===================================
// MIDDLEWARE DE AUTENTICACIÓN OPCIONAL
// ===================================

/**
 * Middleware que NO requiere token, pero si está presente lo valida
 * Útil para rutas que pueden funcionar con o sin autenticación
 * (ej: ver recetas públicas, pero mostrar más info si el usuario está logueado)
 */

const optionalAuth = async (req, res, next) => {
  try {
    // Extrae el header Authorization si existe
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Si hay token, intenta validarlo
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      // Si el usuario existe y está activo, lo adjunta a la petición
      if (user && user.isActive) {
        req.user = user;
      }
    }

    // Siempre continúa, con o sin usuario autenticado
    next();
    
  } catch (error) {
    // Si hay error con el token, simplemente continuamos sin usuario
    // No retornamos error porque la autenticación es opcional
    next();
  }
};

// ===================================
// EXPORTACIÓN DE MIDDLEWARES
// ===================================

module.exports = {
  authenticateToken,  // Middleware que REQUIERE autenticación
  optionalAuth,      // Middleware que permite pero NO requiere autenticación
  JWT_SECRET
};