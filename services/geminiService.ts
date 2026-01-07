// services/geminiService.ts
//
// IMPORTANT:
// - Não chamamos mais a API do Gemini diretamente no navegador (isso quebra em produção e expõe a chave).
// - Toda chamada passa pela Netlify Function: /api/ai -> /.netlify/functions/ai

type SafetySetting = { category: string; threshold: string };

// Configurações de segurança para permitir contexto médico sem bloqueios falsos
// (Ex: permitir palavras como "sangue", "agulha", "medicamento")
const medicalSafetySettings: SafetySetting[] = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
];

type GeminiProxyResponse = {
  text?: string;
  raw?: any;
  error?: string;
  details?: any;
};

async function callGeminiViaBackend(request: any): Promise<GeminiProxyResponse> {
  const resp = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request }),
  });

  const data: GeminiProxyResponse = await resp.json().catch(() => ({} as any));

  if (!resp.ok) {
    // Padroniza erro para o app não ficar "cego".
    const msg =
      data?.error ||
      "Serviço de IA indisponível. A chave de segurança do sistema pode estar inválida ou ausente.";
    throw new Error(msg);
  }

  return data;
}

function extractTextFromRaw(raw: any): string {
  const parts = raw?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((p: any) => p?.text ?? "").join("").trim();
}

export const generateContent = async (prompt: string): Promise<string> => {
  try {
    const request = {
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings: medicalSafetySettings,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    const { text, raw } = await callGeminiViaBackend(request);
    return (text ?? extractTextFromRaw(raw)) || "";
  } catch (error: any) {
    console.error("Error calling Gemini (text):", error);
    const msg = (error?.message ?? "").toString().toLowerCase();
    if (msg.includes("key") || msg.includes("chave") || msg.includes("403") || msg.includes("401")) {
      return "Serviço de IA indisponível. A chave de segurança do sistema pode estar inválida ou ausente.";
    }
    return "Ocorreu um erro ao processar sua solicitação com a IA. Verifique sua conexão e tente novamente.";
  }
};

// Retorna um objeto com .text (para manter compatibilidade com componentes existentes)
export const generateContentWithGrounding = async (prompt: string): Promise<{ text: string } | null> => {
  try {
    const request = {
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      safetySettings: medicalSafetySettings,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 2048,
      },
    };

    const { text, raw } = await callGeminiViaBackend(request);
    return { text: (text ?? extractTextFromRaw(raw)) || "" };
  } catch (error) {
    console.error("Error calling Gemini with grounding:", error);
    return null;
  }
};

// Gera texto + imagens (quando o modelo devolver inlineData)
export const generateIllustratedContent = async (prompt: string): Promise<string> => {
  try {
    const request = {
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings: medicalSafetySettings,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const { raw, text } = await callGeminiViaBackend(request);

    // Se a function já trouxe texto, ótimo. Mas precisamos também capturar imagens inline.
    let full = (text ?? "").toString();

    const parts = raw?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (part?.text) {
          full += part.text;
        } else if (part?.inlineData?.data) {
          const base64String = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          full += `\n<img src="data:${mimeType};base64,${base64String}" alt="Imagem gerada pela IA" class="w-full max-w-md mx-auto rounded-xl shadow-lg my-6 border border-slate-700" />\n`;
        }
      }
    }

    return full.trim() || "Não foi possível gerar o conteúdo ilustrado.";
  } catch (error) {
    console.error("Error generating illustrated content:", error);
    return "Desculpe, ocorreu um erro ao gerar as imagens e o texto. Tente novamente.";
  }
};

export const searchPharmaciesNearby = async (
  lat: number,
  lng: number,
  medicationName: string
): Promise<{ text: string } | null> => {
  try {
    const prompt = `Encontre farmácias e drogarias próximas à minha localização atual (Latitude: ${lat}, Longitude: ${lng}) que vendam ou possam ter o medicamento "${medicationName}".

Como não consigo ver os preços exatos em tempo real, foque em me fornecer os dados de contato.

Para cada farmácia encontrada, forneça OBRIGATORIAMENTE os seguintes dados em formato de lista detalhada:
1. **Nome da Farmácia**
2. **Endereço Completo**: IMPORTANTE: Forneça o endereço como um LINK Markdown clicável que leve para a busca do Google Maps. O formato deve ser: [Endereço por Extenso](https://www.google.com/maps/search/?api=1&query=Endereço+Formatado).
3. **Telefone de contato** (se disponível)
4. **Página da Internet / Website**: Se disponível, forneça como link clicável.
5. **Entrega:** Se costumam fazer entrega/delivery.

Formate a resposta em Markdown limpo e organizado. Separe as farmácias com uma linha horizontal (---).`;

    const request = {
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng },
        },
      },
      safetySettings: medicalSafetySettings,
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    };

    const { text, raw } = await callGeminiViaBackend(request);
    return { text: (text ?? extractTextFromRaw(raw)) || "" };
  } catch (error) {
    console.error("Error calling Gemini for maps:", error);
    return null;
  }
};

export const generateImageAnalysis = async (base64Image: string, prompt: string): Promise<string> => {
  return generateDocumentAnalysis(base64Image, "image/jpeg", prompt);
};

export const generateDocumentAnalysis = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const cleanBase64 = base64Data.replace(/^data:(.*);base64,/, "");

    const request = {
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      safetySettings: medicalSafetySettings,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    };

    const { text, raw } = await callGeminiViaBackend(request);
    return (text ?? extractTextFromRaw(raw)) || "Não foi possível analisar o arquivo.";
  } catch (error) {
    console.error("Error calling Gemini for document:", error);
    return "Erro ao processar o arquivo com a IA. Tente novamente.";
  }
};
