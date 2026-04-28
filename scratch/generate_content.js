const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function generateContent(title, keywords, location, retryCount = 0) {
    const prompt = `Generate an extensive, high-quality, professional long-form content for a service page.
    Location: ${location}
    Service/Title: ${title}
    Keywords to include: ${keywords}
    
    CRITICAL REQUIREMENT: The content MUST be at least 1200 words long. I need deep, comprehensive coverage. Do not be concise. 
    
    Structure the content with Markdown:
    1. A powerful H1 heading for ${title}.
    2. An introductory section (approx 200 words) discussing the importance of this service in ${location}.
    3. 6-8 Detailed Sections (H2 and H3) covering:
       - Specific local challenges in ${location} (weather, geography, etc.).
       - Benefits of professional service vs DIY.
       - Material choices and why they matter for the local climate.
       - Step-by-step process of the service.
       - Maintenance tips for homeowners.
       - Why choosing local experts is essential.
    4. A FAQ-style section integrated into the text.
    5. A strong conclusion (approx 200 words) with a Call to Action.
    
    TIPS:
    - Mention local landmarks or specific ${location} characteristics to make it feel hyper-local.
    - Use a professional, authoritative, yet approachable tone.
    - Ensure keywords are naturally integrated.
    
    Output ONLY the markdown content.`;

    try {
        console.log(`Calling Gemini API for ${title} (Attempt ${retryCount + 1})...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.7,
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`API Error (${response.status}): ${errText}`);
            
            if ((response.status === 503 || response.status === 429) && retryCount < 5) {
                const waitTime = Math.pow(2, retryCount) * 10000; // Exponential backoff: 10s, 20s, 40s...
                console.log(`Retrying in ${waitTime/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return generateContent(title, keywords, location, retryCount + 1);
            }
            return null;
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error(`Unexpected response for ${title}:`, JSON.stringify(data, null, 2));
            return null;
        }
    } catch (error) {
        console.error(`Error generating for ${title}:`, error.message);
        return null;
    }
}

async function main() {
    const filePath = path.join(__dirname, '../public/services_mapped.json');
    console.log(`Reading ${filePath}...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let count = 0;

    for (const locName in data) {
        const location = data[locName];
        
        // 1. Check Location-level content
        if (!location.content || location.content.split(' ').length < 800) {
            console.log(`--- Processing Location: ${locName} ---`);
            const title = `${location.location} Roofing Solutions: Premier Protection for Your Home and Business`;
            const keywords = location.seo.keywords;
            const newContent = await generateContent(title, keywords, locName);
            if (newContent) {
                location.content = newContent;
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`[SUCCESS] Updated content for ${locName}`);
                count++;
            }
        }

        // 2. Check Service-level content
        for (const service of location.services) {
            if (!service.content || service.content.split(' ').length < 800) {
                console.log(`--- Processing Service: ${service.name} in ${locName} ---`);
                const newContent = await generateContent(service.name, service.seo.keywords, locName);
                if (newContent) {
                    service.content = newContent;
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    console.log(`[SUCCESS] Updated content for ${service.name}`);
                    count++;
                }
            }
        }
    }

    console.log(`Finished! Total items updated: ${count}`);
}

main().catch(console.error);
