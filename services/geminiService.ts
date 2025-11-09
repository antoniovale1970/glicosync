import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateContent = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    return "A chave da API do Gemini não está configurada. Verifique as variáveis de ambiente.";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.";
  }
};

export const generateContentWithGrounding = async (prompt: string): Promise<GenerateContentResponse | null> => {
  if (!API_KEY) {
    console.warn("API_KEY for Gemini is not set. AI features will not work.");
    return null;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    return response;
  } catch (error) {
    console.error("Error calling Gemini API with grounding:", error);
    return null;
  }
};
