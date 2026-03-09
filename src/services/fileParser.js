const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const mammoth = require('mammoth');


async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    return workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      return XLSX.utils.sheet_to_csv(sheet);
    }).join('\n');
  }

  if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (ext === '.md' || ext === '.txt' || ext === '') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  throw new Error(`Extensión no soportada: "${ext}" (archivo: ${filePath})`);
}

module.exports = { parseFile };
