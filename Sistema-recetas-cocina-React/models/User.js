// ===================================
// MODELO DE USUARIO
// Define la estructura y comportamiento de los usuarios en la base de datos
// ===================================

const mongoose = require('mongoose');  // ODM para MongoDB
const bcrypt = require('bcryptjs');    // Librería para hashear contraseñas

// Definición del esquema de usuario con validaciones
const userSchema = new mongoose.Schema({
  // Nombre de usuario único para identificar al usuario
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,    // No puede haber dos usuarios con el mismo username
    trim: true,      // Elimina espacios al inicio y final
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [20, 'El nombre de usuario no puede exceder 20 caracteres']
  },
  
  // Email del usuario (también único)
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,    // No puede haber dos usuarios con el mismo email
    lowercase: true, // Convierte automáticamente a minúsculas
    // Validación con expresión regular para formato de email válido
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingrese un email válido'
    ]
  },
  
  // Contraseña del usuario (se hasheará antes de guardar)
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  
  // Nombre real del usuario
  firstName: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true       // Elimina espacios innecesarios
  },
  
  // Apellido del usuario
  lastName: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true
  },
  
  // URL de la foto de perfil (opcional)
  avatar: {
    type: String,
    default: null    // Por defecto no tiene avatar
  },
  
  // Estado del usuario (activo/inactivo)
  isActive: {
    type: Boolean,
    default: true    // Por defecto todos los usuarios están activos
  }
}, {
  // Opciones del esquema
  timestamps: true   // Agrega automáticamente createdAt y updatedAt
});

// ===================================
// MIDDLEWARE DEL ESQUEMA
// ===================================

// Middleware que se ejecuta ANTES de guardar un usuario
// Hashea la contraseña si ha sido modificada
userSchema.pre('save', async function(next) {
  // Si la contraseña no fue modificada, continúa sin hashear
  if (!this.isModified('password')) return next();
  
  try {
    // Genera un salt con factor de costo 12 (muy seguro)
    const salt = await bcrypt.genSalt(12);
    
    // Hashea la contraseña con el salt generado
    this.password = await bcrypt.hash(this.password, salt);
    
    next(); // Continúa con el guardado
  } catch (error) {
    next(error); // Pasa el error al siguiente middleware
  }
});

// ===================================
// MÉTODOS DEL ESQUEMA
// ===================================

// Método para comparar una contraseña en texto plano con la hasheada
// Se usa durante el login para verificar credenciales
userSchema.methods.comparePassword = async function(candidatePassword) {
  // bcrypt.compare compara automáticamente la contraseña con el hash
  return await bcrypt.compare(candidatePassword, this.password);
};

// ===================================
// CAMPOS VIRTUALES
// ===================================

// Campo virtual que combina firstName + lastName
// No se almacena en la base de datos, se calcula dinámicamente
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// ===================================
// CONFIGURACIÓN DE SERIALIZACIÓN
// ===================================

// Incluye los campos virtuales cuando se convierte el documento a JSON
userSchema.set('toJSON', { virtuals: true });

// ===================================
// EXPORTACIÓN DEL MODELO
// ===================================

// Crea y exporta el modelo User basado en el esquema definido
module.exports = mongoose.model('User', userSchema);