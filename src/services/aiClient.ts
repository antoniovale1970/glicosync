export async function callAI(prompt: string) {
  const resp = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      model: "gemini-1.5-flash",
      temperature: 0.7,
      maxOutputTokens: 1024,
    }),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msgParts = [
      data?.error ||
        "Serviço de IA indisponível. A chave pode estar inválida ou ausente.",
      data?.hint,
    ].filter(Boolean);
    const msg = msgParts.join(" ");
    throw new Error(msg);
  }

  return (data?.text ?? "") as string;
}
