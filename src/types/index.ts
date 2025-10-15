export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  food_name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  is_confirmed: boolean;
  is_supplement: boolean;
  is_recipe: boolean;
  supplement_id?: string;
  recipe_id?: string;
  created_at: string;
}

export interface DailyStats {
  id: string;
  user_id: string;
  date: string;
  weight?: number;
  calories_burned?: number;
  weekly_goal: string;
  created_at: string;
  updated_at: string;
}

export interface ConfirmedFood {
  id: string;
  user_id: string;
  food_name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  recipe_name: string;
  ingredients: any[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  total_fiber: number;
  created_at: string;
}

export const SUPPLEMENTS = {
  vitamins: { name: "Vitamins", calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
  creatine: { name: "Creatine", calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
  collagen: { name: "Collagen", calories: 40, protein: 10, carbs: 0, fats: 0, fiber: 0 },
  cmz: { name: "CMZ", calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
};
