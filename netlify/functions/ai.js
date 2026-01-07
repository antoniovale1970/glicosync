// netlify/functions/ai.js

export async function handler(event) {
  // CORS (pra funcionar no navegador sem dor de cabeça)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  try {
    // Use preferencialmente uma variável "server-only".
    // (VITE_* é pensado para o build do front-end e pode acabar indo para o navegador.)
    // Mantemos fallback para VITE_API_KEY por compatibilidade com seu painel do Netlify.
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.API_KEY ||
      process.env.VITE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "AI key missing on server",
          details: "Configure VITE_API_KEY (ou API_KEY) nas variáveis de ambiente do Netlify.",
        }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};

    // Compatibilidade:
    // - Se vier { prompt, model, temperature... } usamos o formato simples.
    // - Se vier { request } repassamos praticamente direto para a API (útil para tools, multimodal, etc.).
    const hasCustomRequest = body && typeof body === "object" && body.request;

    const model = (body.model ?? body?.request?.model ?? "gemini-1.5-flash").toString();

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    let payload;
    if (hasCustomRequest) {
      payload = body.request;
      // garante o model no payload
      payload.model = payload.model || model;
    } else {
      const prompt = (body.prompt ?? "").toString().trim();
      if (!prompt) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Missing 'prompt' in request body." }),
        };
      }
      payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
          maxOutputTokens: typeof body.maxOutputTokens === "number" ? body.maxOutputTokens : 1024,
        },
      };
    }

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // Tenta extrair uma mensagem útil do formato padrão de erro do Google.
      const gMsg =
        data?.error?.message ||
        data?.message ||
        "Falha ao chamar a API de IA.";

      let hint = "";
      if (resp.status === 401 || resp.status === 403) {
        hint =
          "Verifique as restrições da sua chave (API Key). " +
          "Se ela estiver limitada por 'HTTP referrers', chamadas pelo backend (Netlify Function) vão falhar. " +
          "Deixe em 'None' (sem restrição) ou crie uma chave nova sem referrer e restrinja apenas à 'Gemini API'.";
      }
      if (resp.status === 429) {
        hint =
          "Parece limite de cota/uso. Verifique sua cota e faturamento no Google Cloud.";
      }

      return {
        statusCode: resp.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "AI request failed",
          status: resp.status,
          message: gMsg,
          hint,
          details: data,
        }),
      };
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text ?? "")
        .join("")
        .trim() ?? "";

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ text, raw: data }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Unexpected server error",
        details: String(err?.message ?? err),
      }),
    };
  }
}
