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
    
    // Simple USDA lookup for generic foods only
    async function searchUSDA(foodName: string) {
      try {
        // Only search USDA for clearly generic foods (not branded items)
        const genericTerms = ['chicken', 'beef', 'rice', 'egg', 'banana', 'apple', 'orange', 'bread', 'milk', 'cheese'];
        const isGeneric = genericTerms.some(term => foodName.toLowerCase().includes(term));
        
        if (!isGeneric) return null; // Skip USDA for branded items
        
        const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(foodName)}&pageSize=1`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        
        const response = await fetch(searchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        if (!data.foods || data.foods.length === 0) return null;
        
        const food = data.foods[0];
        const nutrients = food.foodNutrients || [];
        
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
        console.log("USDA timeout or error:", error instanceof Error ? error.message : String(error));
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
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are a nutrition expert. Provide ACCURATE nutritional data per serving.${confirmedHistory}

FOR BRANDED FOODS (e.g., "Sociables Crackers", "Oreos", "Doritos"):
- Use REAL package nutrition facts
- Example: Nabisco Sociables crackers = ~14 cal per cracker (70 cal for 5 crackers)
- DO NOT GUESS - use actual product data

FOR GENERIC FOODS (e.g., "banana", "chicken breast"):
- Use standard USDA values
- Be precise with serving sizes

CRITICAL: Verify calories ≈ (protein×4) + (carbs×4) + (fats×9)

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
      "fiber": 0,
      "mealType": "Snack"
    }
  ]
}

Rules:
- Title Case names
- Standard units (g, oz, cup, tbsp, medium, etc.)
- Separate each food
- Choose mealType: Breakfast/Lunch/Dinner/Snack
- Use confirmed food values when matched
- Round to 1 decimal
- JSON only, no markdown`
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
    
    // Simple, fast processing
    if (parsed.foods) {
      parsed.foods = await Promise.all(parsed.foods.map(async (item: any) => {
        // Check confirmed foods first (instant)
        const confirmedMatch = confirmedFoods?.find(cf => 
          cf.food_name.toLowerCase() === item.foodName.toLowerCase() &&
          cf.quantity === item.quantity
        );
        
        if (confirmedMatch) {
          console.log(`✓ Confirmed: ${item.foodName}`);
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
        
        // Try USDA for generic foods only (with timeout)
        const usdaData = await searchUSDA(item.foodName);
        
        if (usdaData && usdaData.calories > 10) {
          console.log(`✓ USDA: ${item.foodName}`);
          return {
            ...item,
            foodName: toTitleCase(item.foodName),
            calories: Math.round(usdaData.calories),
            protein: usdaData.protein,
            carbs: usdaData.carbs,
            fats: usdaData.fats,
            fiber: usdaData.fiber,
            isConfirmed: false,
            dataSource: "USDA"
          };
        }
        
        // Use AI data (should be accurate for branded items)
        console.log(`✓ AI: ${item.foodName}`);
        return {
          ...item,
          foodName: toTitleCase(item.foodName),
          isConfirmed: false,
          dataSource: "AI"
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
