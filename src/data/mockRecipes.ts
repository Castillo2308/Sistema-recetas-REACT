import type { Recipe } from '../types';

export const mockRecipes: Recipe[] = [
  {
    id: 1,
    title: 'Pasta Carbonara',
    description: 'A classic Italian pasta dish with eggs, cheese, pancetta, and black pepper.',
    ingredients: [
      '400g spaghetti',
      '200g pancetta or guanciale, diced',
      '4 large eggs',
      '100g Pecorino Romano cheese, grated',
      '50g Parmesan cheese, grated',
      'Freshly ground black pepper',
      'Salt for pasta water'
    ],
    instructions: [
      'Bring a large pot of salted water to boil and cook spaghetti according to package directions.',
      'While pasta cooks, heat a large skillet over medium heat and cook pancetta until crispy.',
      'In a bowl, whisk together eggs, Pecorino Romano, Parmesan, and plenty of black pepper.',
      'Reserve 1 cup pasta cooking water, then drain pasta.',
      'Add hot pasta to the skillet with pancetta and toss.',
      'Remove from heat and quickly stir in egg mixture, adding pasta water as needed to create a creamy sauce.',
      'Serve immediately with extra cheese and black pepper.'
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: 'Medium',
    category: 'Italian',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 2,
    title: 'Chicken Tacos',
    description: 'Delicious and easy chicken tacos with fresh toppings.',
    ingredients: [
      '500g chicken breast, sliced',
      '8 corn tortillas',
      '1 red onion, diced',
      '2 tomatoes, diced',
      '1 avocado, sliced',
      '200g lettuce, shredded',
      '100g Mexican cheese, grated',
      '2 limes, cut into wedges',
      '2 tsp cumin',
      '2 tsp paprika',
      '1 tsp chili powder',
      'Salt and pepper',
      '2 tbsp olive oil'
    ],
    instructions: [
      'Season chicken with cumin, paprika, chili powder, salt, and pepper.',
      'Heat olive oil in a large skillet over medium-high heat.',
      'Cook chicken for 6-8 minutes until fully cooked and slightly charred.',
      'Warm tortillas in a dry skillet or microwave.',
      'Assemble tacos with chicken, onion, tomatoes, avocado, lettuce, and cheese.',
      'Serve with lime wedges and your favorite salsa.'
    ],
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    difficulty: 'Easy',
    category: 'Mexican',
    createdAt: new Date('2024-01-20')
  },
  {
    id: 3,
    title: 'Chocolate Chip Cookies',
    description: 'Classic homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.',
    ingredients: [
      '230g all-purpose flour',
      '1 tsp baking soda',
      '1 tsp salt',
      '225g butter, softened',
      '150g granulated sugar',
      '165g brown sugar',
      '2 large eggs',
      '2 tsp vanilla extract',
      '340g chocolate chips'
    ],
    instructions: [
      'Preheat oven to 190°C (375°F).',
      'In a bowl, whisk together flour, baking soda, and salt.',
      'In a large bowl, cream together butter and both sugars until fluffy.',
      'Beat in eggs one at a time, then stir in vanilla.',
      'Gradually blend in flour mixture.',
      'Stir in chocolate chips.',
      'Drop rounded tablespoons of dough onto ungreased cookie sheets.',
      'Bake for 9-11 minutes or until golden brown.',
      'Cool on baking sheet for 2 minutes before removing to wire rack.'
    ],
    prepTime: 15,
    cookTime: 11,
    servings: 24,
    difficulty: 'Easy',
    category: 'Dessert',
    createdAt: new Date('2024-01-10')
  },
  {
    id: 4,
    title: 'Greek Salad',
    description: 'Fresh and healthy Greek salad with feta cheese and olives.',
    ingredients: [
      '4 large tomatoes, cut into wedges',
      '1 cucumber, sliced',
      '1 red onion, thinly sliced',
      '200g feta cheese, cubed',
      '100g Kalamata olives',
      '60ml extra virgin olive oil',
      '2 tbsp red wine vinegar',
      '1 tsp dried oregano',
      'Salt and pepper to taste',
      'Fresh parsley for garnish'
    ],
    instructions: [
      'In a large bowl, combine tomatoes, cucumber, and red onion.',
      'Add feta cheese and olives.',
      'In a small bowl, whisk together olive oil, vinegar, oregano, salt, and pepper.',
      'Pour dressing over salad and toss gently.',
      'Let sit for 10 minutes to allow flavors to meld.',
      'Garnish with fresh parsley before serving.'
    ],
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    difficulty: 'Easy',
    category: 'Salad',
    createdAt: new Date('2024-01-25')
  }
];