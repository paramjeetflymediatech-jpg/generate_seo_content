const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const MAPPED_PATH = path.join(__dirname, '../public/services_mapped.json');

async function generateContent(title, location, keywords) {
    const prompt = `Generate an exhaustive, high-quality, professional roofing service guide for:
    Service: ${title}
    Location: ${location}
    Keywords: ${keywords}
    
    CRITICAL REQUIREMENT: The content MUST be at least 1200 words long. Use a professional, authoritative, and helpful tone.
    
    Use the following structure (Markdown):
    # The Ultimate Guide to ${title}: [Catchy Subtitle]
    
    [Intro paragraph - ~150 words]
    
    ## The ${location} Climate: Why Your Choice Matters
    [Discuss local weather impacts like rain, wind, snow specific to ${location} - ~200 words]
    
    ## The Benefits of ${title}
    [Detailed benefits, energy efficiency, longevity, etc. - ~250 words]
    
    ## Exploring Materials and Techniques
    [Discuss different options, modern technologies used - ~200 words]
    
    ## Why Professional ${location} Roofing Expertise is Essential
    [Discuss precision, local building codes, safety - ~200 words]
    
    ## Maintaining Your Investment
    [Maintenance tips, what to look for, when to call a pro - ~150 words]
    
    ## Lifecycle Value and Cost Considerations
    [Discuss ROI, long-term savings vs upfront cost - ~150 words]
    
    ## Conclusion: A Legacy of Protection
    [Summary and CTA - ~100 words]
    
    Use bold text for emphasis and ensure the content is deeply relevant to ${location}.`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text;
    } catch (error) {
        console.error(`Error generating for ${title}:`, error.message);
        return null;
    }
}

async function expandAll() {
    if (!fs.existsSync(MAPPED_PATH)) {
        console.error('File not found');
        return;
    }

    const data = JSON.parse(fs.readFileSync(MAPPED_PATH, 'utf8'));
    const cities = Object.keys(data);

    for (const cityName of cities) {
        const cityData = data[cityName];

        // 1. Expand City Content if needed
        const cityWords = cityData.content.split(/\s+/).length;
        if (cityWords < 1000) {
            console.log(`Expanding city content for ${cityName} (${cityWords} words)...`);
            const newContent = await generateContent(`Professional Roofing Services`, cityName, cityData.seo.keywords);
            if (newContent) {
                cityData.content = newContent;
                fs.writeFileSync(MAPPED_PATH, JSON.stringify(data, null, 2));
                console.log(`Updated ${cityName} city content.`);
            }
            await new Promise(r => setTimeout(r, 2000)); // Rate limit buffer
        }

        // 2. Expand Service Content
        for (let i = 0; i < cityData.services.length; i++) {
            const service = cityData.services[i];
            const serviceWords = service.content.split(/\s+/).length;

            if (serviceWords < 1000) {
                console.log(`Expanding service: ${service.name} (${serviceWords} words)...`);
                const newContent = await generateContent(service.name, cityName, service.seo.keywords);
                if (newContent) {
                    service.content = newContent;
                    fs.writeFileSync(MAPPED_PATH, JSON.stringify(data, null, 2));
                    console.log(`Updated ${service.name}.`);
                }
                await new Promise(r => setTimeout(r, 2000)); // Rate limit buffer
            }
        }
    }

    console.log('Finished content expansion.');
}

expandAll();
