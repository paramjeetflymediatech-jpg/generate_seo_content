const fs = require('fs');
const path = require('path');

const citiesJsonPath = path.join(__dirname, '../public/cities.json');
const mappedJsonPath = path.join(__dirname, '../public/services_mapped.json');

const citiesData = JSON.parse(fs.readFileSync(citiesJsonPath, 'utf8'));
const mappedData = JSON.parse(fs.readFileSync(mappedJsonPath, 'utf8'));

// 1. Add Calgary if missing
const standardServices = [
    "Gutter Installation",
    "Metal Roofing",
    "Roof Inspection",
    "Roof Installation",
    "Roof Leak Repair",
    "Roof Repair",
    "Tile Roofing"
];

if (!mappedData['Calgary']) {
    console.log("Adding Calgary to services_mapped.json...");
    mappedData['Calgary'] = {
        location: "Calgary",
        services: standardServices.map(s => ({
            name: `${s} in Calgary`,
            seo: {
                title: `${s} in Calgary | Expert Roofing in Calgary`,
                description: `Expert ${s} in Calgary. We provide top-rated roofing solutions in Calgary with professional craftsmanship and free estimates.`,
                keywords: `${s} in Calgary, Calgary roofing, roof repair Calgary`
            },
            faq: [
                {
                    question: `What is included in ${s} in Calgary?`,
                    answer: `Our ${s} services in Calgary include a thorough inspection, high-quality material selection, and expert installation or repair tailored to the specific needs of your property.`
                },
                {
                    question: `How much does ${s} cost in Calgary?`,
                    answer: `The cost of ${s} in Calgary depends on the size of the project and the materials chosen. Contact us for a free, no-obligation estimate.`
                }
            ],
            content: ""
        }))
    };
}

// 2. Update titles from cities.json
let updatedCount = 0;
for (const cityEntry of citiesData) {
    const cityName = cityEntry.location;
    const newTitle = cityEntry.title;

    if (mappedData[cityName]) {
        const services = mappedData[cityName].services;
        for (const service of services) {
            // Core name matching logic
            const coreName = service.name.split(' in ')[0].toLowerCase();
            // Handle "Roofing Leak Repair" vs "Roof Leak Repair"
            const searchName = coreName.replace('roofing', 'roof');
            
            if (newTitle.toLowerCase().includes(searchName) || newTitle.toLowerCase().includes(coreName)) {
                service.seo.title = newTitle;
                updatedCount++;
            }
        }
    }
}

fs.writeFileSync(mappedJsonPath, JSON.stringify(mappedData, null, 2));
console.log(`Calgary added (if missing). Total titles updated: ${updatedCount}`);
