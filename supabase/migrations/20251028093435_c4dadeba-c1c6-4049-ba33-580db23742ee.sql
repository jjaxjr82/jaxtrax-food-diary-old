-- Create table for ingredients on hand
CREATE TABLE public.ingredients_on_hand (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ingredient_name TEXT NOT NULL,
  quantity TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ingredients_on_hand ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own ingredients" 
ON public.ingredients_on_hand 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ingredients" 
ON public.ingredients_on_hand 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ingredients" 
ON public.ingredients_on_hand 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ingredients" 
ON public.ingredients_on_hand 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_ingredients_on_hand_user_id ON public.ingredients_on_hand(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_ingredients_on_hand_updated_at
BEFORE UPDATE ON public.ingredients_on_hand
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();