const db = require('./db');
const logger = require('./logger');
const notify = require('./notify');

module.exports = (tx) => {
  const lastLedger = db.getLedger();
  if (lastLedger < tx.ledger) {
    if (db.isLock(tx.hash)) {
      return;
    }
    db.lock(tx.hash);
    db.updateLedger(tx.ledger);
    delete tx.ledger;
    notify(tx).catch(e => {
      logger.error(e.message)
    });
  }
};