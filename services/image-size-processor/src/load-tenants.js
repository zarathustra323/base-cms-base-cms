const mongodb = require('./mongodb');

module.exports = async () => {
  const admin = await mongodb.admin();
  const { databases } = await admin.listDatabases({ nameOnly: true });
  return databases
    .filter(db => /^([a-z]+)_([a-z]+)_platform$/.test(db.name))
    .map(db => db.name.replace(/_platform$/, ''));
};
