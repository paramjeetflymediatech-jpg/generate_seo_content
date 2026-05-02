const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());

async function test() {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    try {
        const result = await model.generateContent("say 'ready'");
        const response = await result.response;
        console.log(`Result: ${response.text()}`);
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}
test();
