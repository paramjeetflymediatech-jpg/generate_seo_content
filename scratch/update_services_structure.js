const fs = require('fs');
const path = require('path');

function updateStructure() {
    const mappedPath = path.join(__dirname, '../public/services_mapped.json');

    if (!fs.existsSync(mappedPath)) {
        console.error('services_mapped.json not found');
        return;
    }

    const data = JSON.parse(fs.readFileSync(mappedPath, 'utf8'));
    const updatedData = {};

    for (const [locationName, locationData] of Object.entries(data)) {
        const services = locationData.services;
        const newServices = [];

        // Try to extract content blocks from the main content if possible
        const contentBlocks = {};
        if (locationData.content) {
            // Split by headings (all caps lines)
            const sections = locationData.content.split(/\n\n(?=[A-Z\s]{5,})/);
            sections.forEach(section => {
                const lines = section.trim().split('\n');
                if (lines.length > 1) {
                    const header = lines[0].trim();
                    const body = lines.slice(1).join('\n').trim();
                    contentBlocks[header.toUpperCase()] = body;
                }
            });
        }

        for (const serviceItem of services) {
            // Handle if it's already an object (from previous run) or still a string
            const serviceName = typeof serviceItem === 'string' ? serviceItem : serviceItem.name;
            const cleanServiceName = serviceName.replace(` in ${locationName}`, '');
            
            let extractedContent = typeof serviceItem === 'object' && serviceItem.content ? serviceItem.content : `Professional ${serviceName} services in ${locationName}. We ensure high-quality workmanship and durable materials for all our roofing projects.`;
            
            const normalizedServiceName = cleanServiceName.toUpperCase();
            for (const [header, body] of Object.entries(contentBlocks)) {
                if (header.includes(normalizedServiceName) || normalizedServiceName.includes(header.replace(' SERVICES', '').replace(' SYSTEMS', '').replace(' SPECIALIZATION', ''))) {
                    extractedContent = body;
                    break;
                }
            }

            newServices.push({
                name: serviceName,
                seo: {
                    title: `${serviceName} | Expert Roofing in ${locationName}`,
                    description: `Expert ${serviceName}. We provide top-rated roofing solutions in ${locationName} with professional craftsmanship and free estimates.`,
                    keywords: `${serviceName}, ${locationName} roofing, roof repair ${locationName}`
                },
                faq: [
                    {
                        question: `What is included in ${serviceName}?`,
                        answer: `Our ${cleanServiceName} services in ${locationName} include a thorough inspection, high-quality material selection, and expert installation or repair tailored to the specific needs of your property.`
                    },
                    {
                        question: `How much does ${cleanServiceName} cost in ${locationName}?`,
                        answer: `The cost of ${cleanServiceName} in ${locationName} depends on the size of the project and the materials chosen. Contact us for a free, no-obligation estimate.`
                    }
                ],
                content: extractedContent
            });
        }

        updatedData[locationName] = {
            ...locationData,
            services: newServices
        }
    }

    fs.writeFileSync(mappedPath, JSON.stringify(updatedData, null, 2));
    console.log('Successfully updated structure for all locations in services_mapped.json');
}

updateStructure();
