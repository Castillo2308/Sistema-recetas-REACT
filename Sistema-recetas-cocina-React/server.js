// ===================================
// SISTEMA DE RECETAS DE COCINA
// Servidor principal de la aplicación
// ===================================

// Importación de librerías principales
const express = require('express');           // Framework web para Node.js
const cors = require('cors');                 // Middleware para permitir CORS (Cross-Origin Resource Sharing)
const helmet = require('helmet');             // Middleware de seguridad para headers HTTP
const rateLimit = require('express-rate-limit'); // Limitador de peticiones para prevenir ataques
const path = require('path');                 // Utilidad para manejar rutas de archivos
require('dotenv').config();                   // Carga variables de entorno desde archivo .env

// Importar configuración de base de datos
const connectDB = require('./config/database');

// Importar todas las rutas de la API
const authRoutes = require('./routes/auth');           // Rutas de autenticación (login, register)
const recipeRoutes = require('./routes/recipes');     // Rutas para gestionar recetas
const ingredientRoutes = require('./routes/ingredients'); // Rutas para gestionar ingredientes
const voteRoutes = require('./routes/votes');         // Rutas para sistema de calificaciones

// Crear la aplicación Express
const app = express();

// ===================================
// CONFIGURACIÓN DE BASE DE DATOS
// ===================================
// Establece conexión con MongoDB usando la configuración definida
connectDB();

// ===================================
// CONFIGURACIÓN DE SEGURIDAD
// ===================================
// Helmet configura headers de seguridad automáticamente
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],                    // Solo permite recursos del mismo origen
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'], // Estilos CSS permitidos
      scriptSrc: ["'self'"],                     // Solo scripts del mismo origen (sin inline)
      imgSrc: ["'self'", "data:", "blob:", 'https://img.freepik.com'], // Imágenes: origen propio + data URLs + CDNs
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com', 'data:'] // Fuentes permitidas
    },
  },
}));

// ===================================
// CONFIGURACIÓN DE RATE LIMITING (Limitación de peticiones)
// ===================================
// Detecta si estamos en modo desarrollo para aplicar limitaciones solo en producción
const isDev = process.env.NODE_ENV !== 'production';

// Limitador estricto para rutas de autenticación (previene ataques de fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de tiempo: 15 minutos
  max: 10,                   // Máximo 10 intentos por IP en 15 minutos
  standardHeaders: true,     // Incluye headers estándar de rate limit
  legacyHeaders: false,      // No incluye headers legacy
  message: {
    success: false,
    message: 'Demasiadas solicitudes de autenticación, intenta nuevamente más tarde'
  }
});

// Limitador para operaciones de escritura en votos (evita spam de calificaciones)
const votesWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Ventana de tiempo: 15 minutos
  max: 200,                  // Máximo 200 votos por IP en 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  // Solo limita métodos que modifican datos (POST, PUT, DELETE), no GET
  skip: (req) => req.method === 'GET',
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta nuevamente más tarde'
  }
});

// Aplicar limitaciones solo en producción (no en desarrollo)
if (!isDev) {
  app.use('/api/auth', authLimiter);      // Aplicar limitador a rutas de autenticación
  app.use('/api/votes', votesWriteLimiter); // Aplicar limitador a rutas de votos
}

// ===================================
// MIDDLEWARE DE LA APLICACIÓN
// ===================================

// CORS: Permite peticiones desde otros dominios (necesario para desarrollo)
app.use(cors());

// Parser de JSON: Convierte el body de las peticiones a JSON (límite de 10MB para imágenes)
app.use(express.json({ limit: '10mb' }));

// Parser de formularios URL-encoded: Maneja datos de formularios HTML
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===================================
// ARCHIVOS ESTÁTICOS
// ===================================
// Sirve archivos estáticos desde la carpeta 'public' (HTML, CSS, JS del frontend)
app.use(express.static('public'));

// Sirve imágenes subidas desde la carpeta 'uploads' (fotos de recetas)
app.use('/uploads', express.static('uploads'));

// ===================================
// CONFIGURACIÓN DE RUTAS DE LA API
// ===================================
app.use('/api/auth', authRoutes);          // Rutas de autenticación: /api/auth/*
app.use('/api/recipes', recipeRoutes);     // Rutas de recetas: /api/recipes/*
app.use('/api/ingredients', ingredientRoutes); // Rutas de ingredientes: /api/ingredients/*
app.use('/api/votes', voteRoutes);         // Rutas de calificaciones: /api/votes/*

// ===================================
// RUTA PRINCIPAL
// ===================================
// Redirige la página principal (/) a la página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ===================================
// MANEJO DE ERRORES GLOBAL
// ===================================
// Captura todos los errores no manejados en la aplicación
app.use((err, req, res, next) => {
  console.error('Error capturado:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    // Solo muestra detalles del error en desarrollo, no en producción
    error: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// ===================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// ===================================
// Captura todas las rutas que no fueron definidas anteriormente
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// ===================================
// CONFIGURACIÓN DEL SERVIDOR
// ===================================
// Puerto del servidor: usa variable de entorno PORT o 3000 por defecto
const PORT = process.env.PORT || 3000;

// Iniciar el servidor y escuchar en el puerto especificado
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📱 Accede a la aplicación: http://localhost:${PORT}`);
  console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
  console.log(`📁 Imágenes en: http://localhost:${PORT}/uploads`);
});