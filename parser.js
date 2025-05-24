const fs = require('fs');

function parseJson() {
  const rawData = fs.readFileSync('converted file.json', 'utf8');
  const jsonArray = JSON.parse(rawData);

  let tradersMap = new Map();
  let currentTrader = null;
  let currentAgent = null;
  let expectLocationNext = false;

  jsonArray.forEach((entry) => {
    const srNo = entry['Sr No.'];

    // 💡 Detect trader name as a row
    if (srNo === 'Trader Name:') {
      currentTrader = entry['__EMPTY']?.trim();
      tradersMap.set(currentTrader, {
        trader_name: currentTrader,
        location: '',
        lots: [],
        summary: null
      });
      expectLocationNext = true;
      currentAgent = null;
      return;
    }

    // 💡 If next row is a location (after 'Trader Name:')
    if (expectLocationNext && typeof srNo === 'string') {
      if (currentTrader && tradersMap.has(currentTrader)) {
        tradersMap.get(currentTrader).location = srNo.trim();
      }
      expectLocationNext = false;
      return;
    }

    // 💡 Detect Commission Agent row like "CA:"
    if (typeof srNo === 'string' && srNo.trim().startsWith('CA')) {
      currentAgent = entry['LOT ID']?.trim(); // CA in LOT ID column
      return;
    }

    // 💡 Detect trader name from column if exists
    const columnTrader = entry['Tradername']?.trim();
    if (columnTrader && !tradersMap.has(columnTrader)) {
      tradersMap.set(columnTrader, {
        trader_name: columnTrader,
        location: '',
        lots: [],
        summary: null
      });
    }

    // 💡 Skip non-lot rows
    if (typeof srNo !== 'number') return;

    // 💡 Determine trader name from current context or row
    const traderKey = currentTrader || columnTrader;
    if (!traderKey || !tradersMap.has(traderKey)) return;

    // 💡 Create lot
    const lot = {
      lotId: entry['LOT ID'],
      farmer: entry['Farmer_Name'],
      village: entry['Village'],
      produce: entry['Commodity'] || entry['__EMPTY_3'],
      packaging: entry['__EMPTY_6'] || null,
      bags: entry['No.of Bags'] || entry['__EMPTY_7'],
      quantity: entry['Qty'] || entry['__EMPTY_10'],
      bidRate: entry['Bid Rate'],
      value: entry['Value'],
      agent: entry['Commision Agent']?.trim() || currentAgent
    };

    tradersMap.get(traderKey).lots.push(lot);

    // 💡 Detect summary (optional)
    if (srNo === 'Trader Total in Quintal' && tradersMap.has(traderKey)) {
      tradersMap.get(traderKey).summary = {
        totalBags: entry['__EMPTY_7'],
        totalQuantity: entry['__EMPTY_10'],
        totalValue: entry['Value']
      };
    }
  });

  const traders = Array.from(tradersMap.values());
  fs.writeFileSync('structured_traders.json', JSON.stringify(traders, null, 2), 'utf8');
  console.log('✅ Structured data written to structured_traders.json');
}

module.exports = parseJson;
