const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Initializes and returns a function to generate text using the Gemini API.
 */
function initGemini(apiKey) {
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const maxChars = Number(process.env.GEMINI_MAX_RESULT_CHARS || "6000");

  if (!apiKey) {
    console.warn("WARN: GEMINI_API_KEY is not set. Using mock generation.");
    return async (prompt) => {
      // Mock generation if no API key is provided
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return `[Mock Response] This is a mocked output for your prompt: "${prompt}". Please set GEMINI_API_KEY to use the real model.`;
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  return async (prompt) => {
    try {
      console.log(`[Gemini] Generating response with ${modelName}...`);
      const result = await model.generateContent([
        "You are fulfilling a paid AI commission. Answer the user's request directly and concisely.",
        "Do not include markdown fences unless the user specifically asks for code.",
        "",
        "User commission:",
        prompt,
      ].join("\n"));
      const response = await result.response;
      const text = response.text().trim();
      console.log(`[Gemini] Generation complete!`);

      if (Number.isFinite(maxChars) && maxChars > 0 && text.length > maxChars) {
        return `${text.slice(0, maxChars)}\n\n[Truncated to ${maxChars} characters for on-chain delivery.]`;
      }

      return text || "(Gemini returned an empty response.)";
    } catch (error) {
      console.error("[Gemini] API Error:", error);
      return `[Error generating response: ${error.message}]`;
    }
  };
}

module.exports = { initGemini };
