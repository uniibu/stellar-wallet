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

exports.updateLedger = ledgerIndex => {
  connect();
  db.set('ledger', ledgerIndex).write();
  return;
};
exports.getLedger = () => {
  connect();
  return db.get('ledger').value();
};
