import { useState, useMemo } from 'react'
import type { Recipe } from './types'
import { mockRecipes } from './data/mockRecipes'
import RecipeCard from './components/RecipeCard'
import RecipeDetail from './components/RecipeDetail'
import SearchFilter from './components/SearchFilter'
import './App.css'

function App() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')

  // Get unique categories from recipes
  const categories = useMemo(() => {
    const cats = Array.from(new Set(mockRecipes.map(recipe => recipe.category)))
    return cats.sort()
  }, [])

  // Filter recipes based on search and filters
  const filteredRecipes = useMemo(() => {
    return mockRecipes.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.ingredients.some(ingredient => 
                             ingredient.toLowerCase().includes(searchTerm.toLowerCase())
                           )
      
      const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory
      const matchesDifficulty = selectedDifficulty === 'All' || recipe.difficulty === selectedDifficulty
      
      return matchesSearch && matchesCategory && matchesDifficulty
    })
  }, [searchTerm, selectedCategory, selectedDifficulty])

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
  }

  const handleBackToList = () => {
    setSelectedRecipe(null)
  }

  if (selectedRecipe) {
    return (
      <div className="app">
        <RecipeDetail recipe={selectedRecipe} onBack={handleBackToList} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sistema de Recetas</h1>
        <p>Discover and explore delicious recipes</p>
      </header>
      
      <main className="app-main">
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
          categories={categories}
        />
        
        <div className="recipes-count">
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
        </div>
        
        <div className="recipes-grid">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={handleRecipeClick}
            />
          ))}
        </div>
        
        {filteredRecipes.length === 0 && (
          <div className="no-results">
            <h3>No recipes found</h3>
            <p>Try adjusting your search terms or filters</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
