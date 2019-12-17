const mongodb = require('./mongodb');
const loadTenants = require('./load-tenants');

const { log } = console;

process.on('unhandledRejection', (e) => {
  throw e;
});

const run = async () => {
  const client = await mongodb.connect();
  log(`BaseCMS DB connected to ${client.s.url}`);

  const tenants = await loadTenants({ mongodb });
  log(tenants);

  await mongodb.close(true);
  log('DONE!');
};

run().catch(e => setImmediate(() => { throw e; }));
