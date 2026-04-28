const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/services_mapped.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let totalServices = 0;
let shortContentServices = 0;
let totalLocations = 0;
let shortContentLocations = 0;

for (const loc in data) {
    totalLocations++;
    if (data[loc].content.split(' ').length < 500) {
        shortContentLocations++;
    }
    
    data[loc].services.forEach(service => {
        totalServices++;
        if (!service.content || service.content.split(' ').length < 500) {
            shortContentServices++;
        }
    });
}

console.log(`Total Locations: ${totalLocations}`);
console.log(`Locations with short content: ${shortContentLocations}`);
console.log(`Total Services: ${totalServices}`);
console.log(`Services with short content: ${shortContentServices}`);
