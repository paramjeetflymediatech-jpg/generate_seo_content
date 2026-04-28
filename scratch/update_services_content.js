const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function generateLongContent(location, services) {
    const prompt = `Generate an extensive, high-quality, professional roofing service page content for ${location}.
    Services offered: ${services.join(", ")}
    
    CRITICAL REQUIREMENT: The content MUST be at least 1000 words long. 
    
    Structure:
    1. Introduction to Roofing in ${location} (Climate, needs).
    2. Deep dive into each service: ${services.join(", ")}.
    3. Why choose professional roofing in ${location}.
    4. Materials and technology used.
    5. Actionable maintenance tips for ${location} homeowners.
    6. Conclusion and call to action.
    
    Format the output as plain text with clear paragraph breaks (no markdown formatting like # or *).`;

    try {
        console.log(`Generating content for ${location}...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error(`Error generating content for ${location}:`, error);
        return null;
    }
}

async function main() {
    const filePath = path.join(__dirname, '../public/services_mapped.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const locations = Object.keys(data);
    
    for (const location of locations) {
        // Skip if content is already long (optional safety)
        if (data[location].content && data[location].content.split(' ').length > 800) {
            console.log(`Skipping ${location}, already has long content.`);
            continue;
        }

        const newContent = await generateLongContent(location, data[location].services);
        if (newContent) {
            data[location].content = newContent;
            // Save after each city to avoid data loss on crash/timeout
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Updated ${location} (${newContent.split(' ').length} words).`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("Finished updating all locations.");
}

main();
