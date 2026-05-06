const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const xlsxPath = '/Users/flymedia/Desktop/gemini/scratch/newcities.xlsx';
const outputPath = '/Users/flymedia/Desktop/gemini/public/cities.json';

function convertXlsxToJson() {
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
    const location = row['Location'];
    const keywords = row['Keywords'];

    if (location && keywords) {
      if (!result[location]) {
        result[location] = [];
      }
      const locationname = location.split("in")[1].trim();
      // Extract the service name from keywords (assuming it's after the last comma)
      const keywordParts = keywords.split(',');
      const serviceName = keywordParts[keywordParts.length - 1].trim();

      if (!result[location].includes(serviceName)) {
        result[locationname].push(serviceName);
      }
    }
  });

  // Sort services within each location
  for (const location in result) {
    result[location].sort();
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Successfully converted ${xlsxPath} to ${outputPath}`);
  console.log(`Found ${Object.keys(result).length} locations.`);
}

convertXlsxToJson();
