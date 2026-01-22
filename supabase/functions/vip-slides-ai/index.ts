import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    // Check if user has Gold+ tier
    const { data: affiliate, error: affError } = await supabaseClient
      .from('vip_affiliates')
      .select('tier, status')
      .eq('user_id', userData.user.id)
      .eq('status', 'approved')
      .single();

    if (affError || !affiliate) {
      throw new Error("User is not an approved affiliate");
    }

    const tierLower = (affiliate.tier || 'bronze').toLowerCase();
    const isGoldOrHigher = ['ouro', 'gold', 'platinum', 'platina', 'diamond', 'diamante'].includes(tierLower);

    if (!isGoldOrHigher) {
      throw new Error("This feature requires Gold tier or higher");
    }

    const { prompt, slidesCount = 5 } = await req.json();

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log(`[VIP-SLIDES-AI] Generating ${slidesCount} slides for prompt: ${prompt.substring(0, 100)}...`);

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an expert presentation designer. Create professional slide content based on user descriptions.
            
Return a JSON array with exactly ${slidesCount} slides. Each slide should have this structure:
{
  "title": "Slide title",
  "content": "Main content text",
  "bulletPoints": ["Point 1", "Point 2", "Point 3"],
  "speakerNotes": "Notes for the presenter"
}

Make the content professional, engaging, and well-structured. Use clear, concise language.
Only return the JSON array, no other text.`
          },
          {
            role: "user",
            content: `Create a ${slidesCount}-slide presentation about: ${prompt}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[VIP-SLIDES-AI] AI API error:", errorText);
      throw new Error("Failed to generate content with AI");
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    // Parse the JSON response
    let slidesData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        slidesData = JSON.parse(jsonMatch[0]);
      } else {
        slidesData = JSON.parse(generatedContent);
      }
    } catch (parseError) {
      console.error("[VIP-SLIDES-AI] Parse error:", parseError);
      // Create default slides if parsing fails
      slidesData = [
        {
          title: "Título da Apresentação",
          content: prompt,
          bulletPoints: ["Ponto 1", "Ponto 2", "Ponto 3"],
          speakerNotes: "Notas do apresentador"
        }
      ];
    }

    // Transform to slide elements format
    const slides = slidesData.map((slide: any, index: number) => ({
      title: slide.title || `Slide ${index + 1}`,
      elements: [
        // Title element
        {
          id: crypto.randomUUID(),
          type: 'text',
          x: 50,
          y: 30,
          width: 700,
          height: 60,
          content: slide.title || `Slide ${index + 1}`,
          style: {
            fontSize: 42,
            fontWeight: 'bold',
            color: '#ffffff',
            backgroundColor: 'transparent'
          }
        },
        // Content element
        {
          id: crypto.randomUUID(),
          type: 'text',
          x: 50,
          y: 120,
          width: 700,
          height: 100,
          content: slide.content || '',
          style: {
            fontSize: 20,
            fontWeight: 'normal',
            color: '#e2e8f0',
            backgroundColor: 'transparent'
          }
        },
        // Bullet points (if any)
        ...(slide.bulletPoints || []).map((point: string, i: number) => ({
          id: crypto.randomUUID(),
          type: 'text',
          x: 70,
          y: 240 + (i * 45),
          width: 680,
          height: 40,
          content: `• ${point}`,
          style: {
            fontSize: 18,
            fontWeight: 'normal',
            color: '#cbd5e1',
            backgroundColor: 'transparent'
          }
        }))
      ]
    }));

    console.log(`[VIP-SLIDES-AI] Successfully generated ${slides.length} slides`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        slides,
        message: `${slides.length} slides gerados com sucesso!`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("[VIP-SLIDES-AI] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
