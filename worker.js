const MODEL = "gemini-3.5-flash";
const SYSTEM_INSTRUCTION = `Eres CodeX AI, un asistente experto en programación que responde en español claro y amable. Tu especialidad es generar, explicar, depurar y mejorar código. Los únicos lenguajes de programación permitidos para generar código son Lua, Node.js, JavaScript y HTML. Si el usuario elige un lenguaje, respétalo. Da código completo cuando sea razonable, explica dónde colocarlo y señala dependencias o riesgos. Usa bloques Markdown con el lenguaje correcto. No afirmes que ejecutaste o probaste código si no lo hiciste. Si el usuario adjunta una imagen, analízala y úsala como contexto para ayudarle.`;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";
    const cors = corsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({ service: "CodeX AI API", status: "ok", endpoint: "/api/chat" }, { headers: cors });
    }
    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return Response.json({ error: "Ruta no encontrada." }, { status: 404, headers: cors });
    }
    if (!env.GEMINI_API_KEY) {
      return Response.json({ error: "Falta configurar el secreto GEMINI_API_KEY en Cloudflare." }, { status: 500, headers: cors });
    }

    try {
      const raw = await request.text();
      if (raw.length > 7_000_000) {
        return Response.json({ error: "La solicitud es demasiado grande. Prueba con una imagen más pequeña." }, { status: 413, headers: cors });
      }
      const body = JSON.parse(raw);
      if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return Response.json({ error: "Envía un mensaje para comenzar." }, { status: 400, headers: cors });
      }

      const messages = body.messages.slice(-12);
      const contents = [];
      for (const item of messages) {
        if (!item || !["user", "model"].includes(item.role)) continue;
        const parts = [];
        if (item.role === "user") {
          const language = ["Lua", "Node.js", "JavaScript", "HTML"].includes(item.language) ? item.language : "JavaScript";
          const text = typeof item.text === "string" ? item.text.slice(0, 12000) : "";
          parts.push({ text: `Lenguaje seleccionado: ${language}. Solicitud del usuario: ${text || "Analiza la imagen adjunta y ayúdame con el código."}` });
          if (item.image && typeof item.image.data === "string" && item.image.data.length < 6_500_000) {
            const mimeType = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(item.image.mimeType) ? item.image.mimeType : "image/jpeg";
            parts.push({ inline_data: { mime_type: mimeType, data: item.image.data } });
          }
        } else {
          parts.push({ text: String(item.text || "").slice(0, 12000) });
        }
        if (parts.length) contents.push({ role: item.role, parts });
      }

      const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          generationConfig: { temperature: 0.65, maxOutputTokens: 6000 }
        })
      });

      const result = await upstream.json();
      if (!upstream.ok) {
        const detail = result?.error?.message || "El proveedor de IA rechazó la solicitud.";
        return Response.json({ error: detail }, { status: upstream.status === 429 ? 429 : 502, headers: cors });
      }
      const text = (result.candidates || []).flatMap(c => c.content?.parts || []).map(p => p.text || "").join("\n").trim();
      if (!text) return Response.json({ error: "La IA no devolvió texto. Intenta reformular la petición." }, { status: 502, headers: cors });
      return Response.json({ text, model: MODEL }, { headers: { ...cors, "Cache-Control": "no-store" } });
    } catch (error) {
      return Response.json({ error: "No se pudo procesar la solicitud. Revisa la configuración e inténtalo de nuevo." }, { status: 500, headers: cors });
    }
  }
};
