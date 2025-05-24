const fs = require('fs');

const KEY = {
  srNo:          ['Sr No.', '__EMPTY', 'sr_no'],
  lotId:         ['LOT ID', 'Lot ID', '__EMPTY_1'],
  farmer:        ['Farmer_Name', 'Farmer Name', '__EMPTY_2'],
  village:       ['Village', '__EMPTY_4'],
  commodity:     ['Commodity', '__EMPTY_3', 'Produce'],
  bagType:       ['Bag Type', '__EMPTY_6', 'Packaging'],
  bags:          ['No.of Bags', 'No. of Bags', '__EMPTY_7'],
  qty:           ['Qty', 'Quantity', '__EMPTY_10'],
  bidRate:       ['Bid Rate', 'Rate', '__EMPTY_12'],
  value:         ['Value', '__EMPTY_14'],
  traderName:    ['Tradername', 'Trader Name', '__EMPTY_17'],
  agent:         ['Commision Agent', 'Commission Agent', '__EMPTY_15'],
};

function first(obj, list) {
  return list.map(k => obj[k]).find(v => v !== undefined && v !== null && v !== '');
}

function parseJson(pathIn = 'converted file.json', pathOut = 'structured_traders.json') {
  const jsonArray = JSON.parse(fs.readFileSync(pathIn, 'utf8'));

  const tradersMap = new Map();
  let currentTrader = null;
  let currentAgent  = null;
  let expectLocationNext = false;

  jsonArray.forEach(entry => {
    const srNo = first(entry, KEY.srNo);

    /* ---- Detect “Trader Name:” header row --------------------------- */
    if (srNo === 'Trader Name:') {
      currentTrader = first(entry, ['__EMPTY', 'Trader Name', KEY.traderName[0]])?.trim();
      tradersMap.set(currentTrader, { trader_name: currentTrader, location: '', lots: [], summary: null });
      expectLocationNext = true;
      currentAgent = null;
      return;
    }

    /* ---- Location row right after “Trader Name:” -------------------- */
    if (expectLocationNext && typeof srNo === 'string') {
      tradersMap.get(currentTrader).location = srNo.trim();
      expectLocationNext = false;
      return;
    }

    /* ---- Commission-agent row (starts with “CA”) -------------------- */
    if (typeof srNo === 'string' && srNo.trim().startsWith('CA')) {
      currentAgent = first(entry, KEY.lotId)?.trim();   // agent’s name in Lot-ID column
      return;
    }

    /* ---- Plain trader name column (winner-list style) --------------- */
    const columnTrader = first(entry, KEY.traderName)?.trim();
    if (columnTrader && !tradersMap.has(columnTrader)) {
      tradersMap.set(columnTrader, { trader_name: columnTrader, location: '', lots: [], summary: null });
    }

    /* ---- Skip rows that don’t start with a numeric Sr No. ----------- */
    if (typeof srNo !== 'number') return;

    /* ---- Normal lot line ------------------------------------------- */
    const traderKey = currentTrader || columnTrader;
    if (!traderKey || !tradersMap.has(traderKey)) return;

    const lot = {
      lotId:    first(entry, KEY.lotId),
      farmer:   first(entry, KEY.farmer),
      village:  first(entry, KEY.village),
      produce:  first(entry, KEY.commodity),
      packaging:first(entry, KEY.bagType),
      bags:     first(entry, KEY.bags),
      quantity: first(entry, KEY.qty),
      bidRate:  first(entry, KEY.bidRate),
      value:    first(entry, KEY.value),
      agent:    first(entry, KEY.agent) || currentAgent
    };

    tradersMap.get(traderKey).lots.push(lot);

    /* ---- Optional summary row (same pattern for both files) --------- */
    if (srNo === 'Trader Total in Quintal') {
      tradersMap.get(traderKey).summary = {
        totalBags:     first(entry, KEY.bags),
        totalQuantity: first(entry, KEY.qty),
        totalValue:    first(entry, KEY.value),
      };
    }
  });

  fs.writeFileSync(pathOut, JSON.stringify(Array.from(tradersMap.values()), null, 2));
  console.log('✅ Structured data written to', pathOut);
}

module.exports = parseJson;
