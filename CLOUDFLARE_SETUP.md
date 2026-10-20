# Conectar la IA real de CodeX AI

La web de GitHub Pages solo muestra la interfaz; no debe guardar claves secretas. Este repositorio incluye un backend para Cloudflare Workers que llama a Gemini y permite enviar texto e imágenes.

## 1. Crear la clave de Gemini
1. Abre [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Inicia sesión y crea una API key.
3. **No la publiques en GitHub ni la pegues en el chat.** La vas a guardar como secreto en Cloudflare.
4. Comprueba los límites y condiciones de uso de tu cuenta/modelo en Google AI Studio.

## 2. Crear el backend gratuito en Cloudflare
1. Entra a [Cloudflare Dashboard](https://dash.cloudflare.com/) y crea una cuenta si hace falta.
2. Ve a **Workers & Pages** → **Create** → **Worker** (el nombre exacto puede variar).
3. Crea el Worker y abre **Edit code**.
4. Reemplaza el ejemplo por todo el contenido de `worker.js` de este repositorio y guarda/despliega.
5. En la configuración del Worker abre **Settings** → **Variables and Secrets** (o **Environment Variables**).
6. Añade una variable secreta con nombre exacto `GEMINI_API_KEY` y como valor la clave de Google AI Studio. Márcala como **Secret**, no como texto público.
7. Guarda y vuelve a desplegar si Cloudflare te lo pide.
8. Copia la URL que Cloudflare asignó al Worker, por ejemplo `https://tu-worker.tu-cuenta.workers.dev`. Usa tu URL real, no el ejemplo.

## 3. Conectar la web
1. Abre la web publicada de CodeX AI.
2. Pulsa el botón **⚙ IA** arriba a la derecha.
3. Pega la URL de tu Worker (sin añadir `/api/chat`) y confirma.
4. Prueba pedirle que escriba un pequeño programa. También puedes adjuntar una imagen.

La URL del Worker se guarda solo en el navegador donde la configures. Si abres la web en otro dispositivo, tendrás que pegarla allí también.

## Qué incluye
- Respuestas generadas por Gemini, no por plantillas locales.
- Conversación con contexto de los últimos mensajes.
- Envío de imágenes para análisis.
- Respuestas de programación orientadas a Lua, Node.js, JavaScript y HTML.
- La clave de Gemini permanece en el secreto del Worker y no se incluye en el HTML público.

## Solución de problemas
- **Falta GEMINI_API_KEY:** revisa el secreto en la configuración del Worker.
- **Error 429 / cuota:** espera o revisa los límites de tu cuenta y del modelo.
- **Error de conexión:** comprueba que la URL termine en `.workers.dev` y que el Worker esté desplegado.
- **La IA no responde:** revisa el mensaje de error y la disponibilidad del modelo en Google AI Studio.
