const envalid = require('envalid')
const { str, port } = envalid
const keys = require('../keys.json');

const env = envalid.cleanEnv(process.env, {
  NODE_ENV: str({ default: 'production' }),
  NOTIFY_URL: str(),
  PORT: port({ default: 8877 })
})

const config = Object.assign({}, keys, env);
module.exports = config;
