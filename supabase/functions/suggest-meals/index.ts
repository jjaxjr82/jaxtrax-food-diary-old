import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, mealType, targetCalories, targetProtein, targetCarbs, targetFats } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch excluded foods
    const { data: excludedFoods } = await supabase
      .from("excluded_foods")
      .select("food_name")
      .eq("user_id", userId);

    // Fetch user's confirmed foods library
    const { data: confirmedFoods } = await supabase
      .from("confirmed_foods")
      .select("*")
      .eq("user_id", userId)
      .limit(50);

    const excludedList = excludedFoods?.map(f => f.food_name).join(", ") || "none";
    const foodLibrary = confirmedFoods?.map(f => 
      `${f.food_name} (${f.quantity}): ${f.calories}cal, ${f.protein}g protein, ${f.carbs}g carbs, ${f.fats}g fat`
    ).join("\n") || "No saved foods yet";

    const systemPrompt = `You are a nutrition assistant that suggests meals based on user preferences and nutritional goals.

STRICT REQUIREMENTS:
1. NEVER suggest meals containing: ${excludedList}
2. Prioritize foods from the user's library when possible
3. Provide realistic portion sizes
4. Match the target macros closely

User's Food Library:
${foodLibrary}

Target for ${mealType}:
- Calories: ${targetCalories} kcal
- Protein: ${targetProtein}g
- Carbs: ${targetCarbs}g
- Fats: ${targetFats}g

Suggest 3 different meal options that meet these targets. For each meal, provide:
- Meal name
- List of foods with quantities
- Total macros (calories, protein, carbs, fats)
- Brief preparation notes`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Suggest 3 ${mealType} meals that avoid ${excludedList}` }
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
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const suggestions = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in suggest-meals function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
