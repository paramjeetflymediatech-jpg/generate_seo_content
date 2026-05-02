const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../public/cities.xlsx');
const workbook = XLSX.readFile(filePath);

console.log("Sheet Names:", workbook.SheetNames);

workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Read as raw array of arrays
    console.log(`Sheet: ${name}, Rows: ${data.length}`);
    console.log("First 3 rows:", JSON.stringify(data.slice(0, 3), null, 2));
});
