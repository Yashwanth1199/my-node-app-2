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

  for (const trader of tradersData) {
    const traderName = trader.trader_name?.trim();

    if (!traderName || !Array.isArray(trader.lots)) {
      console.warn('⚠️ Skipping trader with missing name or lots');
      continue;
    }

    for (const lot of trader.lots) {
      try {
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
            lot.lotId || null,
            lot.farmer || null,
            lot.produce || null,
            traderName,
            lot.bags,
            parseQuantity(lot.quantity),
            lot.bidRate || 0
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