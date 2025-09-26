const express = require('express');
const Vote = require('../models/Vote');
const Recipe = require('../models/Recipe');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// @desc    Obtener estadísticas globales de votos
// @route   GET /api/votes/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalVotes = await Vote.countDocuments({});

    // También podríamos incluir más métricas si son útiles en el futuro
    // como recipesConVotos, promedioGlobal, etc.

    res.json({
      success: true,
      data: {
        totalVotes
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas globales de votos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Votar o actualizar voto en una receta
// @route   POST /api/votes
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipeId, rating, comment } = req.body;

    // Validar campos requeridos
    if (!recipeId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'ID de receta y calificación son obligatorios'
      });
    }

    // Validar rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 5'
      });
    }

    // Verificar que la receta existe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    // No permitir votar en recetas propias
    if (recipe.author.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes votar en tus propias recetas'
      });
    }

    // Buscar voto existente
    let existingVote = await Vote.findOne({
      user: req.user._id,
      recipe: recipeId
    });

    let vote;
    let isNewVote = false;

    if (existingVote) {
      // Actualizar voto existente
      existingVote.rating = rating;
      if (comment !== undefined) existingVote.comment = comment;
      vote = await existingVote.save();
    } else {
      // Crear nuevo voto
      vote = new Vote({
        user: req.user._id,
        recipe: recipeId,
        rating,
        comment
      });
      await vote.save();
      isNewVote = true;
    }

    // Recalcular estadísticas de la receta
    await updateRecipeVoteStats(recipeId);

    // Poblar información del usuario en el voto
    await vote.populate('user', 'username firstName lastName');

    res.status(isNewVote ? 201 : 200).json({
      success: true,
      message: isNewVote ? 'Voto registrado exitosamente' : 'Voto actualizado exitosamente',
      data: { vote }
    });

  } catch (error) {
    console.error('Error procesando voto:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de receta inválido'
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

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Obtener votos de una receta
// @route   GET /api/votes/recipe/:recipeId
// @access  Public
router.get('/recipe/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Verificar que la receta existe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Configurar paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener votos con paginación
    const [votes, totalVotes] = await Promise.all([
      Vote.find({ recipe: recipeId })
        .populate('user', 'username firstName lastName avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Vote.countDocuments({ recipe: recipeId })
    ]);

    // Calcular estadísticas
    const stats = await Vote.aggregate([
      { $match: { recipe: recipe._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalVotes: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Procesar distribución de ratings
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.length > 0 && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach(rating => {
        ratingDistribution[rating]++;
      });
    }

    const totalPages = Math.ceil(totalVotes / parseInt(limit));

    res.json({
      success: true,
      data: {
        votes,
        stats: {
          averageRating: stats.length > 0 ? parseFloat(stats[0].averageRating.toFixed(2)) : 0,
          totalVotes,
          ratingDistribution
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalVotes,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo votos:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de receta inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Obtener voto del usuario para una receta específica
// @route   GET /api/votes/recipe/:recipeId/my-vote
// @access  Private
router.get('/recipe/:recipeId/my-vote', authenticateToken, async (req, res) => {
  try {
    const vote = await Vote.findOne({
      user: req.user._id,
      recipe: req.params.recipeId
    }).populate('user', 'username firstName lastName');

    res.json({
      success: true,
      data: { vote }
    });

  } catch (error) {
    console.error('Error obteniendo mi voto:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de receta inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Eliminar voto
// @route   DELETE /api/votes/:voteId
// @access  Private (solo el usuario que hizo el voto)
router.delete('/:voteId', authenticateToken, async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.voteId);

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Voto no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario del voto
    if (vote.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este voto'
      });
    }

    const recipeId = vote.recipe;

    // Eliminar voto
    await Vote.findByIdAndDelete(req.params.voteId);

    // Recalcular estadísticas de la receta
    await updateRecipeVoteStats(recipeId);

    res.json({
      success: true,
      message: 'Voto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando voto:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de voto inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @desc    Obtener votos del usuario autenticado
// @route   GET /api/votes/my-votes
// @access  Private
router.get('/my-votes', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [votes, totalVotes] = await Promise.all([
      Vote.find({ user: req.user._id })
        .populate('recipe', 'title description image category difficulty')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vote.countDocuments({ user: req.user._id })
    ]);

    const totalPages = Math.ceil(totalVotes / parseInt(limit));

    res.json({
      success: true,
      data: {
        votes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalVotes,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo mis votos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Función auxiliar para actualizar estadísticas de votación de una receta
async function updateRecipeVoteStats(recipeId) {
  try {
    const stats = await Vote.aggregate([
      { $match: { recipe: recipeId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalVotes: { $sum: 1 }
        }
      }
    ]);

    const updateData = {
      totalVotes: stats.length > 0 ? stats[0].totalVotes : 0,
      averageRating: stats.length > 0 ? parseFloat(stats[0].averageRating.toFixed(2)) : 0
    };

    await Recipe.findByIdAndUpdate(recipeId, updateData);
  } catch (error) {
    console.error('Error actualizando estadísticas de receta:', error);
  }
}

module.exports = router;