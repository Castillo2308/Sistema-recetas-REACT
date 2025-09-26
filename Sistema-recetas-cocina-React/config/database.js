// ===================================
// CONFIGURACIÓN DE BASE DE DATOS MONGODB
// Maneja la conexión a MongoDB Atlas usando Mongoose
// ===================================

const { MongoClient, ServerApiVersion } = require('mongodb'); // Cliente nativo de MongoDB
const mongoose = require('mongoose'); // ODM (Object Document Mapper) para MongoDB

// ===================================
// CONFIGURACIÓN DE CONEXIÓN
// ===================================

// URI de conexión a MongoDB Atlas
// NOTA: En producción, esta debería estar en variables de entorno (.env)
// Formato: mongodb+srv://usuario:contraseña@cluster.mongodb.net/base_datos
const uri = "mongodb+srv://Castle2308:Castle2308@cluster0.ssz9flg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// ===================================
// FUNCIÓN DE CONEXIÓN A LA BASE DE DATOS
// ===================================

/**
 * Establece la conexión con MongoDB Atlas
 * Utiliza Mongoose para facilitar las operaciones con la base de datos
 */
const connectDB = async () => {
  try {
    // Conecta a MongoDB usando Mongoose con configuraciones de seguridad
    const conn = await mongoose.connect(uri, {
      // Configuración del API del servidor MongoDB
      serverApi: {
        version: ServerApiVersion.v1,  // Usa la versión 1 del API estable
        strict: true,                  // Rechaza operaciones no compatibles con la versión
        deprecationErrors: true,       // Lanza errores en lugar de warnings para funciones obsoletas
      }
    });

    // Confirma que la conexión fue exitosa
    console.log(`✅ MongoDB conectado exitosamente`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);
    
    // Realiza un ping para verificar que la conexión funciona correctamente
    await conn.connection.db.admin().ping();
    console.log("📡 Ping exitoso - Conexión MongoDB confirmada!");

  } catch (error) {
    // Si hay error en la conexión, registra el error y termina la aplicación
    console.error('❌ Error al conectar con MongoDB:', error.message);
    console.error('🔧 Verifica:');
    console.error('   - Que MongoDB Atlas esté activo');
    console.error('   - Que las credenciales sean correctas');
    console.error('   - Que la IP esté en la whitelist');
    console.error('   - Que la red permita conexiones MongoDB');
    
    // Termina el proceso con código de error
    process.exit(1);
  }
};

// ===================================
// EXPORTACIÓN
// ===================================

// Exporta la función para ser usada en server.js
module.exports = connectDB;