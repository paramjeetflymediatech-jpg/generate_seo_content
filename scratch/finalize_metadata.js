const fs = require('fs');
const path = require('path');

function finalizeData() {
    const mappedPath = path.join(__dirname, '../public/services_mapped.json');
    const data = JSON.parse(fs.readFileSync(mappedPath, 'utf8'));

    for (const location in data) {
        const services = data[location].services; // These are now "Service in Location"
        
        // Update SEO
        const cleanServices = services.map(s => s.split(' in ')[0]);
        const servicesStr = cleanServices.slice(0, 3).join(', ');
        
        data[location].seo.title = `Top Rated ${servicesStr} in ${location} | RoofRepair`;
        data[location].seo.description = `Looking for expert roofing in ${location}? We specialize in ${services.join(', ')}. Get professional service and a free estimate today!`;
        data[location].seo.keywords = services.join(', ');

        // Update FAQ
        if (data[location].faq && data[location].faq[0]) {
            data[location].faq[0].answer = `We offer a wide range of services in ${location}, including ${services.join(', ')}. Our team is experienced in both residential and commercial roofing.`;
        }
    }

    fs.writeFileSync(mappedPath, JSON.stringify(data, null, 2));
    console.log("Successfully finalized SEO and FAQ for all locations in services_mapped.json");
}

finalizeData();
