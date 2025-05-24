// parser.js
const fs = require('fs');

function parseJson() {
  const rawData = fs.readFileSync('converted file.json', 'utf8');
  const jsonArray = JSON.parse(rawData);

  let traders = [];
  let currentTrader = null;
  let expectLocationNext = false;

  jsonArray.forEach((entry) => {
    const srNo = entry['Sr No.'];

    if (srNo === 'Trader Name:') {
      currentTrader = {
        trader_name: entry['__EMPTY']?.trim(),
        location: '',
        lots: [],
        summary: null
      };
      traders.push(currentTrader);
      expectLocationNext = true;
      currentAgent = null; // reset agent when new trader begins
    } else if (expectLocationNext && typeof srNo === 'string') {
      if (currentTrader) {
        currentTrader.location = srNo.trim();
      }
      expectLocationNext = false;
    }else if (srNo === 'CA') {
      currentAgent = entry['__EMPTY']?.trim(); // Read CA from row 
    }else if (srNo === 'Trader Total in Quintal') { //note that the columns can possibly change when the report arrives, need to ensure to change them manually
      if (currentTrader) {
        currentTrader.summary = {
          totalBags: entry['__EMPTY_7'],
          totalQuantity: entry['__EMPTY_10'],
          totalValue: entry['Value']
        };
      }
    } else if (typeof srNo === 'number') {
      if (currentTrader) {
        currentTrader.lots.push({
          lotId: entry['LOT ID'],
          farmer: entry['Farmer_Name'],
          village: entry['Village'],
          produce: entry['__EMPTY_3'],
          packaging: entry['__EMPTY_6'],
          bags: entry['__EMPTY_7'],
          quantity: entry['__EMPTY_10'],
          bidRate: entry['Bid Rate'],
          value: entry['Value'],
          agent: entry['Commision Agent']?.trim() || currentAgent //either its the direct column value or it could be from a row - 
        });
      }
    }
  });

  fs.writeFileSync('structured_traders.json', JSON.stringify(traders, null, 2), 'utf8');
  console.log('✅ Structured data written to structured_traders.json');
}

module.exports = parseJson;
