const fs = require('fs');
const path = require('path');

const citiesJsonPath = path.join(__dirname, '../public/cities.json');
const mappedJsonPath = path.join(__dirname, '../public/services_mapped.json');

const citiesData = JSON.parse(fs.readFileSync(citiesJsonPath, 'utf8'));
const mappedData = JSON.parse(fs.readFileSync(mappedJsonPath, 'utf8'));

let updatedCount = 0;

for (const cityEntry of citiesData) {
    const cityName = cityEntry.location;
    const newTitle = cityEntry.title;

    if (mappedData[cityName]) {
        const services = mappedData[cityName].services;
        for (const service of services) {
            // Check if this newTitle belongs to this service
            // We strip "Find " and " Companies in ..." to match the core service name
            // For example: "Roof Repair in Edmonton" vs "Find Roof Repair Companies in Edmonton, Roof Repair in Edmonton"
            
            // Extract core service name from mappedData service name
            // e.g., "Roof Repair in Edmonton" -> "Roof Repair"
            const coreName = service.name.split(' in ')[0].toLowerCase();
            
            // Check if newTitle contains the coreName
            if (newTitle.toLowerCase().includes(coreName)) {
                service.seo.title = newTitle;
                updatedCount++;
                console.log(`Updated title for ${service.name}: ${newTitle}`);
            }
        }
    }
}

fs.writeFileSync(mappedJsonPath, JSON.stringify(mappedData, null, 2));
console.log(`Successfully updated ${updatedCount} service titles.`);
