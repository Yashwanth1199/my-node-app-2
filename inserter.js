const fs = require('fs');
const mysql = require('mysql2/promise');

function getCurrentDateFormatted() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

async function insertToDB(returnRows = false) {
  const tradersData = JSON.parse(fs.readFileSync('structured_traders.json', 'utf8'));

  const connection = await mysql.createConnection({
    host: '198.12.234.250',
    user: 'demo_username',
    password: 'demo_password',
    database: 'demo',
    port: 3306
  });

  console.log('✅ Connected to MySQL');

  //delete all the rows first - for testing 
  // try {
  //   const [result] = await connection.query('DELETE FROM demo_table');
  //   console.log(`Deleted ${result.affectedRows} rows`);
  // } catch (err) {
  //   console.error('Error executing query:', err);
  // } 

  let insertedCount = 0;

  for (const trader of tradersData) {
    const traderName = trader.trader_name?.trim();

    if (!traderName || !Array.isArray(trader.lots)) {
      console.warn('⚠️ Skipping trader with missing name or invalid lots');
      continue;
    }

    for (const lot of trader.lots) {
      const lotId = lot.lotId || null;
      const farmer = lot.farmer || null;
      const produce = lot.produce || null;
      const bags = lot.bags || null;
      const bidRate = lot.bidRate || 0;
      const agent = lot.agent || null;
      const date = getCurrentDateFormatted();

      // Debug: log what will be inserted
      // console.log(`📦 Inserting lot:`, {
      //   traderName,
      //   lotId,
      //   farmer,
      //   produce,
      //   bags,
      //   bidRate,
      //   agent,
      //   date
      // });

      // Skip clearly invalid entries
      if (!lotId || !farmer || !produce) {
        console.warn('⚠️ Skipping lot due to missing critical fields');
        continue;
      }

      try {
        const [result] = await connection.execute(
          `INSERT INTO demo_table (
            col2, col3, col4, col5, col6, col7, col8
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            agent,        // col2 - CA
            lotId,        // col3 - Lot ID
            farmer,       // col4 - Farmer
            produce,      // col5 - Produce
            date,         // col6 - Date
            bidRate,      // col7 - Bid Rate
            traderName    // col8 - Trader Name
          ]
        );

        insertedCount++;
      } catch (error) {
        console.error(`❌ Failed to insert lot ${lotId}:`, error.message);
      }
    }
  }

  console.log(`✅ Total lots inserted: ${insertedCount}`);

  let rows = [];
  if (returnRows) {
  [rows] = await connection.execute(
    'SELECT * FROM demo_table ORDER  BY col6 DESC'
  );
  console.table(rows); // ✅ cleaner tabular output
}

  await connection.end();
  return rows;
}

module.exports = insertToDB;
