const fs = require('fs');
const path = require('path');

function syncServices() {
    const servicesPath = path.join(__dirname, '../public/services.json');
    const mappedPath = path.join(__dirname, '../public/services_mapped.json');

    if (!fs.existsSync(servicesPath)) {
        console.error('services.json not found');
        return;
    }
    if (!fs.existsSync(mappedPath)) {
        console.error('services_mapped.json not found');
        return;
    }

    const servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
    const mappedData = JSON.parse(fs.readFileSync(mappedPath, 'utf8'));

    const locations = Object.keys(mappedData);
    let updatedCount = 0;

    for (const location of locations) {
        if (servicesData[location]) {
            const existingServices = mappedData[location].services || [];
            const newServiceNames = servicesData[location];
            
            mappedData[location].services = newServiceNames.map(name => {
                const existing = existingServices.find(s => (typeof s === 'string' ? s : s.name) === name);
                if (existing && typeof existing === 'object') {
                    return existing;
                }
                return {
                    name: name,
                    seo: { title: "", description: "", keywords: "" },
                    faq: [],
                    content: ""
                };
            });
            updatedCount++;
        } else {
            console.warn(`Location ${location} not found in services.json`);
        }
    }

    fs.writeFileSync(mappedPath, JSON.stringify(mappedData, null, 2));
    console.log(`Successfully updated services for ${updatedCount} locations in services_mapped.json`);
}

syncServices();
