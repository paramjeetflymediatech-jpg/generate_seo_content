const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env file.");
    process.exit(1);
}

let genAI = new GoogleGenerativeAI(apiKey);
let model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

function refreshModel() {
    try {
        const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
        const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.*)/);
        if (match && match[1]) {
            const newKey = match[1].trim();
            genAI = new GoogleGenerativeAI(newKey);
            model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
            console.log("Model refreshed with new API key.");
            return true;
        }
    } catch (err) {
        console.error("Error refreshing model:", err.message);
    }
    return false;
}

const mappedJsonPath = path.join(__dirname, '../public/services_mapped.json');
const xlsxPath = path.join(__dirname, '../scratch/cities.xlsx');
const notificationsPath = path.join(__dirname, '../scratch/updates_notifications.log');

// Append to notifications instead of clearing
fs.appendFileSync(notificationsPath, `\n${'='.repeat(30)}\nUpdate Resumed at ${new Date().toLocaleString()}\n${'='.repeat(30)}\n\n`);

async function generateWithRetry(serviceName, cityName, currentContent, retries = 3) {
    for (let i = 0; i < retries; i++) {
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

async function run() {
    // 1. Read Excel data
    console.log("Reading Excel data...");
    const workbook = XLSX.readFile(xlsxPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet);
    
    // Create a map for quick lookup: map[cityName] = [ { keywords, serviceNameMatched } ]
    const keywordsLookup = {};
    excelRows.forEach(row => {
        const cityName = row.Location;
        const keywords = row.Keywords;
        if (!keywordsLookup[cityName]) keywordsLookup[cityName] = [];
        keywordsLookup[cityName].push(keywords);
    });

    // 2. Read JSON data
    console.log("Reading services_mapped.json...");
    let data = JSON.parse(fs.readFileSync(mappedJsonPath, 'utf8'));

    let updatedTitlesCount = 0;
    const tasks = [];

    // 3. Process each city and service
    for (const cityName in data) {
        const cityData = data[cityName];
        const cityKeywordsList = keywordsLookup[cityName] || [];

        if (cityData.services && Array.isArray(cityData.services)) {
            for (const service of cityData.services) {
                const serviceName = service.name; // e.g., "Gutter Installation in Corner Brook"
                
                // Find matching keyword row
                // The Keywords column contains strings like "Find Gutter Installation Companies in Corner Brook, Gutter Installation in Corner Brook"
                // We match if the service name is present in the keywords string.
                const matchingKeywords = cityKeywordsList.find(k => k.toLowerCase().includes(serviceName.toLowerCase()));
                
                if (matchingKeywords) {
                    if (service.seo.title !== matchingKeywords) {
                        service.seo.title = matchingKeywords;
                        updatedTitlesCount++;
                    }
                } else {
                    // Fallback or log if no match found
                    // console.log(`No matching keywords found in Excel for ${serviceName} in ${cityName}`);
                }

                // Check content length
                const content = service.content || "";
                const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
                if (wordCount < 800) {
                    tasks.push({ cityName, service, serviceName });
                }
            }
        }
    }

    console.log(`Updated ${updatedTitlesCount} SEO titles in memory.`);
    console.log(`Found ${tasks.length} services with < 800 words.`);

    // Save title updates immediately
    fs.writeFileSync(mappedJsonPath, JSON.stringify(data, null, 2));
    console.log("Saved SEO title updates to services_mapped.json.");

    // 4. Update content for thin services
    let updatedContentCount = 0;
    for (let i = 0; i < tasks.length; i++) {
        const { cityName, service, serviceName } = tasks[i];
        console.log(`[${i+1}/${tasks.length}] Generating content for: ${serviceName} in ${cityName}...`);
        
        const newContent = await generateWithRetry(serviceName, cityName, service.content);

        if (newContent === 'QUOTA_EXCEEDED') {
            const quotaMsg = `\n[QUOTA EXCEEDED] ${new Date().toLocaleTimeString()} - Quota limit reached. Please update GEMINI_API_KEY in .env to resume.\n`;
            fs.appendFileSync(notificationsPath, quotaMsg);
            
            console.log("\n" + "!".repeat(50));
            console.log("QUOTA EXCEEDED! Please update the GEMINI_API_KEY in the .env file.");
            console.log("The script will wait and retry every 60 seconds...");
            console.log("!".repeat(50) + "\n");
            
            let keyUpdated = false;
            while (!keyUpdated) {
                await new Promise(resolve => setTimeout(resolve, 60000));
                console.log("Checking for key update...");
                if (refreshModel()) {
                    // Try to generate again with the new key
                    const retryContent = await generateWithRetry(serviceName, cityName, service.content);
                    if (retryContent !== 'QUOTA_EXCEEDED' && retryContent !== null) {
                        // Successfully recovered
                        fs.appendFileSync(notificationsPath, `[RESUMING] ${new Date().toLocaleTimeString()} - New API key detected. Continuing updates...\n`);
                        
                        let cleanedContent = retryContent.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
                        service.content = cleanedContent;
                        updatedContentCount++;
                        fs.writeFileSync(mappedJsonPath, JSON.stringify(data, null, 2));
                        keyUpdated = true;
                        console.log(`Success after key update! Progress saved.`);
                    } else if (retryContent === 'QUOTA_EXCEEDED') {
                        console.log("Still hitting quota with the current key. Please check the key again.");
                    }
                }
            }
            continue; // Move to next task after recovery
        }

        if (newContent) {
            // Clean up Markdown code blocks if present
            let cleanedContent = newContent.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();
            service.content = cleanedContent;
            updatedContentCount++;
            const newWordCount = cleanedContent.split(/\s+/).filter(w => w.length > 0).length;
            console.log(`Success! New word count: ${newWordCount}`);
            
            // Save progress after each generation
            fs.writeFileSync(mappedJsonPath, JSON.stringify(data, null, 2));
            
            // Log to notification file
            fs.appendFileSync(notificationsPath, `[SUCCESS] ${new Date().toLocaleTimeString()} - ${serviceName} in ${cityName} (Word count: ${newWordCount})\n`);
            
            console.log(`Progress saved. Total content updated: ${updatedContentCount}`);
        } else {
            console.log(`Failed to generate for ${serviceName}`);
        }

        // Add delay to respect rate limits (20 seconds as seen in other scripts)
        if (i < tasks.length - 1) {
            console.log("Waiting 20 seconds...");
            await new Promise(resolve => setTimeout(resolve, 20000));
        }
    }

    console.log("Process complete.");
    console.log(`Summary: ${updatedTitlesCount} titles updated, ${updatedContentCount} contents updated.`);
}

run().catch(err => {
    console.error("Critical error:", err);
});
