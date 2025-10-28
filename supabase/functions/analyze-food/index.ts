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
        const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(foodName)}&pageSize=3`;
        const response = await fetch(searchUrl);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        if (!data.foods || data.foods.length === 0) return null;
        
        const food = data.foods[0];
        const nutrients = food.foodNutrients || [];
        
        // Extract key nutrients per 100g
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
          source: food.dataType || "USDA"
        };
      } catch (error) {
        console.error("USDA API error:", error);
        return null;
      }
    }
    
    // Helper to validate nutritional data reasonableness
    function validateNutrition(data: any, foodName: string) {
      const { calories, protein, carbs, fats } = data;
      
      // Basic sanity checks
      const calculatedCals = (protein * 4) + (carbs * 4) + (fats * 9);
      const difference = Math.abs(calories - calculatedCals);
      const percentDiff = (difference / calories) * 100;
      
      // If calorie calculation is way off (>30%), flag as suspicious
      if (percentDiff > 30) {
        console.warn(`Suspicious nutrition data for ${foodName}: ${percentDiff}% difference in calories`);
        return false;
      }
      
      // Check for unrealistic values
      if (calories > 1000 || protein > 100 || carbs > 100 || fats > 100) {
        console.warn(`Unrealistic values for ${foodName}`);
        return false;
      }
      
      return true;
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
        model: "openai/gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a precise nutrition analysis expert. Extract food items and provide ACCURATE nutritional data per serving.${confirmedHistory}

CRITICAL ACCURACY RULES:
- For BRANDED foods (e.g., "Sociables Crackers"), use real package nutrition facts
- For GENERIC foods, provide accurate USDA-level data
- Validate: calories should roughly equal (protein×4) + (carbs×4) + (fats×9)
- Common serving sizes: 1 cracker ≈ 5-15 cal, 1 oz chips ≈ 140-160 cal, 1 egg ≈ 70 cal

Return ONLY valid JSON:
{
  "foods": [
    {
      "foodName": "Sociables Crackers",
      "quantity": "5 crackers",
      "calories": 70,
      "protein": 1,
      "carbs": 10,
      "fats": 3,
      "fiber": 0.5,
      "mealType": "Snack"
    }
  ]
}

Format rules:
- Title Case food names
- Standard quantities: "g", "oz", "cup", "tbsp", "medium", etc.
- Separate each food item
- Choose mealType: Breakfast, Lunch, Dinner, or Snack
- Use confirmed food values when matched
- Round to 1 decimal place
- NO markdown, just JSON`
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
    
    // Cross-reference and validate nutrition data
    if (parsed.foods) {
      parsed.foods = await Promise.all(parsed.foods.map(async (item: any) => {
        // Priority 1: Check confirmed foods (user's personal database)
        const confirmedMatch = confirmedFoods?.find(cf => 
          cf.food_name.toLowerCase() === item.foodName.toLowerCase() &&
          cf.quantity === item.quantity
        );
        
        if (confirmedMatch) {
          console.log(`Using confirmed food: ${item.foodName}`);
          return {
            ...item,
            foodName: toTitleCase(item.foodName),
            calories: confirmedMatch.calories,
            protein: confirmedMatch.protein,
            carbs: confirmedMatch.carbs,
            fats: confirmedMatch.fats,
            fiber: confirmedMatch.fiber,
            isConfirmed: true,
            dataSource: "Your Library"
          };
        }
        
        // Priority 2: Try USDA for generic foods
        const usdaData = await searchUSDA(item.foodName);
        
        // Priority 3: Cross-reference AI vs USDA
        let finalData = { ...item };
        let dataSource = "AI (Claude Sonnet 4.5)";
        
        if (usdaData && usdaData.calories > 10) {
          // We have both AI and USDA data - compare them
          const aiValid = validateNutrition(item, item.foodName);
          const usdaValid = validateNutrition(usdaData, item.foodName);
          
          if (usdaValid && aiValid) {
            // Both valid - average them for better accuracy
            finalData = {
              ...item,
              calories: Math.round((item.calories + usdaData.calories) / 2),
              protein: parseFloat(((item.protein + usdaData.protein) / 2).toFixed(1)),
              carbs: parseFloat(((item.carbs + usdaData.carbs) / 2).toFixed(1)),
              fats: parseFloat(((item.fats + usdaData.fats) / 2).toFixed(1)),
              fiber: parseFloat(((item.fiber + usdaData.fiber) / 2).toFixed(1)),
            };
            dataSource = "Cross-Referenced (AI + USDA)";
            console.log(`Cross-referenced: ${item.foodName}`);
          } else if (usdaValid) {
            // USDA more trustworthy
            finalData = { ...item, ...usdaData };
            dataSource = "USDA Database";
            console.log(`Using USDA: ${item.foodName}`);
          } else {
            console.log(`Using AI (GPT-5): ${item.foodName}`);
          }
        } else {
          // No USDA data - validate AI estimate
          const aiValid = validateNutrition(item, item.foodName);
          if (!aiValid) {
            console.warn(`Questionable AI data for: ${item.foodName}`);
            dataSource = "AI (GPT-5 - Needs Review)";
          }
        }
        
        return {
          ...finalData,
          foodName: toTitleCase(item.foodName),
          isConfirmed: false,
          dataSource
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
