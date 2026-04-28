const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '../.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        console.log(result.response.text());
    } catch (e) {
        console.error("Test gemini-1.5-flash failed:", e.message);
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result2 = await model2.generateContent("Say hello");
            console.log("gemini-pro worked");
        } catch (e2) {
            console.error("Test gemini-pro failed:", e2.message);
        }
    }
}

test();
