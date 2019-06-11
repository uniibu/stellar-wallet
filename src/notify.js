const queue = require('queuing');
const logger = require('./logger');
const db = require('./db');
const p = require('phin')
const q = queue({ autostart: true, retry: true, concurrency: 1, delay: 5000 });
const pkgjson = require('../package.json');
const got = async (method, uri, payload) => {
  const opts = {
    url: uri,
    method,
    data: payload,
    headers: {
      'User-Agent': `${pkgjson.name.charAt(0).toUpperCase() + pkgjson.name.substr(1)}/${pkgjson.version} (Node.js ${process.version})`,
      'Content-Type': 'application/json'
    }
  };
  try {
    logger.info('sending notification...')
    const r = await p(opts);
    if (r.statusCode !== 200) {
      if (opts.url !== 'https://canihazip.com/s') {
        logger.error(`error sending notification statusCode: ${r.statusCode}. retrying...`);
       }
      return false;
    }
    return r.body || true;
  } catch (e) {
    if (opts.url !== 'https://canihazip.com/s') {
      logger.error(`error sending notification ${e.message || e.stack}. retrying...`);
    }
    return false;
  }
};
const notify = async txobj => {
  q.push(async retry => {
    const r = await got('POST', process.env.NOTIFY_URL, txobj);
    if (r) {
      db.unlock(txobj.hash);
      logger.info('sending deposit notification success for txid', txobj.hash);
    }
    retry(!r);
  });
};
module.exports = notify;
