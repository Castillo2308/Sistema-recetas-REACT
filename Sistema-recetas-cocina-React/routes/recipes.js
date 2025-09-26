const express = require('express');
const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const Vote = require('../models/Vote');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload, handleMulterErrors, deleteFile } = require('../middleware/upload');
const mongoose = require('mongoose');

const router = express.Router();

// Utilidad para parsear JSON seguro
function safeParseJSON(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(value)) return value; // ya es array
  if (typeof value !== 'string') return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

// POST /api/recipes - Crear receta (cualquier usuario autenticado)
router.post('/', authenticateToken, upload.single('image'), handleMulterErrors, async (req, res) => {
  try {
    const {
      title, description, instructions,
      preparationTime, cookingTime, servings,
      difficulty, category, ingredients,
      tags, nutritionalInfo, isPublic
    } = req.body;

    // Validación básica
    const required = { title, description, instructions, preparationTime, cookingTime, servings, difficulty, category };
    for (const [k, v] of Object.entries(required)) {
      if (v === undefined || v === null || v === '') {
        if (req.file) deleteFile(req.file.path);
        return res.status(400).json({ success: false, message: `El campo ${k} es obligatorio` });
      }
    }

    const parsedIngredients = safeParseJSON(ingredients, []);
    if (!Array.isArray(parsedIngredients) || parsedIngredients.length === 0) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ success: false, message: 'Debes proporcionar al menos un ingrediente' });
    }

    // Validar ingredientes existen
    for (const ing of parsedIngredients) {
      if (!ing.ingredient || !mongoose.Types.ObjectId.isValid(ing.ingredient)) {
        if (req.file) deleteFile(req.file.path);
        return res.status(400).json({ success: false, message: 'Ingrediente inválido' });
      }
      const exists = await Ingredient.findById(ing.ingredient);
      if (!exists) {
        if (req.file) deleteFile(req.file.path);
        return res.status(400).json({ success: false, message: 'Ingrediente no encontrado' });
      }
    }

    const parsedTags = safeParseJSON(tags, typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    const parsedNutri = safeParseJSON(nutritionalInfo, {});

    const recipe = new Recipe({
      title: title.trim(),
      description,
      instructions,
      preparationTime: Number(preparationTime),
      cookingTime: Number(cookingTime),
      servings: Number(servings),
      difficulty,
      category,
      ingredients: parsedIngredients.map(i => ({
        ingredient: i.ingredient,
        quantity: i.quantity,
        unit: i.unit
      })),
      tags: parsedTags,
      nutritionalInfo: parsedNutri,
      isPublic: isPublic === undefined ? true : (isPublic === 'true' || isPublic === true),
      author: req.user._id
    });

    if (req.file) {
      recipe.image = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path.replace(/\\/g, '/')
      };
    }

    await recipe.save();
    res.status(201).json({ success: true, message: 'Receta creada', data: { recipe } });
  } catch (error) {
    console.error('Error creando receta:', error);
    if (req.file) deleteFile(req.file.path);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/recipes - Listar recetas públicas con filtros
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category, difficulty } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { isPublic: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.$text = { $search: search };

    const sort = { averageRating: -1, createdAt: -1 };

    const [recipes, total] = await Promise.all([
      Recipe.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
      Recipe.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        recipes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error listando recetas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/recipes/:id - Obtener receta por ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    res.json({ success: true, data: { recipe } });
  } catch (error) {
    console.error('Error obteniendo receta:', error);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'ID inválido' });
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// PUT /api/recipes/:id - Actualizar receta (cualquier autenticado)
router.put('/:id', authenticateToken, upload.single('image'), handleMulterErrors, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    const up = req.body;
    if (up.title !== undefined) recipe.title = up.title;
    if (up.description !== undefined) recipe.description = up.description;
    if (up.instructions !== undefined) recipe.instructions = up.instructions;
    if (up.preparationTime !== undefined) recipe.preparationTime = Number(up.preparationTime);
    if (up.cookingTime !== undefined) recipe.cookingTime = Number(up.cookingTime);
    if (up.servings !== undefined) recipe.servings = Number(up.servings);
    if (up.difficulty !== undefined) recipe.difficulty = up.difficulty;
    if (up.category !== undefined) recipe.category = up.category;
    if (up.tags !== undefined) {
      const parsedTags = safeParseJSON(up.tags, typeof up.tags === 'string' ? up.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      recipe.tags = parsedTags;
    }
    if (up.nutritionalInfo !== undefined) {
      recipe.nutritionalInfo = safeParseJSON(up.nutritionalInfo, {});
    }
    if (up.isPublic !== undefined) recipe.isPublic = (up.isPublic === 'true' || up.isPublic === true);
    if (up.ingredients !== undefined) {
      const parsedIngredients = safeParseJSON(up.ingredients, []);
      if (!Array.isArray(parsedIngredients)) {
        if (req.file) deleteFile(req.file.path);
        return res.status(400).json({ success: false, message: 'Formato de ingredientes inválido' });
      }
      recipe.ingredients = parsedIngredients;
    }

    if (req.file) {
      if (recipe.image?.path) deleteFile(recipe.image.path);
      recipe.image = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path.replace(/\\/g, '/')
      };
    }

    await recipe.save();
    res.json({ success: true, message: 'Receta actualizada', data: { recipe } });
  } catch (error) {
    console.error('Error actualizando receta:', error);
    if (req.file) deleteFile(req.file.path);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'ID inválido' });
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// DELETE /api/recipes/:id - Eliminar receta (cualquier autenticado)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Receta no encontrada' });

    if (recipe.image?.path) deleteFile(recipe.image.path);
    await Vote.deleteMany({ recipe: recipe._id });
    await recipe.deleteOne();

    res.json({ success: true, message: 'Receta eliminada' });
  } catch (error) {
    console.error('Error eliminando receta:', error);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'ID inválido' });
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/recipes/mine - Recetas del usuario autenticado
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [recipes, total] = await Promise.all([
      Recipe.find({ author: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Recipe.countDocuments({ author: req.user._id })
    ]);

    res.json({
      success: true,
      data: {
        recipes,
        pagination: {
          currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo mis recetas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;