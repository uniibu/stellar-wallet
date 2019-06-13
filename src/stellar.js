const StellarSdk = require('stellar-sdk');
const logger = require('./logger');
const config = require('../config');

const sourceKeypair = StellarSdk.Keypair.fromSecret(config.secret);
const sourcePublicKey = sourceKeypair.publicKey();

const server = new StellarSdk.Server(config.horizonServer);

if (process.env.NODE_ENV === 'development') {
  StellarSdk.Network.useTestNetwork();
} else {
  StellarSdk.Network.usePublicNetwork();
}

exports.balance = async () => {
  const account = await server.loadAccount(sourcePublicKey);
  const xrp = account.balances.filter(o => o.asset_type === 'native')[0];
  if (xrp && xrp.balance) {
    return xrp.balance
  }
}

exports.validate = async (address) => {
  const r = StellarSdk.StrKey.isValidEd25519PublicKey(address)
  return r;
}
const parseTx = (o, filter) => {
  const tx = new StellarSdk.Transaction(o.envelope_xdr);
  let txObj = {};
  for (const op of tx.operations) {
    if (filter === 'deposit' && op.destination !== config.public) continue;
    if (filter === 'withdraw' && op.destination === config.public) continue;
    if (op.type === 'payment' && op.asset.code === 'XLM') {
      txObj.amount = op.amount;
      txObj.to = op.destination;
    }
  };
  if (!txObj.amount || !txObj.to) {
    logger.error(txObj)
    return;
  }
  txObj.id = o.hash;
  txObj.hash = o.hash;
  txObj.from = tx.source;
  txObj.memo = o.memo || '0';
  txObj.ledger = o.ledger_attr || o.ledger;
  return txObj;
}
exports.listTx = async (limit, filter) => {
  let account = await server.transactions().forAccount(sourcePublicKey).limit(limit).order('desc').call()
  account = account.records.map(o => {
    return parseTx(o, filter);
  }).filter(Boolean)
  return account
}

exports.withdraw = async (amount, address, memo = '0') => {
  const account = await server.loadAccount(sourcePublicKey);
  const fee = await server.fetchBaseFee();
  const transaction = new StellarSdk.TransactionBuilder(account, { fee })
  .addOperation(StellarSdk.Operation.payment({
    destination: address,
    asset: StellarSdk.Asset.native(),
    amount: amount.toFixed(7),
  }))
  .setTimeout(30)
  .addMemo(StellarSdk.Memo.text(memo))
  .build();
  transaction.sign(sourceKeypair);
  logger.info(`sending withdrawal ${address} ${amount} XLM`);
  try {
    const transactionResult = await server.submitTransaction(transaction);
    logger.info(`\nSuccess! View the transaction at: ${transactionResult._links.transaction.href}`);
    const payload = parseTx(transactionResult);
    payload.fee = fee
    return [true, payload]
  } catch (e) {
    console.log(e.stack || e.message)
    logger.error('An error has occured:', e);
    return [false, e.message];
  }
}
