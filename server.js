// server.js

// Importing required packages
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx'); 
const parser = require('./parser');
const inserter = require('./inserter');
const uploaderRouter = require('./uploader');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Used for file uploads

// Serve static files (e.g., a frontend form)
app.use(express.static('public'));

// Mount custom uploader routes
app.use('/', uploaderRouter);

// ✅ Route: Upload and convert Excel only
app.post('/upload-excel', upload.single('file'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'converted file.json');

  try {
    const workbook = XLSX.readFile(tempPath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
    fs.unlinkSync(tempPath);

    res.send('✅ Excel converted to JSON');
  } catch (error) {
    fs.unlinkSync(tempPath);
    console.error(error);
    res.status(500).send('❌ Failed to convert Excel');
  }
});

// ✅ Route: Upload raw file only
app.post('/upload', upload.single('file'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'converted file.json');

  fs.rename(tempPath, targetPath, (err) => {
    if (err) return res.status(500).send('❌ Failed to save uploaded file');
    res.send('✅ File uploaded successfully');
  });
});

// ✅ Route: Run JSON parsing logic (from uploaded JSON)
app.post('/parse', (req, res) => {
  try {
    parser(); // Converts `converted file.json` → `structured_traders.json`
    res.send('✅ JSON parsed successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Parsing failed');
  }
});

// ✅ Route: Insert parsed data into DB
app.post('/insert', async (req, res) => {
  try {
    await inserter(true);

    // ✅ Cleanup after insert
    ['converted file.json', 'structured_traders.json'].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️ Deleted temporary file: ${file}`);
      }
    });

    res.send('✅ Data inserted into MySQL');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ MySQL insert failed.');
  }
});

// ✅ NEW: Upload + Parse + Insert in one go
app.post('/upload-and-process', upload.single('file'), async (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'converted file.json');

  try {
    // Convert Excel to JSON
    const workbook = XLSX.readFile(tempPath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
    fs.unlinkSync(tempPath);

    // Parse structured data
    parser();

    // Insert into database
    await inserter(true);

    //Cleanup
    ['converted file.json', 'structured_traders.json'].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️ Deleted temporary file: ${file}`);
      }
     });

    res.send('✅ Upload, parse, and insert complete');
  } catch (error) {
    console.error(error);
    res.status(500).send('❌ Something failed during upload & process');
  }
});

// ✅ Start server
app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
