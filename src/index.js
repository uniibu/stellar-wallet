const StellarSdk = require('stellar-sdk');
const logger = require('./logger');
const storeTx = require('./storeTx')
const {getter} = require('./request')
module.exports = async(config) => {
  const server = new StellarSdk.Server(config.horizonServer);
  const latestLedgerResp = await getter("https://horizon.stellar.org/ledgers",{limit:1,order:"desc"}, true);
  const ledgerResp = await server.ledgers()
    .ledger((latestLedgerResp.body._embedded.records[0].sequence - 1000).toFixed()).call();  
  const cursor = ledgerResp.paging_token
  logger.info('Checking the last 1000 blocks')
  server.ledgers()
  .cursor(cursor.toString())
  .stream({
    onmessage: parseLedger
  })
  server.payments()
    .forAccount(config.public)
    .cursor(cursor.toString())
    .stream({
      onmessage: async function(message) {
        parseTx(await message.transaction());
      }
    })
  function parseLedger(ledgerResponse) {
    if(ledgerResponse.sequence % 10 == 0){
      logger.info('Syncing.. Block:', ledgerResponse.sequence);
    }
    storeTx({ledger: ledgerResponse.sequence, cursor: ledgerResponse.paging_token}, true);
  }
  function parseTx(txResponse) {
    if (txResponse.successful === true) {
      const txObj = {};
      const tx = new StellarSdk.Transaction(txResponse.envelope_xdr, StellarSdk.Networks.PUBLIC);
      for (const op of tx._operations) {

        if (op.destination === config.public && op.type === 'payment' && op.asset.code === 'XLM') {
          txObj.amount = op.amount;
          txObj.to = op.destination;
        }
      };
      txObj.hash = txResponse.hash;
      txObj.ledger = txResponse.ledger_attr;
      if (!txObj.amount || !txObj.to) {
        // store ledger every 25 blocks
        if (txObj.ledger % 25 == 0) {
          logger.info("Current Block:", txObj.ledger);
          storeTx(txObj, true);
        }
        return;
      }
      txObj.from = tx.source;
      txObj.memo = Number(txResponse.memo) || 0;
      storeTx(txObj, false);
    }
  }

  logger.info('Stellar Wallet started')
  logger.info('Listening for new transactions...')

}
