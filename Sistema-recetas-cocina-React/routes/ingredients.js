const express = require('express');
const Ingredient = require('../models/Ingredient');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// @desc    Obtener todos los ingredientes con filtros y búsqueda
// @route   GET /api/ingredients
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Construir filtros
    const filters = { isActive: true };
    
    if (category) {
      filters.category = category;
    }
    
    // Búsqueda por texto
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Opciones de ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Configurar paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Ejecutar consulta
    const [ingredients, totalIngredients] = await Promise.all([
      Ingredient.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ingredient.countDocuments(filters)
    ]);

    // Calcular información de paginación
    const totalPages = Math.ceil(totalIngredients / parseInt(limit));

    res.json({
      success: true,
      data: {
        ingredients,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalIngredients,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo ingredientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Obtener ingrediente por ID
// @route   GET /api/ingredients/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient || !ingredient.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente no encontrado'
      });
    }

    res.json({
      success: true,
      data: { ingredient }
    });

  } catch (error) {
    console.error('Error obteniendo ingrediente:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de ingrediente inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Crear nuevo ingrediente
// @route   POST /api/ingredients
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      category,
      nutritionalInfo,
      commonUnits,
      description
    } = req.body;

    // Validar campos requeridos
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y categoría son obligatorios'
      });
    }

    // Verificar si ya existe un ingrediente con el mismo nombre
    const existingIngredient = await Ingredient.findOne({
      name: name.toLowerCase().trim()
    });

    if (existingIngredient) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un ingrediente con este nombre'
      });
    }

    // Procesar unidades comunes
    let parsedCommonUnits = [];
    if (commonUnits) {
      if (Array.isArray(commonUnits)) {
        parsedCommonUnits = commonUnits;
      } else if (typeof commonUnits === 'string') {
        try {
          parsedCommonUnits = JSON.parse(commonUnits);
        } catch {
          parsedCommonUnits = commonUnits.split(',').map(unit => unit.trim());
        }
      }
    }

    // Crear ingrediente
    const ingredient = new Ingredient({
      name: name.toLowerCase().trim(),
      category,
      nutritionalInfo: nutritionalInfo || {},
      commonUnits: parsedCommonUnits,
      description
    });

    await ingredient.save();

    res.status(201).json({
      success: true,
      message: 'Ingrediente creado exitosamente',
      data: { ingredient }
    });

  } catch (error) {
    console.error('Error creando ingrediente:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un ingrediente con este nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Actualizar ingrediente
// @route   PUT /api/ingredients/:id
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente no encontrado'
      });
    }

    // Campos permitidos para actualización
    const allowedFields = ['name', 'category', 'nutritionalInfo', 'commonUnits', 'description'];
    const updateFields = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'name') {
          updateFields[field] = req.body[field].toLowerCase().trim();
        } else if (field === 'commonUnits' && typeof req.body[field] === 'string') {
          try {
            updateFields[field] = JSON.parse(req.body[field]);
          } catch {
            updateFields[field] = req.body[field].split(',').map(unit => unit.trim());
          }
        } else {
          updateFields[field] = req.body[field];
        }
      }
    });

    // Verificar nombre único si se está actualizando
    if (updateFields.name && updateFields.name !== ingredient.name) {
      const existingIngredient = await Ingredient.findOne({
        name: updateFields.name,
        _id: { $ne: ingredient._id }
      });

      if (existingIngredient) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un ingrediente con este nombre'
        });
      }
    }

    const updatedIngredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Ingrediente actualizado exitosamente',
      data: { ingredient: updatedIngredient }
    });

  } catch (error) {
    console.error('Error actualizando ingrediente:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de ingrediente inválido'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un ingrediente con este nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Eliminar ingrediente (hard delete)
// @route   DELETE /api/ingredients/:id
// @access  Private
// IMPORTANTE: Si otras colecciones referencian este ingrediente por _id (ej. recetas),
// podrías querer un soft delete o validación previa. El requerimiento del usuario
// fue eliminar realmente para permitir volver a crear con el mismo nombre.
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente no encontrado'
      });
    }

    await Ingredient.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Ingrediente eliminado definitivamente'
    });

  } catch (error) {
    console.error('Error eliminando ingrediente:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de ingrediente inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Obtener categorías de ingredientes
// @route   GET /api/ingredients/categories/list
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Ingredient.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Buscar ingredientes por nombre (para autocompletar)
// @route   GET /api/ingredients/search/:term
// @access  Public
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El término de búsqueda debe tener al menos 2 caracteres'
      });
    }

    const ingredients = await Ingredient.find({
      name: { $regex: searchTerm, $options: 'i' },
      isActive: true
    })
    .select('name category commonUnits')
    .limit(20)
    .sort('name');

    res.json({
      success: true,
      data: { ingredients }
    });

  } catch (error) {
    console.error('Error buscando ingredientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;