// ===================================
// MIDDLEWARE DE SUBIDA DE ARCHIVOS
// Configura Multer para manejar el upload de imágenes de recetas
// ===================================

const multer = require('multer'); // Librería para manejar multipart/form-data (archivos)
const path = require('path');     // Utilidades para manejar rutas de archivos
const fs = require('fs');         // Sistema de archivos para crear directorios

// ===================================
// CONFIGURACIÓN DEL DIRECTORIO DE UPLOADS
// ===================================

// Directorio donde se guardarán las imágenes subidas
const uploadsDir = 'uploads';

// Crear el directorio si no existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Directorio creado: ${uploadsDir}`);
}

// ===================================
// CONFIGURACIÓN DEL ALMACENAMIENTO
// ===================================

// Configuración de dónde y cómo guardar los archivos
const storage = multer.diskStorage({
  // Función que define dónde guardar el archivo
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Guarda en la carpeta 'uploads'
  },
  
  // Función que define cómo nombrar el archivo
  filename: function (req, file, cb) {
    // Genera un nombre único para evitar conflictos
    // Formato: recipe-TIMESTAMP-RANDOM.extensión
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname); // Extrae la extensión original
    cb(null, 'recipe-' + uniqueSuffix + extension);
  }
});

// ===================================
// FILTRO DE VALIDACIÓN DE ARCHIVOS
// ===================================

/**
 * Filtro que valida el tipo de archivo antes de guardarlo
 * Solo permite imágenes con formatos específicos
 */
const fileFilter = (req, file, cb) => {
  // Lista de tipos MIME permitidos para imágenes
  const allowedTypes = [
    'image/jpeg',   // JPEG/JPG
    'image/jpg',    // JPG (algunos navegadores usan este MIME)
    'image/png',    // PNG
    'image/gif',    // GIF
    'image/webp'    // WebP (formato moderno)
  ];

  // Verifica si el tipo de archivo está en la lista permitida
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // Archivo válido, permite la subida
  } else {
    // Archivo no válido, rechaza la subida con error descriptivo
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'), false);
  }
};

// ===================================
// CONFIGURACIÓN PRINCIPAL DE MULTER
// ===================================

// Crea la instancia de multer con todas las configuraciones
const upload = multer({
  storage: storage,        // Usa la configuración de almacenamiento definida arriba
  fileFilter: fileFilter,  // Usa el filtro de validación definido arriba
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de tamaño: 5MB máximo por archivo
  }
});

// ===================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===================================

/**
 * Middleware que maneja errores específicos de Multer
 * Proporciona mensajes de error más amigables al usuario
 */
const handleMulterErrors = (err, req, res, next) => {
  // Verifica si el error es específico de Multer
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Demasiados archivos. Máximo 1 imagen por receta'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Campo de archivo inesperado. Usa el campo "image"'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Error al subir archivo'
        });
    }
  } else if (err) {
    // Error personalizado (ej: tipo de archivo no permitido)
    return res.status(400).json({
      success: false,
      message: err.message || 'Error al procesar archivo'
    });
  }
  
  // Si no hay error, continúa con el siguiente middleware
  next();
};

// ===================================
// FUNCIÓN UTILITARIA PARA ELIMINAR ARCHIVOS
// ===================================

/**
 * Función para eliminar archivos del sistema de archivos
 * Útil cuando se actualiza una receta y se quiere eliminar la imagen anterior
 */

const deleteFile = (filePath) => {
  try {
    // Verifica si el archivo existe antes de intentar eliminarlo
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Elimina el archivo
      console.log(`📁 Archivo eliminado exitosamente: ${filePath}`);
    } else {
      console.log(`⚠️ Archivo no encontrado: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error al eliminar archivo ${filePath}:`, error);
  }
};

// ===================================
// EXPORTACIÓN DE FUNCIONES Y MIDDLEWARES
// ===================================

module.exports = {
  upload,              // Configuración principal de Multer para subir archivos
  handleMulterErrors,  // Middleware para manejar errores de Multer
  deleteFile          // Función utilitaria para eliminar archivos
};