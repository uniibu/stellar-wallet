const low = require('lowdb');
const { resolve, extname } = require('path');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('src/db/db.json');
const db = low(adapter);

let connected = false;

const connect = () => {
  if (connected) return true;
  db.defaults({ ledger: 0 }).write();
  connected = true;
  return;
};

exports.updateLedger = (ledgerIndex,pagingToken) => {
  connect();
  db.set('ledger', ledgerIndex).write();
  db.set('cursor', pagingToken).write();
  return;
};
exports.getLedger = () => {
  connect();
  return {
    ledger: db.get('ledger').value() || 0,
    cursor: db.get('cursor').value() || "now"
  } 
};
