// ===================================
// MODELO DE VOTO/CALIFICACIÓN
// Define la estructura de las calificaciones que los usuarios dan a las recetas
// ===================================

const mongoose = require('mongoose');

// Definición del esquema de voto con validaciones
const voteSchema = new mongoose.Schema({
  
  // Referencia al usuario que está votando
  user: {
    type: mongoose.Schema.Types.ObjectId,  // ID del usuario
    ref: 'User',                           // Relación con el modelo User
    required: [true, 'El usuario es obligatorio']
  },
  
  // Referencia a la receta que está siendo calificada
  recipe: {
    type: mongoose.Schema.Types.ObjectId,  // ID de la receta
    ref: 'Recipe',                         // Relación con el modelo Recipe
    required: [true, 'La receta es obligatoria']
  },
  
  // Calificación numérica de 1 a 5 estrellas
  rating: {
    type: Number,
    required: [true, 'La calificación es obligatoria'],
    min: [1, 'La calificación mínima es 1 estrella'],    // Mínimo 1 estrella
    max: [5, 'La calificación máxima es 5 estrellas']    // Máximo 5 estrellas
  },
  
  // Comentario opcional del usuario sobre la receta
  comment: {
    type: String,
    maxlength: [300, 'El comentario no puede exceder 300 caracteres'],
    trim: true  // Elimina espacios innecesarios
  }
}, {
  // Opciones del esquema
  timestamps: true  // Agrega automáticamente createdAt y updatedAt
});

// ===================================
// ÍNDICES PARA OPTIMIZAR CONSULTAS Y GARANTIZAR INTEGRIDAD
// ===================================

// Índice compuesto único: un usuario solo puede votar UNA VEZ por receta
// Esto previene votos duplicados del mismo usuario en la misma receta
voteSchema.index({ user: 1, recipe: 1 }, { unique: true });

// Índices adicionales para optimizar consultas
voteSchema.index({ recipe: 1 });    // Buscar todos los votos de una receta específica
voteSchema.index({ rating: -1 });   // Ordenar votos por calificación (mejor primero)

// ===================================
// EXPORTACIÓN DEL MODELO
// ===================================

// Crea y exporta el modelo Vote basado en el esquema definido
module.exports = mongoose.model('Vote', voteSchema);