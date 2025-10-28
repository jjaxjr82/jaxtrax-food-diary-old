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

export interface UserSettings {
  id: string;
  user_id: string;
  base_tdee: number;
  protein_per_lb: number;
  carbs_percentage: number;
  fats_percentage: number;
  fiber_per_1000_cal: number;
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
  vitamins: { name: "Vitamins", quantity: "6 gummies", calories: 45, protein: 0, carbs: 9, fats: 0, fiber: 3, defaultMealType: "Breakfast" },
  creatine: { name: "Creatine", quantity: "4 gummies", calories: 50, protein: 0, carbs: 0, fats: 0, fiber: 0, defaultMealType: "Breakfast" },
  collagen: { name: "Collagen", quantity: "3 capsules", calories: 10, protein: 2, carbs: 0, fats: 0, fiber: 0, defaultMealType: "Lunch" },
  cmz: { name: "CMZ", quantity: "3 caplets", calories: 5, protein: 0, carbs: 1, fats: 0, fiber: 0, defaultMealType: "Dinner" },
};
