const crypto = require('crypto')
const { getter } = require('./request')
const getPubIp = async () => {
  const { body } = await getter('https://ipv4.icanhazip.com/', {}, false);
  if (!body) {
    return 'localhost';
  }
  return body.toString();
};
const genKey = () => {
  return crypto.randomBytes(8).toString('hex');
}
const truncateSeven = (num = 0) => {
  const str = parseFloat(num).toFixed(12);
  return Number(str.substr(0, str.indexOf('.') + 8));
};

const hideKey = (key) => {
  return `${key.substr(0, 3)}******${key.substr(key.length - 3, key.length)}`;
}

module.exports = {
  getPubIp,
  genKey,
  truncateSeven,
  hideKey
}
