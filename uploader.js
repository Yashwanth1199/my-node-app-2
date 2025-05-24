// upload xls file
const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-excel", upload.single("file"), (req, res) => {
  const filePath = req.file.path;
  const outputPath = path.join(__dirname, "converted file.json");

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    fs.unlinkSync(filePath);

    res.send("✅ Excel converted to JSON");
  } catch (error) {
    fs.unlinkSync(filePath);
    res.status(500).send("❌ Failed to convert Excel.");
  }
});

module.exports = router;
