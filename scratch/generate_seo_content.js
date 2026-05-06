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

const genAI = new GoogleGenerativeAI(apiKey);
// Using gemini-3.1-flash-lite-preview for cost-effective bulk generation
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

const xlsxPath = path.join(__dirname, '../scratch/newcities.xlsx');
const outputPath = path.join(__dirname, '../public/new_seo_content_structured.json');
const logPath = path.join(__dirname, '../scratch/generation_progress.log');

async function generateSEOContent(serviceFullName, cityName, excelKeywords) {
    const prompt = `
You are an expert SEO content strategist and writer. 
Generate a comprehensive SEO package for the service "${serviceFullName}" in "${cityName}".

TARGET KEYWORDS: ${excelKeywords}

CRITICAL REQUIREMENT 1: The "content" section MUST be at least 1500 words long. This is non-negotiable. Be extremely detailed, informative, and provide deep insights.
CRITICAL REQUIREMENT 2: You MUST naturally incorporate the target keywords listed above throughout the content.

Requirements:
1. SEO Title: Catchy, keyword-rich, and under 60 characters.
2. Meta Description: Compelling, includes a call-to-action, and under 160 characters.
3. Keywords: Return ONLY the exact keywords provided in the "TARGET KEYWORDS" list above.
4. FAQ: Generate 10-12 relevant and helpful FAQs. Each answer must be 2-3 detailed paragraphs.
5. Content: Write a detailed, engaging service page content. 
   - THE CONTENT MUST BE AT LEAST 1500 WORDS.
   - Use HTML structure (<h2>, <h3>, <p>, <ul>, <li>).
   - Focus on the local context of ${cityName}.
   - Include these EXACT sections with extensive detail: 
     - 1. Comprehensive Introduction to ${serviceFullName}
     - 2. Why ${serviceFullName} is Essential for Local Homeowners
     - 3. The Benefits of Professional-Grade ${serviceFullName}
     - 4. Why Our Team is the Preferred Choice in ${cityName}
     - 5. Our Detailed, Step-by-Step ${serviceFullName} Process
     - 6. Specific ${cityName} Local Considerations (Climate impacts, Local building codes, Community needs)
     - 7. Advanced Solutions and Technologies We Use
     - 8. Energy Efficiency and Long-Term Cost Savings
     - 9. Safety Standards and Industry Compliance
     - 10. Seasonal Maintenance Tips for Longevity
     - 11. Frequently Asked Questions (Detailed)
     - 12. Conclusion and Service Area Information

Return the result STRICTLY in the following JSON format:
{
  "seo": {
    "title": "...",
    "description": "...",
    "keywords": "${excelKeywords}"
  },
  "faq": [
    { "question": "...", "answer": "..." },
    ...
  ],
  "content": "..." (HTML content)
}
`;

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            
            if (text.includes('```json')) {
                text = text.split('```json')[1].split('```')[0].trim();
            } else if (text.includes('```')) {
                text = text.split('```')[1].split('```')[0].trim();
            }

            const parsed = JSON.parse(text);
            const wordCount = parsed.content.split(/\s+/).length;
            
            if (wordCount >= 1000) {
                return parsed;
            } else {
                console.log(`Attempt ${attempt} failed length check: ${wordCount} words. Retrying with more emphasis...`);
            }
        } catch (error) {
            console.error(`Error generating for ${serviceFullName} (Attempt ${attempt}):`, error.message);
        }
    }
    return null;
}

async function generateLocationContent(cityName, attempt = 1) {
    const prompt = `
You are an expert local SEO content writer. 
Generate a comprehensive location overview package for the city of "${cityName}".
This will be used for the main landing page for all our services in this city.

CRITICAL REQUIREMENT: The "content" section MUST be at least 1200 words long.

Requirements:
1. SEO Title: Catchy, location-focused, and under 60 characters.
2. Meta Description: Compelling overview of services in ${cityName}, under 160 characters.
3. Keywords: 10-15 keywords relevant to the city and home services.
4. Content: Write a detailed, engaging city-level overview.
   - THE CONTENT MUST BE AT LEAST 1200 WORDS.
   - Use HTML structure (<h2>, <h3>, <p>, <ul>, <li>).
   - Highlight the city's unique characteristics, climate, and community.
   - Mention we provide HVAC, Plumbing, Electrical, and Renovations.
   - Include sections like: Introduction, Local Expertise, Community Commitment, Home Maintenance Challenges in ${cityName}, and Conclusion.

Return the result STRICTLY in the following JSON format:
{
  "seo": {
    "title": "...",
    "description": "...",
    "keywords": "..."
  },
  "content": "..." (HTML content)
}
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        if (text.includes('```json')) {
            text = text.split('```json')[1].split('```')[0].trim();
        } else if (text.includes('```')) {
            text = text.split('```')[1].split('```')[0].trim();
        }

        return JSON.parse(text);
    } catch (error) {
        console.error(`Error generating location content for ${cityName} (Attempt ${attempt}):`, error.message);
        if (attempt < 3) {
            console.log(`Retrying location content in 10s...`);
            await new Promise(r => setTimeout(r, 10000));
            return generateLocationContent(cityName, attempt + 1);
        }
        return null;
    }
}

