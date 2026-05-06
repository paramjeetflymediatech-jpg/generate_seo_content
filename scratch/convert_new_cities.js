const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const xlsxPath = '/Users/flymedia/Desktop/gemini/scratch/newcities.xlsx';
const outputPath = '/Users/flymedia/Desktop/gemini/public/services_mapped.json';

function convertNewCities() {
  if (!fs.existsSync(xlsxPath)) {
    console.error(`File not found: ${xlsxPath}`);
    return;
  }

  const workbook = XLSX.readFile(xlsxPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const result = {};

  data.forEach(row => {
    const rawLocation = row['Location'];
    const keywords = row['Keywords'];

    if (rawLocation && keywords) {
      // Extract city name from "Service Name in City Name"
      // Using " in " to avoid splitting words like "Drain" or "Installation"
      const parts = rawLocation.split(" in ");
      if (parts.length < 2) return;
      
      const cityName = parts[parts.length - 1].trim();
      
      // Extract service name from keywords (part after comma)
      const keywordParts = keywords.split(',');
      const serviceName = keywordParts.length > 1 ? keywordParts[1].trim() : rawLocation;

      if (!result[cityName]) {
        result[cityName] = {
          location: cityName,
          services: []
        };
      }

      // Check if service already exists for this city
      const existingService = result[cityName].services.find(s => s.name === serviceName);
      if (!existingService) {
        result[cityName].services.push({
          name: serviceName,
          seo: {
            title: keywords,
            description: `Professional ${serviceName} services. We provide top-rated solutions with professional craftsmanship and free estimates.`,
            keywords: `${serviceName}, ${cityName} services`
          },
          faq: [
            {
              question: `What is included in ${serviceName}?`,
              answer: `Our ${serviceName} services include a thorough inspection, high-quality material selection, and expert execution tailored to your specific needs.`
            },
            {
              question: `How much does ${serviceName} cost?`,
              answer: `The cost of ${serviceName} depends on the size of the project and the requirements. Contact us for a free, no-obligation estimate.`
            }
          ],
          content: "" // Placeholder for content
        });
      }
    }
  });

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Successfully converted ${xlsxPath} to ${outputPath}`);
  console.log(`Processed ${Object.keys(result).length} unique cities and ${data.length} rows.`);
}

convertNewCities();
