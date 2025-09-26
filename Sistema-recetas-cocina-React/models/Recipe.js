// ===================================
// MODELO DE RECETA
// Define la estructura y comportamiento de las recetas en la base de datos
// ===================================

const mongoose = require('mongoose');

// Definición del esquema de receta con todas sus propiedades y validaciones
const recipeSchema = new mongoose.Schema({
  
  // Título de la receta (ej: "Paella Valenciana")
  title: {
    type: String,
    required: [true, 'El título de la receta es obligatorio'],
    trim: true,        // Elimina espacios innecesarios
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  
  // Descripción breve de la receta
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  
  // Instrucciones paso a paso para preparar la receta
  instructions: {
    type: String,
    required: [true, 'Las instrucciones son obligatorias']
  },
  
  // Tiempo de preparación en minutos
  preparationTime: {
    type: Number,
    required: [true, 'El tiempo de preparación es obligatorio'],
    min: [1, 'El tiempo de preparación debe ser mayor a 0 minutos']
  },
  
  // Tiempo de cocción en minutos
  cookingTime: {
    type: Number,
    required: [true, 'El tiempo de cocción es obligatorio'],
    min: [0, 'El tiempo de cocción no puede ser negativo'] // Puede ser 0 para recetas sin cocción
  },
  
  // Número de porciones que rinde la receta
  servings: {
    type: Number,
    required: [true, 'El número de porciones es obligatorio'],
    min: [1, 'Debe servir al menos 1 porción']
  },
  
  // Nivel de dificultad (solo acepta estos 3 valores)
  difficulty: {
    type: String,
    enum: ['Fácil', 'Intermedio', 'Difícil'],
    required: [true, 'La dificultad es obligatoria']
  },
  
  // Categoría de la receta (tipo de comida)
  category: {
    type: String,
    enum: ['Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Snack', 'Bebida'],
    required: [true, 'La categoría es obligatoria']
  },
  
  // Array de ingredientes necesarios para la receta
  ingredients: [{
    // Referencia al modelo Ingredient (relación)
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,  // ID del ingrediente
      ref: 'Ingredient',                     // Nombre del modelo al que hace referencia
      required: true
    },
    
    // Cantidad necesaria del ingrediente (ej: "2", "1/2", "una pizca")
    quantity: {
      type: String,
      required: [true, 'La cantidad es obligatoria']
    },
    
    // Unidad de medida (ej: "tazas", "gramos", "litros")
    unit: {
      type: String,
      required: [true, 'La unidad es obligatoria']
    }
  }],
  
  // Información de la imagen de la receta (opcional)
  image: {
    filename: String,     // Nombre del archivo en el servidor
    originalName: String, // Nombre original del archivo subido
    mimetype: String,     // Tipo MIME (image/jpeg, image/png, etc.)
    size: Number,         // Tamaño del archivo en bytes
    path: String          // Ruta completa donde se almacena la imagen
  },
  
  // Referencia al usuario que creó la receta
  author: {
    type: mongoose.Schema.Types.ObjectId,  // ID del usuario autor
    ref: 'User',                           // Relación con el modelo User
    required: [true, 'El autor es obligatorio']
  },
  
  // Etiquetas para facilitar la búsqueda (ej: "vegetariano", "sin gluten")
  tags: [{
    type: String,
    trim: true  // Elimina espacios innecesarios
  }],
  
  // Información nutricional opcional de la receta
  nutritionalInfo: {
    calories: { type: Number, min: 0 },  // Calorías por porción
    protein: { type: Number, min: 0 },   // Proteínas en gramos
    carbs: { type: Number, min: 0 },     // Carbohidratos en gramos
    fat: { type: Number, min: 0 },       // Grasas en gramos
    fiber: { type: Number, min: 0 }      // Fibra en gramos
  },
  
  // Si la receta es pública o privada
  isPublic: {
    type: Boolean,
    default: true  // Por defecto las recetas son públicas
  },
  
  // Contador total de votos recibidos
  totalVotes: {
    type: Number,
    default: 0     // Inicia sin votos
  },
  
  // Calificación promedio de la receta (1-5 estrellas)
  averageRating: {
    type: Number,
    default: 0,    // Inicia sin calificación
    min: 0,        // Mínimo 0 estrellas
    max: 5         // Máximo 5 estrellas
  }
}, {
  // Opciones del esquema
  timestamps: true   // Agrega automáticamente createdAt y updatedAt
});

// ===================================
// ÍNDICES PARA OPTIMIZAR CONSULTAS
// ===================================

// Índice de texto para búsquedas por título, descripción y etiquetas
recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Índices individuales para filtros rápidos
recipeSchema.index({ category: 1 });      // Buscar por categoría (Desayuno, Almuerzo, etc.)
recipeSchema.index({ difficulty: 1 });    // Buscar por dificultad (Fácil, Intermedio, Difícil)
recipeSchema.index({ author: 1 });        // Buscar recetas de un autor específico
recipeSchema.index({ averageRating: -1 }); // Ordenar por mejor calificación (descendente)

// ===================================
// CAMPOS VIRTUALES
// ===================================

// Campo virtual que calcula el tiempo total (preparación + cocción)
// No se almacena en la base de datos, se calcula dinámicamente
recipeSchema.virtual('totalTime').get(function() {
  return this.preparationTime + this.cookingTime;
});

// ===================================
// MIDDLEWARE DEL ESQUEMA
// ===================================

// Middleware que se ejecuta ANTES de cualquier consulta find*
// Automatically popula (incluye) los datos de las referencias
recipeSchema.pre(/^find/, function(next) {
  // Incluye información básica del autor de la receta
  this.populate('author', 'username firstName lastName avatar')
      // Incluye información de cada ingrediente usado
      .populate('ingredients.ingredient', 'name category');
  next();
});

// ===================================
// CONFIGURACIÓN DE SERIALIZACIÓN
// ===================================

// Incluye los campos virtuales cuando se convierte el documento a JSON
recipeSchema.set('toJSON', { virtuals: true });

// ===================================
// EXPORTACIÓN DEL MODELO
// ===================================

// Crea y exporta el modelo Recipe basado en el esquema definido
module.exports = mongoose.model('Recipe', recipeSchema);