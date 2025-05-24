// server.js
//importing required packages externally and from previously installed ones
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const parser = require('./parser');
const inserter = require('./inserter');
const uploaderRouter = require('./uploader'); 

//initialising our express server
const app = express();
const upload = multer({ dest: 'uploads/' }); //used for uploads

app.use(express.static('public')); //static folder for frontend
app.use('/', uploaderRouter); // Mount uploader routes

// Upload Excel and convert to JSON
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

app.post('/upload', upload.single('file'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'converted file.json');

  fs.rename(tempPath, targetPath, (err) => {
    if (err) return res.status(500).send('❌ Failed to save uploaded file');
    res.send('✅ File uploaded successfully');
  });
});

app.post('/parse', (req, res) => {
  try {
    parser();
    res.send('✅ JSON parsed successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Parsing failed');
  }
});

app.post('/insert', async (req, res) => {
  try {
    await inserter();

    // ✅ Cleanup after successful insert
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

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
