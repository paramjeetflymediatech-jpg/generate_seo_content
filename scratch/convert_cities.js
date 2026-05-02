const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbook = XLSX.readFile(path.join(__dirname, '../public/cities.xlsx'));
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Use header: 1 to get raw rows
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const result = [];

// Skip header if it exists. User said 1st col is location, 2nd is title.
for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row && row.length >= 2) {
        const location = row[0] ? row[0].toString().trim() : '';
        const title = row[1] ? row[1].toString().trim() : '';
        
        if (location && title && location.toLowerCase() !== 'location') {
            result.push({
                location: location,
                title: title
            });
        }
    }
}

fs.writeFileSync(path.join(__dirname, '../public/cities.json'), JSON.stringify(result, null, 2));
console.log(`Successfully converted ${result.length} cities to cities.json`);
