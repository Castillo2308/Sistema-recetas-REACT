import React from 'react';
import type { Recipe } from '../types';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="recipe-card" onClick={() => onClick(recipe)}>
      <div className="recipe-card-header">
        <h3 className="recipe-title">{recipe.title}</h3>
        <span className={`difficulty-badge ${recipe.difficulty.toLowerCase()}`}>
          {recipe.difficulty}
        </span>
      </div>
      
      <p className="recipe-description">{recipe.description}</p>
      
      <div className="recipe-meta">
        <div className="meta-item">
          <span className="meta-label">Category:</span>
          <span className="meta-value">{recipe.category}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Total Time:</span>
          <span className="meta-value">{totalTime} min</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Servings:</span>
          <span className="meta-value">{recipe.servings}</span>
        </div>
      </div>
      
      <div className="recipe-ingredients-preview">
        <strong>Ingredients ({recipe.ingredients.length}):</strong>
        <span className="ingredients-preview">
          {recipe.ingredients.slice(0, 3).join(', ')}
          {recipe.ingredients.length > 3 && '...'}
        </span>
      </div>
    </div>
  );
};

export default RecipeCard;