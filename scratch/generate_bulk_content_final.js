const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

const mappedJsonPath = path.join(__dirname, '../public/services_mapped.json');

async function generateWithRetry(serviceName, cityName, currentContent, retries = 3) {
    for (let i = 0; i < retries; i++) {
        const wordCount = currentContent ? currentContent.split(/\s+/).length : 0;
        const prompt = `You are an expert SEO content writer specialized in the Canadian roofing industry.
Generate a comprehensive, high-quality, and hyper-local service page content for "${serviceName}" in "${cityName}".

The content MUST be at least 1500 words long.
Use HTML tags like <h2>, <h3>, <p>, <ul>, <li> for structure.
Do NOT include <html>, <body>, or <head> tags. Just the content body.

Key sections to include:
1. Introduction to ${serviceName} in ${cityName}.
2. Importance of professional ${serviceName} for local homeowners.
3. Specific challenges related to ${cityName}'s climate (e.g., heavy snow, rain, or wind) and how this service addresses them.
4. Detailed breakdown of the process for ${serviceName}.
5. Benefits of choosing local experts for ${cityName} roofing needs.
6. Maintenance tips for longevity.
7. FAQ section (different from the one already in the JSON).

Focus on being helpful, authoritative, and locally relevant to ${cityName}.
Current word count is ${wordCount}. Please expand it significantly to exceed 1500 words.
Return ONLY the HTML content.`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            const msg = error.message;
            if (msg.includes('429') || msg.includes('quota')) {
                return 'QUOTA_EXCEEDED';
            }
            if (msg.includes('503') || msg.includes('Service Unavailable')) {
                console.log(`503 error for ${serviceName} in ${cityName}. Retrying in 30s... (Attempt ${i+1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 30000));
                continue;
            }
            console.error(`Error generating for ${serviceName} in ${cityName}:`, msg);
            return null;
        }
    }
    return null;
}

async function start() {
    let data = JSON.parse(fs.readFileSync(mappedJsonPath, 'utf8'));
    let updatedCount = 0;
    
    const tasks = [];
    for (const cityName in data) {
        const city = data[cityName];
        for (const service of city.services) {
            const wordCount = service.content ? service.content.split(/\s+/).length : 0;
            if (wordCount < 1000) {
                tasks.push({ cityName, service, serviceName: service.name });
            }
        }
    }

    console.log(`Found ${tasks.length} services needing update.`);

    for (const task of tasks) {
        console.log(`Generating: ${task.serviceName} in ${task.cityName}...`);
        const content = await generateWithRetry(task.serviceName, task.cityName, task.service.content);
        
        if (content === 'QUOTA_EXCEEDED') {
            console.log("Quota exceeded. Stopping for now.");
            break;
        }

        if (content) {
            task.service.content = content;
            updatedCount++;
            console.log(`Success: ${task.serviceName} in ${task.cityName}`);
            
            // Save after EVERY success to ensure progress
            fs.writeFileSync(mappedJsonPath, JSON.stringify(data, null, 2));
            console.log(`Progress saved. Total updated: ${updatedCount}`);
        } else {
            console.log(`Failed to generate for ${task.serviceName} in ${task.cityName}`);
        }

        // 20 second delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 20000));
    }

    console.log(`Finished processing. Total updated: ${updatedCount}`);
}

start().catch(err => {
    console.error("Critical error:", err);
});
