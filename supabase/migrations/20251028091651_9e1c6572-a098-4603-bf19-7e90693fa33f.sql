-- Create table for excluded foods/ingredients
CREATE TABLE public.excluded_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.excluded_foods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own excluded foods" 
ON public.excluded_foods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own excluded foods" 
ON public.excluded_foods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own excluded foods" 
ON public.excluded_foods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_excluded_foods_user_id ON public.excluded_foods(user_id);