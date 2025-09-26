// ===================================
// MODELO DE INGREDIENTE
// Define la estructura de los ingredientes usados en las recetas
// ===================================

const mongoose = require('mongoose');

// Definición del esquema de ingrediente
const ingredientSchema = new mongoose.Schema({
  
  // Nombre del ingrediente (ej: "tomate", "cebolla", "ajo")
  name: {
    type: String,
    required: [true, 'El nombre del ingrediente es obligatorio'],
    unique: true,       // No puede haber ingredientes duplicados
    trim: true,         // Elimina espacios innecesarios
    lowercase: true,    // Convierte automáticamente a minúsculas para consistencia
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  
  // Categoría a la que pertenece el ingrediente
  category: {
    type: String,
    // Solo acepta estos valores predefinidos
    enum: [
      'Verduras',                // Tomate, cebolla, lechuga, etc.
      'Frutas',                  // Manzana, plátano, naranja, etc.
      'Carnes',                  // Pollo, res, cerdo, etc.
      'Pescados y Mariscos',     // Salmón, atún, camarones, etc.
      'Lácteos',                 // Leche, queso, yogurt, etc.
      'Granos y Cereales',       // Arroz, trigo, quinoa, etc.
      'Legumbres',               // Frijoles, lentejas, garbanzos, etc.
      'Especias y Condimentos',  // Sal, pimienta, orégano, etc.
      'Aceites y Grasas',        // Aceite de oliva, mantequilla, etc.
      'Bebidas',                 // Agua, vino, caldo, etc.
      'Otros'                    // Ingredientes que no encajan en las categorías anteriores
    ],
    required: [true, 'La categoría es obligatoria']
  },
  
  // Información nutricional opcional del ingrediente (por cada 100g)
  nutritionalInfo: {
    caloriesPer100g: { type: Number, min: 0 }, // Calorías por 100 gramos
    proteinPer100g: { type: Number, min: 0 },  // Proteínas en gramos
    carbsPer100g: { type: Number, min: 0 },    // Carbohidratos en gramos
    fatPer100g: { type: Number, min: 0 },      // Grasas en gramos
    fiberPer100g: { type: Number, min: 0 }     // Fibra en gramos
  },
  
  // Unidades de medida comunes para este ingrediente
  // (ej: ["tazas", "gramos", "cucharadas"] para harina)
  commonUnits: [{
    type: String,
    trim: true  // Elimina espacios innecesarios
  }],
  
  // Descripción opcional del ingrediente
  description: {
    type: String,
    maxlength: [200, 'La descripción no puede exceder 200 caracteres']
  },
  
  // Estado del ingrediente (activo/inactivo para soft delete)
  isActive: {
    type: Boolean,
    default: true  // Por defecto los ingredientes están activos
  }
}, {
  // Opciones del esquema
  timestamps: true  // Agrega automáticamente createdAt y updatedAt
});

// ===================================
// ÍNDICES PARA OPTIMIZAR CONSULTAS
// ===================================

// Índice para buscar por categoría (Verduras, Frutas, etc.)
ingredientSchema.index({ category: 1 });

// Índice de texto para búsquedas por nombre y descripción
ingredientSchema.index({ name: 'text', description: 'text' });

// ===================================
// EXPORTACIÓN DEL MODELO
// ===================================

// Crea y exporta el modelo Ingredient basado en el esquema definido
module.exports = mongoose.model('Ingredient', ingredientSchema);