const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Initializes and returns a function to generate text using the Gemini API.
 */
function initGemini(apiKey) {
  const modelNames = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "gemini-2.0-flash")
    .split(",")
    .map(modelName => modelName.trim())
    .filter(Boolean);
  const maxChars = Number(process.env.GEMINI_MAX_RESULT_CHARS || "6000");
  const fallbackToMock = process.env.GEMINI_FALLBACK_TO_MOCK === "true";

  const buildMockResponse = prompt =>
    [
      "[Mock Gemini Response]",
      "Gemini quota is unavailable for this provider key, so this demo response was generated locally.",
      "",
      `Prompt: ${prompt}`,
    ].join("\n");

  if (!apiKey) {
    console.warn("WARN: GEMINI_API_KEY is not set. Using mock generation.");
    return async (prompt) => {
      // Mock generation if no API key is provided
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return buildMockResponse(prompt);
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return async (prompt) => {
    let lastError;

    for (const modelName of modelNames) {
      const model = genAI.getGenerativeModel({ model: modelName });

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
        lastError = error;
        const message = error.message || "";
        const canTryNextModel =
          message.includes("404") ||
          message.includes("not found") ||
          message.includes("not supported for generateContent");

        if (isQuotaError(message)) {
          if (fallbackToMock) {
            console.warn("[Gemini] Quota exceeded. Using mock fallback because GEMINI_FALLBACK_TO_MOCK=true.");
            return buildMockResponse(prompt);
          }

          throw new Error(`Gemini quota exceeded: ${message}`);
        }

        if (!canTryNextModel) {
          console.error("[Gemini] API Error:", error);
          throw new Error(`Gemini generation failed: ${message}`);
        }

        console.warn(`[Gemini] Model ${modelName} unavailable. Trying next configured model...`);
      }
    }

    const message = lastError?.message || "No configured Gemini models were available.";

    if (isQuotaError(message) && fallbackToMock) {
      console.warn("[Gemini] Quota exceeded. Using mock fallback because GEMINI_FALLBACK_TO_MOCK=true.");
      return buildMockResponse(prompt);
    }

    console.error("[Gemini] API Error:", lastError);
    throw new Error(`Gemini generation failed: ${message}`);
  };
}

function isQuotaError(message) {
  return (
    message.includes("429") ||
    message.includes("Too Many Requests") ||
    message.includes("quota") ||
    message.includes("rate-limits")
  );
}

module.exports = { initGemini };
