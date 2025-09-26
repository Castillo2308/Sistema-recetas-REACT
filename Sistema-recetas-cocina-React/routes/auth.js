// ===================================
// RUTAS DE AUTENTICACIÓN
// Maneja el registro, login, verificación y perfil de usuarios
// ===================================

const express = require('express');        // Framework de rutas
const jwt = require('jsonwebtoken');       // Manejo de tokens JWT
const User = require('../models/User');    // Modelo de usuario
const { authenticateToken } = require('../middleware/auth'); // Middleware de autenticación

// Crear router de Express
const router = express.Router();

// Obtener la clave secreta JWT desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_2024';

// ===================================
// FUNCIÓN AUXILIAR PARA CREAR TOKENS
// ===================================

/**
 * Genera un token JWT para un usuario
 * @param {Object} user - Objeto del usuario
 * @returns {String} Token JWT firmado
 */
function signToken(user) {
  return jwt.sign(
    { userId: user._id },  // Payload del token (información del usuario)
    JWT_SECRET,            // Clave secreta para firmar
    { expiresIn: '7d' }    // El token expira en 7 días
  );
}

// ===================================
// RUTAS DE AUTENTICACIÓN
// ===================================

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en el sistema
 * Crea automáticamente un token JWT para login inmediato
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Usuario o email ya registrado' });
    }

    const user = await User.create({ username, email, password, firstName, lastName });
    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado',
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          fullName: user.fullName,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Login (acepta username o email en campo login)
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ success: false, message: 'Credenciales incompletas' });
    }

    const user = await User.findOne({ $or: [{ username: login }, { email: login }] });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Verificación de token para frontend
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error verificando token' });
  }
});

module.exports = router;
