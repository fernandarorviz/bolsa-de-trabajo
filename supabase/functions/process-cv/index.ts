import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'No file URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not set');
    }

    // 1. Fetch the file from storage
    const fileResp = await fetch(fileUrl);
    const fileBuffer = await fileResp.arrayBuffer();
    const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    // 2. Prepare extraction prompt
    const prompt = `Extrae la siguiente información de este CV en formato JSON:
{
  "nombre": "Nombre completo",
  "email": "Correo electrónico",
  "telefono": "Teléfono",
  "ubicacion": "Ciudad/País",
  "edad": "Edad (si se menciona, como número)",
  "resumen_profesional": "Breve resumen",
  "experiencia": [{"cargo": "", "empresa": "", "fecha_inicio": "", "fecha_fin": "", "actual": boolean, "descripcion": ""}],
  "educacion": [{"titulo": "", "institucion": "", "fecha_fin": ""}],
  "habilidades": ["Habilidad 1", "Habilidad 2"]
}
Si no encuentras un campo, déjalo como null o array vacío. Responde ÚNICAMENTE con el objeto JSON.`;

    // 3. Call Lovable AI Gateway with vision capability
    const lovableResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64File}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!lovableResp.ok) {
      const errorData = await lovableResp.text();
      if (lovableResp.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (lovableResp.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('AI gateway error:', lovableResp.status, errorData);
      throw new Error(`AI gateway error: ${lovableResp.status}`);
    }

    const lovableData = await lovableResp.json();
    const resultText = lovableData.choices?.[0]?.message?.content;

    if (!resultText) {
      throw new Error('AI failed to extract data from CV');
    }

    // Parse the JSON response
    const extractedData = JSON.parse(resultText);

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing CV:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
