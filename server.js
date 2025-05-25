const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const parser = require('./parser');
const inserter = require('./inserter');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// ✅ All-in-one: Upload → Parse → Insert
app.post('/upload-and-process', upload.single('file'), async (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'converted file.json');
  const table = req.query.table;

  if (!table) return res.status(400).send('❌ Missing required query param: ?table=table_name');

  try {
    // Step 1: Excel → JSON
    const workbook = XLSX.readFile(tempPath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
    fs.unlinkSync(tempPath);

    // Step 2: JSON → Structured JSON
    parser();

    // Step 3: Insert → DB
    console.log('📦 Inserting into table:', table);
    await inserter(true, table);
    console.log('✅ Inserted into DB');

    // Cleanup
    ['converted file.json', 'structured_traders.json'].forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });

    res.send('✅ Upload, parse, and insert complete');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Failed during upload/process/insert');
  }
});

// Start server
app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000/?table=table_name');
});
