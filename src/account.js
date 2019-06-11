const StellarSdk = require('stellar-sdk');
const fs = require('fs-extra');
const { genKey } = require('./helpers');
const { getter } = require('./request');
const { getLedger } = require('./db');
async function generateConfig() {
  const pair = StellarSdk.Keypair.random();
  const pairObject = { public: pair.publicKey(), secret: pair.secret() };
  const createFile = async () => {
    pairObject.horizonServer = process.env.NODE_ENV !== 'production' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org';
    pairObject.key = genKey()
    pairObject.cursor = getLedger()
    await fs.writeJson('../keys.json', pairObject, { spaces: 2 })
  }

  if (process.env.NODE_ENV !== 'production') {
    const { body } = await getter('https://friendbot.stellar.org', { addr: encodeURIComponent(pairObject.public) })
    if (body.hash) {
      await createFile()
    }
  } else {
    await createFile()
  }
  return pairObject;
}

module.exports = generateConfig;
