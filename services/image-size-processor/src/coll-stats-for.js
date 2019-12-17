module.exports = async ({ mongodb, tenant } = {}) => {
  const coll = await mongodb.collection(`${tenant}_platform`, 'Asset');
  const [totalCount = 0, missingCount = 0] = await Promise.all([
    coll.countDocuments(),
    coll.countDocuments({ 'source.width': { $exists: false }, 'source.height': { $exists: false } }),
  ]);
  const percent = totalCount > 0 ? missingCount / totalCount : 0;
  return {
    tenant,
    missingCount,
    totalCount,
    percent,
  };
};
