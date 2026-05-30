import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { goal, dietary, days, calories } = await req.json();

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterKey) {
      return new Response(JSON.stringify({ error: "OpenRouter API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a professional nutritionist and meal prep expert. Generate a ${days}-day meal plan for someone with the following goals:
- Primary goal: ${goal}
- Dietary preference: ${dietary !== "None" ? dietary : "No restrictions"}
- Daily calorie target: ${calories} calories

For each meal (breakfast, lunch, dinner per day = ${days * 3} total meals), provide:
- name: meal name
- type: "breakfast", "lunch", or "dinner"
- calories: number
- protein: grams
- carbs: grams
- fat: grams
- ingredients: array of strings (each ingredient with approximate amount)
- instructions: brief cooking instructions (2-3 sentences)
- prepTime: minutes
- cookTime: minutes

Respond ONLY with a valid JSON object in this exact format:
{
  "title": "string describing the plan",
  "meals": [ ...array of meal objects... ]
}

Keep meals practical, delicious, and realistic for meal prep. Vary the meals across days.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://prepsmart.app",
        "X-Title": "PrepSmart Meal Planner",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${errBody}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse meal plan from AI response");
    }

    const mealPlan = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
