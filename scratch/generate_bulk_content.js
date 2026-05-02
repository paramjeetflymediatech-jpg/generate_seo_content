const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

const mappedJsonPath = path.join(__dirname, '../public/services_mapped.json');

async function generateContent(serviceName, cityName, currentContent) {
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
        if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('503')) {
            return 'QUOTA_EXCEEDED';
        }
        console.error(`Error generating for ${serviceName} in ${cityName}:`, error.message);
        return null;
    }
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

    const BATCH_SIZE = 2;
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        const batch = tasks.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tasks.length / BATCH_SIZE)}...`);
        
        const results = await Promise.all(batch.map(async (task) => {
            console.log(`Generating: ${task.serviceName} in ${task.cityName}...`);
            const content = await generateContent(task.serviceName, task.cityName, task.service.content);
            return { ...task, content };
        }));

        let hasQuotaError = false;
        for (const res of results) {
            if (res.content === 'QUOTA_EXCEEDED') {
                hasQuotaError = true;
                continue;
            }
            if (res.content) {
                res.service.content = res.content;
                updatedCount++;
                console.log(`Success: ${res.serviceName} in ${res.cityName}`);
            }
        }

        fs.writeFileSync(mappedJsonPath, JSON.stringify(data, null, 2));
        console.log(`Progress saved. Total updated so far: ${updatedCount}`);

        if (hasQuotaError) {
            console.log("Quota exceeded. Stopping for now.");
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    console.log(`Finished processing. Total updated: ${updatedCount}`);
}

start().catch(err => {
    console.error("Critical error:", err);
});
