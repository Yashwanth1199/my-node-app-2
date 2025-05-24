const fs = require('fs');
const mysql = require('mysql2/promise');

// Parse quantity like "8.40 Qui" → 8.4 
function parseQuantity(raw) {
  if (!raw) return 0;
  return parseFloat(raw.toString().replace(/[^\d.]/g, '')) || 0;
}

async function insertToDB() {

  const tradersData = JSON.parse(fs.readFileSync('structured_traders.json', 'utf8'));

  const connection = await mysql.createConnection({
    host: '198.12.234.250',       // e.g., '123.45.67.89'
    user: 'demo_username',
    password: 'demo_password',
    database: 'demo',
    port: 3306                         // default MySQL port; change if needed
  });
  console.log('✅ Connected to MySQL');

  //current date
  function getCurrentDateFormatted() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }


  for (const trader of tradersData) {
    const traderName = trader.trader_name?.trim();

    if (!traderName || !Array.isArray(trader.lots)) {
      console.warn('⚠️ Skipping trader with missing name or lots');
      continue;
    }

    for (const lot of trader.lots) {
      try {
        const currentDate = getCurrentDateFormatted();

        const [result] = await connection.execute(
          `INSERT INTO demo_table (
        col2,
        col3,
        col4,
        col5,
        col6,
        col7,
        col8
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            lot.agent || null, //CA
            lot.lotId || null,
            lot.farmer || null,
            lot.produce || null,
            currentDate, // ⬅️ Formatted as DD/MM/YYYY
            lot.bidRate || 0,
            traderName
          ]
        );
      } catch (error) {
        console.error(`❌ Failed to insert lot ${lot.lotId}:`, error.message);
      }
    }

  }
  //verification query
  const [rows] = await connection.execute('SELECT * FROM demo_table');
  console.log('✅ Inserted rows:');
  console.table(rows);

  await connection.end();
}

// Run
//insertToDB().catch(console.error);

module.exports = insertToDB;