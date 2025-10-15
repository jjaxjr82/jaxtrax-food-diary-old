
-- Create profiles table for users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create meals table
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  calories DECIMAL(10,2) DEFAULT 0,
  protein DECIMAL(10,2) DEFAULT 0,
  carbs DECIMAL(10,2) DEFAULT 0,
  fats DECIMAL(10,2) DEFAULT 0,
  fiber DECIMAL(10,2) DEFAULT 0,
  is_confirmed BOOLEAN DEFAULT false,
  is_supplement BOOLEAN DEFAULT false,
  is_recipe BOOLEAN DEFAULT false,
  supplement_id TEXT,
  recipe_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX idx_meals_date ON public.meals(date);

-- Create daily_stats table
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL(10,2),
  calories_burned DECIMAL(10,2),
  weekly_goal TEXT DEFAULT 'lose1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily stats"
  ON public.daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily stats"
  ON public.daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats"
  ON public.daily_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_daily_stats_user_date ON public.daily_stats(user_id, date);

-- Create confirmed_foods table (food library)
CREATE TABLE IF NOT EXISTS public.confirmed_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  calories DECIMAL(10,2) DEFAULT 0,
  protein DECIMAL(10,2) DEFAULT 0,
  carbs DECIMAL(10,2) DEFAULT 0,
  fats DECIMAL(10,2) DEFAULT 0,
  fiber DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.confirmed_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own confirmed foods"
  ON public.confirmed_foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own confirmed foods"
  ON public.confirmed_foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own confirmed foods"
  ON public.confirmed_foods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own confirmed foods"
  ON public.confirmed_foods FOR DELETE
  USING (auth.uid() = user_id);

-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipe_name TEXT NOT NULL,
  ingredients JSONB NOT NULL,
  total_calories DECIMAL(10,2) DEFAULT 0,
  total_protein DECIMAL(10,2) DEFAULT 0,
  total_carbs DECIMAL(10,2) DEFAULT 0,
  total_fats DECIMAL(10,2) DEFAULT 0,
  total_fiber DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recipes"
  ON public.recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON public.recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at
  BEFORE UPDATE ON public.daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