async function run() {
    console.log("Reading Excel data...");
    const workbook = XLSX.readFile(xlsxPath);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    let results = {};
    if (fs.existsSync(outputPath)) {
        results = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    }

    const totalRows = data.length;
    let completedInThisRun = 0;

    // ... (alreadyDoneCount calculation stays the same)
    const alreadyDoneCount = data.filter(row => {
        const rawLocation = row['Location'];
        if (!rawLocation) return false;
        const parts = rawLocation.split(" in ");
        if (parts.length < 2) return false;
        const cityName = parts[parts.length - 1].trim();
        const serviceFullName = rawLocation.trim();
        const cityObj = results[cityName];
        if (!cityObj) return false;
        
        const existingService = cityObj.services.find(s => s.name === serviceFullName);
        if (existingService && existingService.content) {
            const existingWordCount = existingService.content.split(/\s+/).length;
            return existingWordCount >= 1000;
        }
        return false;
    }).length;

    const remainingToProcess = totalRows - alreadyDoneCount;

    console.log(`--- Generation Started ---`);
    console.log(`Total Rows: ${totalRows}`);
    console.log(`Already Completed: ${alreadyDoneCount}`);
    console.log(`Remaining to Process: ${remainingToProcess}`);
    console.log(`--------------------------`);

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rawLocation = row['Location']; 
        
        if (!rawLocation) continue;

        const parts = rawLocation.split(" in ");
        if (parts.length < 2) continue;

        const cityName = parts[parts.length - 1].trim();
        const serviceFullName = rawLocation.trim();

        if (!results[cityName]) {
            results[cityName] = {
                location: cityName,
                content: "", // Placeholder for location content
                services: []
            };
        }

        // Generate location content if missing
        if (!results[cityName].seo || !results[cityName].content || results[cityName].content.length < 1000) {
            console.log(`\nGenerating Location Content for ${cityName}...`);
            const locData = await generateLocationContent(cityName);
            if (locData) {
                results[cityName].seo = locData.seo;
                results[cityName].content = locData.content;
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
                console.log(`Location content and SEO for ${cityName} updated.`);
            }
        }

        const existingService = results[cityName].services.find(s => s.name === serviceFullName);
        const excelKeywords = row['Keywords'] || "";
        
        if (existingService) {
            // Enforce "titles and keywords should be same" rule even for existing data
            if (existingService.seo.title !== excelKeywords || existingService.seo.keywords !== excelKeywords) {
                console.log(`Updating SEO title/keywords for existing: ${serviceFullName}`);
                existingService.seo.title = excelKeywords;
                existingService.seo.keywords = excelKeywords;
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            }

            if (existingService.content) {
                const existingWordCount = existingService.content.split(/\s+/).length;
                if (existingWordCount >= 1000) {
                    continue;
                }
            }
        }

        completedInThisRun++;
        const currentPending = remainingToProcess - completedInThisRun;
        const totalCompletedOverall = alreadyDoneCount + completedInThisRun;

        console.log(`\n[Progress: ${totalCompletedOverall}/${totalRows}] [Current Run: ${completedInThisRun}/${remainingToProcess}] [Pending: ${currentPending}]`);
        console.log(`Processing: ${serviceFullName}...`);

        const generated = await generateSEOContent(serviceFullName, cityName, excelKeywords);

        if (generated) {
            const serviceObj = {
                name: serviceFullName,
                seo: {
                    ...generated.seo,
                    title: excelKeywords,
                    keywords: excelKeywords
                },
                faq: generated.faq,
                content: generated.content
            };

            // Update or push
            const idx = results[cityName].services.findIndex(s => s.name === serviceFullName);
            if (idx > -1) {
                results[cityName].services[idx] = serviceObj;
            } else {
                results[cityName].services.push(serviceObj);
            }

            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            const wordCount = generated.content.split(/\s+/).length;
            console.log(`Success! Word count: ${wordCount}`);
            fs.appendFileSync(logPath, `[SUCCESS] ${new Date().toLocaleString()} - ${serviceFullName} (${wordCount} words)\n`);
        } else {
            console.log(`Failed for ${serviceFullName}`);
            fs.appendFileSync(logPath, `[FAILED] ${new Date().toLocaleString()} - ${serviceFullName}\n`);
        }

        console.log("Waiting 15 seconds to respect rate limits...");
        await new Promise(resolve => setTimeout(resolve, 15000));
    }

    console.log("Done!");
}

run().catch(console.error);
