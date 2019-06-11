const StellarSdk = require('stellar-sdk');
const logger = require('./logger');
const storeTx = require('./storeTx')
module.exports = (config) => {
  const server = new StellarSdk.Server(config.horizonServer);
  server.transactions()
  .forAccount(config.public)
  .cursor(config.cursor.toString())
  .stream({
    onmessage: txResponse => {
      if (txResponse.successful === true) {
        const txObj = {};
        const tx = new StellarSdk.Transaction(txResponse.envelope_xdr);

        for (const op of tx.operations) {
          if (op.destination === config.public && op.type === 'payment' && op.asset.code === 'XLM') {
            txObj.amount = op.amount;
            txObj.to = op.destination;
          }
        };
        if (!txObj.amount || !txObj.to) {
          return;
        }
        txObj.hash = txResponse.hash;
        txObj.from = tx.source;
        txObj.memo = Number(txResponse.memo) || 0;
        txObj.ledger = txResponse.ledger_attr;
        storeTx(txObj);
      }
    }
  });
  logger.info('Stellar Wallet started')
  logger.info('Listening for new transactions...')

}
