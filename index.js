require('dotenv').config();
const boxen = require('boxen');
const stellar = require('./src');
const logger = require('./src/logger');
const fs = require('fs-extra');
const path = require('path');
const account = require('./src/account');
const { getPubIp } = require('./src/helpers');
const { getLedger } = require('./src/db');
const configPath = path.resolve(__dirname, 'keys.json');
let config = {};
const initCheck = async () => {
  const configExists = await fs.exists(configPath)
  if (!configExists) {
    logger.info('No keys found. Generating a new key pair...');
    config = await account();
  } else {
    logger.info('Keys found. Processing key pair...');
    config = await fs.readJson('./keys.json')
    const {cursor,ledger} = getLedger()
    config.cursor = cursor
    config.ledger = ledger
  }
  const infolog = boxen(`Environment: ${process.env.NODE_ENV}
        Withdraw Url: http://${(await getPubIp()).trim()}:8877/withdraw?key=${config.key}
        Wallet Address: ${ config.public}
        Horizer Server: ${ config.horizonServer}
        Current Block: ${ config.ledger}
        Current Cursor: ${ config.cursor}
        Key: ${ config.key}`.replace(/ {2,}/g, ''), { padding: 1, margin: 1, borderStyle: 'double' });
  infolog.split('\n').forEach(logger.boxen);
  return config;
}

initCheck().then(c => {
  stellar(c).then(_ => {
  require('./src/api').listen(process.env.PORT)
  })
}).catch(logger.error)
