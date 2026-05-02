const XLSX = require('xlsx');
const workbook = XLSX.readFile('../public/cities.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`Total rows in XLSX: ${data.length}`);
console.log(JSON.stringify(data.slice(0, 15), null, 2));
