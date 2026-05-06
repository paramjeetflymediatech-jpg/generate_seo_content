const XLSX = require('xlsx');

function inspectXlsx(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`--- Inspecting ${filePath} ---`);
    console.log('Sheet Name:', sheetName);
    console.log('First 5 rows:', JSON.stringify(data.slice(0, 5), null, 2));
    console.log('Total rows:', data.length);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

inspectXlsx('/Users/flymedia/Desktop/gemini/scratch/newcities.xlsx');
