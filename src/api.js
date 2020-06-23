const Koa = require('koa');
const Router = require('koa-router');
const bouncer = require('koa-bouncer');
const logger = require('./logger');
const app = new Koa();
const router = new Router();
const config = require('../config');
const { truncateSeven, hideKey } = require('./helpers');
const { balance, validate, listTx, withdraw } = require('./stellar');
const { getLedger } = require('./src/db');

app.use(
  require('koa-bodyparser')({
    extendTypes: {
      json: ['text/plain']
    },
    enableTypes: ['json']
  })
);
app.use(bouncer.middleware());
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    logger.error(err.stack || err.message);
    if (err instanceof bouncer.ValidationError) {
      ctx.status = 400;
      ctx.body = { success: false, error: err.message };
      return;
    } else {
      ctx.body = { success: false, error: err.message };
      return;
    }
  }
});
router.use(async (ctx, next) => {
  ctx.validateQuery('key').required('Missing key').isString().trim();
  if (!config.key === ctx.vals.key) {
    logger.error('invalid key');
    return ctx.throw(403, 'Forbidden');
  }
  ctx.request.query.key = hideKey(ctx.request.query.key)
  delete ctx.vals.key
  await next();
});
router.get('/blocknumber', async ctx => {
  logger.info('RPC /blocknumber was called');
  const block = getLedger();
  ctx.body = { success: true, block };
});
router.get('/balance', async ctx => {
  logger.info('RPC /balance was called', ctx.request.query);
  const bal = await balance();
  ctx.body = { success: true, balance: { value: bal, currency: 'XLM' } };
});
router.get('/validate', async ctx => {
  logger.info('RPC /validate was called:', ctx.request.query);
  ctx.validateQuery('address').required('Missing address').isString().trim();
  const validAddress = await validate(ctx.vals.address);
  ctx.body = { success: validAddress };
  logger.info(ctx.body)
});

router.get('/gettransactions', async ctx => {
  logger.info('RPC /gettransactions was called:', ctx.request.query);
  ctx.validateQuery('limit').optional();
  ctx.validateQuery('filter').optional().isIn(['deposit', 'withdraw'], 'Invalid filter');
  const limit = +ctx.vals.limit || 100;
  let txs = await listTx(limit, ctx.vals.filter);

  ctx.body = { success: true, transactions: txs };
});
router.post('/withdraw', async (ctx) => {
  logger.info('RPC /withdraw was called:', ctx.request.body);
  ctx.validateBody('amount').required('Missing amount').toDecimal('Invalid amount').tap(n => truncateSeven(n))
  ctx.validateBody('address').required('Missing address').isString().trim();
  ctx.validateBody('memo').optional().isString().trim().isAlphanumeric()
  ctx.check(ctx.vals.amount && ctx.vals.amount >= 0.000001, 'Invalid amount');
  ctx.check(ctx.vals.address, 'Invalid address');
  const validAddress = await validate(ctx.vals.address);
  ctx.check(validAddress, 'Inactive address');
  const [result, data] = await withdraw(ctx.vals.amount, ctx.vals.address, ctx.vals.memo);
  const payload = { success: result };
  if (!result) {
    payload.error = data;
  } else {
    payload.txid = data.id;
    payload.fee = data.fee.toFixed(6);
  }
  ctx.body = payload;

});
app.use(router.routes());
app.use(router.allowedMethods());
module.exports = app;
