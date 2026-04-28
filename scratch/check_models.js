const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // Note: The SDK doesn't have a direct listModels method on the genAI instance in some versions.
    // We might need to use the fetch API or a different approach if it's not available.
    // But let's try a few standard ones.
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    
    for (const m of models) {
        try {
            console.log(`Checking ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("Hello");
            console.log(`✅ ${m} is available!`);
        } catch (e) {
            console.log(`❌ ${m} failed: ${e.message}`);
        }
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

listModels();
