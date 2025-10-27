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
    
    const confirmedHistory = confirmedFoods?.length 
      ? `\n\nUser's confirmed food database (use these exact values when matched):\n${confirmedFoods.map(f => 
          `"${f.food_name}" (${f.quantity}): ${f.calories}cal, ${f.protein}g protein, ${f.carbs}g carbs, ${f.fats}g fats, ${f.fiber}g fiber`
        ).join('\n')}`
      : "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
  "items": [
    {
      "foodName": "banana",
      "quantity": "1 medium",
      "calories": 105,
      "protein": 1.3,
      "carbs": 27,
      "fats": 0.4,
      "fiber": 3.1
    }
  ]
}

Important:
- Extract each food item separately
- If the food matches a confirmed food in the database, use EXACTLY those nutritional values
- Provide realistic nutritional values per serving for new foods
- Include quantity with unit (e.g., "1 cup", "2 slices", "100g")
- Round to 1 decimal place
- Return ONLY the JSON object, no explanations`
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
    
    // Check each item against confirmed foods to set isConfirmed flag
    if (parsed.items && confirmedFoods) {
      parsed.items = parsed.items.map((item: any) => {
        const match = confirmedFoods.find(cf => 
          cf.food_name.toLowerCase() === item.foodName.toLowerCase() &&
          cf.quantity === item.quantity
        );
        return {
          ...item,
          isConfirmed: !!match,
          mealType: mealType || "Snack"
        };
      });
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
