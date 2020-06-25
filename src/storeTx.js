const db = require('./db');
const logger = require('./logger');
const notify = require('./notify');

module.exports = (tx, updateOnly = false) => {
  if (updateOnly) {
    db.updateLedger(tx.ledger, tx.cursor);
  } else {
    const {ledger} = db.getLedger();
    if (ledger <= tx.ledger) {
      delete tx.ledger;
      notify(tx).catch(e => {
        logger.error(e.message)
      });
    }
  }
};