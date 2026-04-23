const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Initializes and returns a function to generate text using the Gemini API.
 */
function initGemini(apiKey) {
  if (!apiKey) {
    console.warn("WARN: GEMINI_API_KEY is not set. Using mock generation.");
    return async (prompt) => {
      // Mock generation if no API key is provided
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return `[Mock Response] This is a mocked output for your prompt: "${prompt}". Please set GEMINI_API_KEY to use the real model.`;
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // We use gemini-1.5-flash as it's fast and suitable for this hackathon
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  return async (prompt) => {
    try {
      console.log(`[Gemini] Generating response for prompt: "${prompt}"...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log(`[Gemini] Generation complete!`);
      return text;
    } catch (error) {
      console.error("[Gemini] API Error:", error);
      return `[Error generating response: ${error.message}]`;
    }
  };
}

module.exports = { initGemini };
