# 🍳 Sistema de Recetas de Cocina

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/### 🥬 **Ingredientes**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/api/ingredients` | Listar ingredientes (con filtros) | ❌ |
| `POST` | `/api/ingredients` | Crear ingrediente | ✅ |
| `PUT` | `/api/ingredients/:id` | Actualizar ingrediente | ✅ |
| `DELETE` | `/api/ingredients/:id` | Eliminar ingrediente | ✅ |
| `GET` | `/api/ingredients/categories/list` | Listar categorías | ❌ |
| `GET` | `/api/ingredients/search/:term` | Búsqueda autocompletado | ❌ |ongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![Express](https://img.shields.io/badge/Express.js-4.x-black?style=for-the-badge&logo=express)
![JWT](https://img.shields.io/badge/JWT-Auth-blue?style=for-the-badge&logo=jsonwebtokens)

Una aplicación web completa para gestionar recetas de cocina con autenticación segura, upload de imágenes y una interfaz moderna y responsive.

[🚀 Demo](#-ejecución) • [📖 Documentación](#-api-vista-general) • [🛠️ Instalación](#️-configuración) • [🤝 Contribuir](#-licencia)

</div>

---

## ✨ Características Principales

### 🔐 **Autenticación y Seguridad**
- Sistema completo de registro y login con JWT
- Contraseñas hasheadas con bcryptjs (salt 12)
- Middleware de autenticación para rutas protegidas
- Rate limiting y headers de seguridad con Helmet

### 👨‍🍳 **Gestión de Recetas**
- CRUD completo de recetas con validaciones
- Upload de imágenes con Multer (JPEG, PNG, WebP)
- Categorías: Desayuno, Almuerzo, Cena, Postre, Snack, Bebida
- Niveles de dificultad: Fácil, Intermedio, Difícil
- Tiempos de preparación y cocción

### 🥬 **Base de Ingredientes**
- Gestión completa de ingredientes por categorías
- Búsqueda y autocompletado inteligente
- Información nutricional opcional
- Unidades de medida personalizadas

### ⭐ **Sistema de Calificaciones**
- Votos y comentarios en recetas
- Cálculo automático de rating promedio
- Prevención de votos duplicados

### 🎨 **Frontend Moderno**
- Diseño responsive y accesible
- Interfaz intuitiva con modales y toasts
- Búsqueda en tiempo real y filtros avanzados
- Compatibilidad con CSP (Content Security Policy)

## 🏗️ Arquitectura y Tecnologías

### **Backend**
- **Node.js** + **Express.js** - Servidor web y API REST
- **MongoDB** + **Mongoose** - Base de datos y ODM
- **JWT** - Autenticación stateless
- **Multer** - Upload de archivos
- **Bcryptjs** - Hashing de contraseñas

### **Frontend**
- **HTML5** + **CSS3** + **Vanilla JavaScript**
- **Responsive Design** - Compatible con móviles y desktop
- **Fetch API** - Consumo de la API REST
- **Font Awesome** - Iconografía

### **Seguridad**
- **Helmet.js** - Headers de seguridad
- **CORS** configurado
- **Rate Limiting** anti-spam
- **Validaciones** en frontend y backend

## 🗂️ Estructura del Proyecto

```
📦 sistema-recetas-cocina/
├── 📁 config/
│   └── database.js          # Configuración MongoDB
├── 📁 middleware/
│   ├── auth.js              # Middleware JWT
│   └── upload.js            # Configuración Multer
├── 📁 models/
│   ├── User.js              # Modelo de usuarios
│   ├── Ingredient.js        # Modelo de ingredientes
│   ├── Recipe.js            # Modelo de recetas
│   └── Vote.js              # Modelo de calificaciones
├── 📁 routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── ingredients.js       # API de ingredientes
│   ├── recipes.js           # API de recetas
│   └── votes.js             # API de calificaciones
├── 📁 public/
│   ├── 🎨 CSS/              # Estilos (landing, dashboard, etc.)
│   ├── 📄 HTML/             # Páginas web
│   └── ⚡ JavaScript/       # Lógica del frontend
├── 📁 uploads/              # Imágenes de recetas
├── server.js                # Servidor principal
├── package.json             # Dependencias y scripts
└── README.md                # Documentación
```

## 🛠️ Requisitos del Sistema

- **Node.js** 18.0.0 o superior
- **MongoDB Atlas** (o MongoDB local)
- **Git** para control de versiones
- Navegador web moderno

## 🚀 Instalación y Configuración

### 1️⃣ **Clonar el Repositorio**
```bash
git clone https://github.com/Castillo2308/sistema-recetas-cocina.git
cd sistema-recetas-cocina
```

### 2️⃣ **Instalar Dependencias**
```bash
npm install
```

### 3️⃣ **Configurar Variables de Entorno**
Crea un archivo `.env` en la raíz del proyecto:

```env
# Conexión a MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/recetas_db?retryWrites=true&w=majority

# Clave secreta para JWT (genera una clave segura)
JWT_SECRET=tu_clave_secreta_super_larga_y_segura_aqui_2024

# Puerto del servidor (opcional, por defecto 3000)
PORT=3000

# Entorno de ejecución
NODE_ENV=development
```

### 4️⃣ **Configurar MongoDB**
1. Crea una cuenta gratuita en [MongoDB Atlas](https://mongodb.com/atlas)
2. Crea un nuevo cluster
3. Configura el acceso de red (IP Whitelist)
4. Crea un usuario de base de datos
5. Obtén la cadena de conexión y actualiza `MONGODB_URI`

> **💡 Tip:** El proyecto ya incluye la estructura de base de datos, se creará automáticamente al ejecutar.

## ▶️ Ejecutar la Aplicación

### **Modo Desarrollo** (con recarga automática)
```bash
npm run dev
```

### **Modo Producción**
```bash
npm start
```

### **Acceso**
- 🌐 **Frontend**: http://localhost:3000
- 🔗 **API**: http://localhost:3000/api
- 📁 **Imágenes**: http://localhost:3000/uploads

> **🎯 ¡Listo!** La aplicación estará disponible en tu navegador. Comienza registrando una cuenta nueva.

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt (salt 12)
- JWT con expiración y middleware para rutas privadas (`authenticateToken`)
- Helmet con CSP estricta (sin handlers inline) y cabeceras seguras
- Rate limiting de peticiones (global) y recomendado un limitador específico para `/api/auth/login`
- Sugerido: mover tokens a cookie HttpOnly + Secure + SameSite (requiere ajustes de frontend y middleware)

## 📦 Subida de archivos (Multer)

- Ruta de recetas acepta `image` (opcional) en `POST /api/recipes` y `PUT /api/recipes/:id`
- Validación de tipos MIME (JPEG, PNG, GIF, WebP) y límite 5MB
- Archivos se guardan en `uploads/` y se sirven en `/uploads/*`

## 📘 API (vista general)

### 🔐 **Autenticación**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Registro de usuarios | ❌ |
| `POST` | `/api/auth/login` | Inicio de sesión | ❌ |
| `GET` | `/api/auth/verify` | Verificar token JWT | ✅ |
| `GET` | `/api/auth/profile` | Obtener perfil del usuario | ✅ |

- Ingredientes
  - GET `/api/ingredients` → lista con filtros y paginación
  - POST `/api/ingredients` → crear (privado)
  - PUT `/api/ingredients/:id` → actualizar (privado)
  - DELETE `/api/ingredients/:id` → “soft delete” (privado)
  - GET `/api/ingredients/categories/list` → categorías
  - GET `/api/ingredients/search/:term` → autocompletar

### 🍳 **Recetas**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/api/recipes` | Listar recetas (con filtros) | ❌ |
| `GET` | `/api/recipes/:id` | Obtener receta específica | ❌ |
| `POST` | `/api/recipes` | Crear receta (con imagen) | ✅ |
| `PUT` | `/api/recipes/:id` | Actualizar receta | ✅ (solo autor) |
| `DELETE` | `/api/recipes/:id` | Eliminar receta | ✅ (solo autor) |
| `GET` | `/api/recipes/my/recipes` | Mis recetas | ✅ |

### ⭐ **Calificaciones**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/api/votes` | Votar/calificar receta | ✅ |
| `GET` | `/api/votes/recipe/:id` | Obtener votos de receta | ❌ |

> **📝 Nota:** Los endpoints marcados con ✅ requieren el header `Authorization: Bearer <token>`

## �️ **Upload de Imágenes**
- **Formatos soportados:** JPEG, PNG, GIF, WebP
- **Tamaño máximo:** 5MB por imagen
- **Almacenamiento:** Directorio `uploads/`
- **Acceso público:** `/uploads/<filename>`

## 🎮 **Guía de Uso Rápido**

### **1. Registro e Inicio de Sesión**
1. Ve a `/register.html` y crea una cuenta nueva
2. Inicia sesión en `/login.html`
3. Serás redirigido al dashboard principal

### **2. Gestionar Ingredientes**
1. Ve a la sección "Ingredientes" en el dashboard
2. Agrega ingredientes con su categoría e información nutricional
3. Usa la búsqueda para encontrar ingredientes rápidamente

### **3. Crear Recetas**
1. Ve a "Mis Recetas" > "Agregar Nueva Receta"
2. Completa los datos: título, descripción, instrucciones
3. Agrega ingredientes de tu lista
4. Sube una imagen (opcional)
5. Define tiempos, dificultad y categoría

### **4. Explorar y Calificar**
1. Navega por las recetas públicas
2. Usa filtros por categoría y dificultad
3. Califica recetas de otros usuarios
4. Deja comentarios constructivos

## 🚀 **Despliegue en Producción**

### **Plataformas Recomendadas**
- **Heroku** - Fácil despliegue con Git
- **Railway** - Moderno y simple
- **DigitalOcean App Platform** - Escalable
- **Vercel** - Para proyectos más pequeños

### **Variables de Entorno Requeridas**
```bash
NODE_ENV=production
MONGODB_URI=tu_uri_de_mongodb_atlas
JWT_SECRET=clave_super_secreta_de_produccion
PORT=3000
```

### **Consideraciones de Seguridad**
- ✅ Usa HTTPS en producción
- ✅ Configura CORS para tu dominio específico
- ✅ Revisa las políticas CSP de Helmet
- ✅ Implementa rate limiting más estricto
- ✅ Configura logs y monitoreo

## 🤝 **Contribuir**

¡Las contribuciones son bienvenidas! Si quieres mejorar este proyecto:

1. **Fork** el repositorio
2. Crea una **rama** para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. **Commit** tus cambios (`git commit -m 'Agregar nueva característica'`)
4. **Push** a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un **Pull Request**

### **Ideas para Contribuir**
- 📱 Versión móvil nativa (React Native)
- 🔍 Búsqueda avanzada con filtros múltiples
- 📊 Dashboard de analytics para usuarios
- 🌐 Internacionalización (i18n)
- 🔔 Sistema de notificaciones
- 📄 Exportar recetas a PDF

## 📄 **Licencia**

Este proyecto está bajo la Licencia ISC. Ver el archivo `package.json` para más detalles.

## 👨‍� **Autor**

**Castillo2308**
- 💼 GitHub: [@Castillo2308](https://github.com/Castillo2308)
- 📧 Email: ianadriano23@gmail.com

---

<div align="center">

**⭐ ¡Si te gusta este proyecto, no olvides darle una estrella! ⭐**

Hecho con ❤️ y mucho ☕ por [Castillo2308](https://github.com/Castillo2308)

</div>
