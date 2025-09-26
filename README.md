# Sistema de Recetas - React Recipe System

A modern, responsive recipe management system built with React and TypeScript. Browse, search, and explore delicious recipes with an intuitive user interface.

![Sistema de Recetas](https://github.com/user-attachments/assets/92d2c265-6c40-4777-99f9-5ab75fae63af)

## Features

- **Recipe Browsing**: View a collection of recipes with detailed information
- **Search Functionality**: Search recipes by title, description, or ingredients
- **Advanced Filtering**: Filter recipes by category and difficulty level
- **Recipe Details**: View complete recipe information including ingredients and step-by-step instructions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with attractive gradient backgrounds

## Technologies Used

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **CSS3** - Modern styling with gradients and animations
- **ESLint** - Code linting and formatting

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Castillo2308/Sistema-recetas-REACT.git
cd Sistema-recetas-REACT
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # React components
│   ├── RecipeCard.tsx   # Recipe card component
│   ├── RecipeDetail.tsx # Recipe detail view
│   └── SearchFilter.tsx # Search and filter component
├── data/               # Data and mock data
│   └── mockRecipes.ts  # Sample recipe data
├── types.ts           # TypeScript type definitions
├── App.tsx           # Main application component
└── main.tsx         # Application entry point
```

## Recipe Data Structure

Each recipe includes:
- Title and description
- List of ingredients
- Step-by-step instructions
- Preparation and cooking times
- Serving information
- Difficulty level
- Category classification

## Features in Detail

### Recipe Cards
Each recipe is displayed in an attractive card format showing:
- Recipe title and difficulty badge
- Brief description
- Category, total time, and servings
- Preview of ingredients

### Recipe Detail View
Click on any recipe card to view:
- Complete ingredient list
- Numbered step-by-step instructions
- All recipe metadata in an organized layout
- Easy navigation back to the recipe list

### Search and Filter
- **Text Search**: Search across recipe titles, descriptions, and ingredients
- **Category Filter**: Filter by recipe categories (Italian, Mexican, Dessert, Salad, etc.)
- **Difficulty Filter**: Filter by difficulty level (Easy, Medium, Hard)
- **Real-time Results**: Instant filtering as you type or change selections

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Future Enhancements

- Add recipe creation functionality
- Implement recipe editing and deletion
- Add user authentication
- Include recipe ratings and reviews
- Add recipe sharing capabilities
- Implement recipe import/export
- Add nutritional information
- Include recipe photos and image upload
