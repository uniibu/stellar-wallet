const db = require('./db');
const logger = require('./logger');
const notify = require('./notify');

module.exports = (tx, updateOnly = false) => {
  if (updateOnly) {
    db.updateLedger(tx.ledger);
  } else {
    const lastLedger = db.getLedger();
    if (lastLedger < tx.ledger) {
      db.updateLedger(tx.ledger);
      delete tx.ledger;
      notify(tx).catch(e => {
        logger.error(e.message)
      });
    }
  }
};