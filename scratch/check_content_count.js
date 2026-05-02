const fs = require('fs');
const path = require('path');

const mappedJsonPath = path.join(__dirname, '../public/services_mapped.json');
const data = JSON.parse(fs.readFileSync(mappedJsonPath, 'utf8'));

let needUpdate = 0;
let total = 0;

for (const cityName in data) {
    const city = data[cityName];
    for (const service of city.services) {
        total++;
        const wordCount = service.content ? service.content.split(/\s+/).length : 0;
        if (wordCount < 1000) {
            needUpdate++;
        }
    }
}

console.log(`Total services: ${total}`);
console.log(`Services needing update (< 1000 words): ${needUpdate}`);
