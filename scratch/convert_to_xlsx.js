const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function convertJsonToXlsx() {
    const jsonPath = path.join(__dirname, '../public/subcategpories.json');
    const xlsxPath = path.join(__dirname, '../public/subcategories.xlsx');

    if (!fs.existsSync(jsonPath)) {
        console.error('File not found:', jsonPath);
        return;
    }

    try {
        // Read JSON data
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        // Filter for name and slug only
        const filteredData = jsonData.map(item => ({
            name: item.name,
            slug: item.slug
        }));

        // Create a new workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(filteredData);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Subcategories');

        // Write the workbook to a file
        XLSX.writeFile(workbook, xlsxPath);

        console.log('Successfully converted subcategpories.json to subcategories.xlsx');
        console.log('Path:', xlsxPath);
    } catch (error) {
        console.error('Error during conversion:', error.message);
    }
}

convertJsonToXlsx();
