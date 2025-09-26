import React from 'react';
import type { Recipe } from '../types';
import './RecipeDetail.css';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack }) => {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="recipe-detail">
      <button className="back-button" onClick={onBack}>
        ← Back to Recipes
      </button>
      
      <div className="recipe-detail-header">
        <h1 className="recipe-detail-title">{recipe.title}</h1>
        <span className={`difficulty-badge ${recipe.difficulty.toLowerCase()}`}>
          {recipe.difficulty}
        </span>
      </div>
      
      <p className="recipe-detail-description">{recipe.description}</p>
      
      <div className="recipe-detail-meta">
        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">Category</span>
            <span className="meta-value">{recipe.category}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Prep Time</span>
            <span className="meta-value">{recipe.prepTime} min</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Cook Time</span>
            <span className="meta-value">{recipe.cookTime} min</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Total Time</span>
            <span className="meta-value">{totalTime} min</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Servings</span>
            <span className="meta-value">{recipe.servings}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Created</span>
            <span className="meta-value">{recipe.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <div className="recipe-content">
        <div className="ingredients-section">
          <h2>Ingredients</h2>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="ingredient-item">
                {ingredient}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="instructions-section">
          <h2>Instructions</h2>
          <ol className="instructions-list">
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className="instruction-item">
                {instruction}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;