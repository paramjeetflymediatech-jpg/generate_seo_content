const fs = require('fs');
const path = require('path');

const mappedJsonPath = path.join(__dirname, '../public/services_mapped.json');
const data = JSON.parse(fs.readFileSync(mappedJsonPath, 'utf8'));

console.log("City | Total Services | Complete (>1000) | Incomplete");
console.log("-".repeat(50));

for (const cityName in data) {
    const city = data[cityName];
    let complete = 0;
    let incomplete = 0;
    for (const service of city.services) {
        const wordCount = service.content ? service.content.split(/\s+/).length : 0;
        if (wordCount >= 1000) {
            complete++;
        } else {
            incomplete++;
        }
    }
    console.log(`${cityName.padEnd(20)} | ${city.services.length.toString().padEnd(14)} | ${complete.toString().padEnd(16)} | ${incomplete}`);
}
