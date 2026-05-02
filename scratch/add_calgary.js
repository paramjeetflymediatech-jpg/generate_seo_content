const fs = require('fs');
const path = require('path');

const mappedPath = path.join(__dirname, '../public/services_mapped.json');
const data = JSON.parse(fs.readFileSync(mappedPath, 'utf8'));

// Standard services list based on existing cities
const standardServices = [
    "Gutter Installation",
    "Metal Roofing",
    "Roof Inspection",
    "Roof Installation",
    "Roof Leak Repair",
    "Roof Repair",
    "Tile Roofing"
];

if (!data['Calgary']) {
    console.log("Adding Calgary to services_mapped.json...");
    data['Calgary'] = {
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
    fs.writeFileSync(mappedPath, JSON.stringify(data, null, 2));
    console.log("Calgary added.");
} else {
    console.log("Calgary already exists.");
}
