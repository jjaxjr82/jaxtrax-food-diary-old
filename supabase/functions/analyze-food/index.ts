import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, userId, mealType } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch user's confirmed foods history
    const { data: confirmedFoods } = await supabase
      .from("confirmed_foods")
      .select("*")
      .eq("user_id", userId);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // Helper function to search USDA FoodData Central
    async function searchUSDA(foodName: string) {
      try {
        const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(foodName)}&pageSize=1&dataType=Survey (FNDDS)`;
        const response = await fetch(searchUrl);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        if (!data.foods || data.foods.length === 0) return null;
        
        const food = data.foods[0];
        const nutrients = food.foodNutrients || [];
        
        // Extract key nutrients
        const getNeeded = (name: string) => {
          const nutrient = nutrients.find((n: any) => n.nutrientName.includes(name));
          return nutrient ? parseFloat(nutrient.value.toFixed(1)) : 0;
        };
        
        return {
          calories: getNeeded("Energy") || 0,
          protein: getNeeded("Protein") || 0,
          carbs: getNeeded("Carbohydrate") || 0,
          fats: getNeeded("Total lipid") || 0,
          fiber: getNeeded("Fiber") || 0,
        };
      } catch (error) {
        console.error("USDA API error:", error);
        return null;
      }
    }
    
    const confirmedHistory = confirmedFoods?.length 
      ? `\n\nUser's confirmed food database (use these exact values when matched):\n${confirmedFoods.map(f => 
          `"${f.food_name}" (${f.quantity}): ${f.calories}cal, ${f.protein}g protein, ${f.carbs}g carbs, ${f.fats}g fats, ${f.fiber}g fiber`
        ).join('\n')}`
      : "";

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a nutrition analysis assistant. When given a description of a meal, extract all individual food items and provide detailed nutritional information for each.${confirmedHistory}

Return ONLY valid JSON in this format:
{
  "foods": [
    {
      "foodName": "Banana",
      "quantity": "1 medium",
      "calories": 105,
      "protein": 1.3,
      "carbs": 27,
      "fats": 0.4,
      "fiber": 3.1,
      "mealType": "Snack"
    }
  ]
}

Important formatting rules:
- Food names: Use Title Case (e.g., "Chicken Breast", "Greek Yogurt", "Peanut Butter")
- Quantities: Use standard abbreviations:
  * g (grams), oz (ounces), lb (pounds)
  * cup/cups, tbsp (tablespoon), tsp (teaspoon)
  * slice/slices, piece/pieces
  * small, medium, large (for sizes)
  * Examples: "4 oz", "1 cup", "2 tbsp", "100g", "1 medium"
- Extract each food item separately
- Determine appropriate mealType for each item (Breakfast, Lunch, Dinner, or Snack)
- If the food matches a confirmed food in the database, use EXACTLY those nutritional values
- Provide realistic nutritional values per serving for new foods
- Round nutritional values to 1 decimal place
- Return ONLY the JSON object, no explanations or markdown`
          },
          {
            role: "user",
            content: description
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    // Helper function to enforce Title Case
    const toTitleCase = (str: string) => {
      return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };
    
    // Enhance with USDA data and check confirmed foods
    if (parsed.foods) {
      parsed.foods = await Promise.all(parsed.foods.map(async (item: any) => {
        // First check confirmed foods
        const confirmedMatch = confirmedFoods?.find(cf => 
          cf.food_name.toLowerCase() === item.foodName.toLowerCase() &&
          cf.quantity === item.quantity
        );
        
        if (confirmedMatch) {
          return {
            ...item,
            foodName: toTitleCase(item.foodName),
            calories: confirmedMatch.calories,
            protein: confirmedMatch.protein,
            carbs: confirmedMatch.carbs,
            fats: confirmedMatch.fats,
            fiber: confirmedMatch.fiber,
            isConfirmed: true
          };
        }
        
        // Then try USDA for accurate data
        const usdaData = await searchUSDA(item.foodName);
        
        if (usdaData && usdaData.calories > 0) {
          // Scale nutrients based on quantity if it differs from 100g
          const scaleFactor = item.quantity.includes('100g') || item.quantity.includes('100 g') ? 1 : 1;
          
          return {
            ...item,
            foodName: toTitleCase(item.foodName),
            calories: Math.round(usdaData.calories * scaleFactor),
            protein: parseFloat((usdaData.protein * scaleFactor).toFixed(1)),
            carbs: parseFloat((usdaData.carbs * scaleFactor).toFixed(1)),
            fats: parseFloat((usdaData.fats * scaleFactor).toFixed(1)),
            fiber: parseFloat((usdaData.fiber * scaleFactor).toFixed(1)),
            isConfirmed: false,
            source: "USDA"
          };
        }
        
        // Fall back to AI estimate
        return {
          ...item,
          foodName: toTitleCase(item.foodName),
          isConfirmed: false,
          source: "AI Estimate"
        };
      }));
    }
    
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-food function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
