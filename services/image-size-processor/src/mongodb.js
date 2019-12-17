const { createMongoClient } = require('@base-cms/db');
const { MONGO_DSN } = require('./env');

module.exports = createMongoClient(MONGO_DSN);
