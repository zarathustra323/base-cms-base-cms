const { iterateCursor } = require('@base-cms/db/utils');
const { content: canonicalPathFor, requestParser: getCanonicalRules } = require('@base-cms/canonical-path');
const { get } = require('@base-cms/object-path');
const createDB = require('./src/basedb');

const { log } = console;
const { TENANT_KEY } = process.env;
const basedb = createDB(TENANT_KEY);

const cleanPath = (value) => {
  if (!value) return '';
  const v = value.trim();
  if (!v) return v;
  if (/^http[s]?:\/\//.test(v)) return v;
  return `/${v.replace(/^\/+/, '')}`;
};

const canonicalRules = getCanonicalRules({ headers: {} });

const getPrimarySectionLoader = async (ids) => {
  const query = {
    _id: { $in: ids },
    status: 1,
  };
  const options = {
    projection: { alias: 1 },
  };
  const sections = await basedb.find('website.Section', query, options);
  const sectionMap = sections.reduce((map, section) => map.set(`${section._id}`, section), new Map());
  return (_, id) => sectionMap.get(`${id}`);
};

const buildIssueRedirects = async () => {
  log('Retrieving issue redirects...');
  const issueColl = await basedb.collection('magazine', 'Issue');

  const cursor = await issueColl.aggregate([
    { $match: { 'redirects.0': { $exists: true } } },
    { $unwind: '$redirects' },
    { $project: { redirects: 1 } },
  ]);

  const redirects = [];
  await iterateCursor(cursor, (doc) => {
    if (typeof doc === 'object') redirects.push({ from: doc.redirects, to: `/magazine/${doc._id}` });
  });
  log(`Found ${redirects.length} issue redirects.`);
  return redirects;
};

const buildSectionRedirects = async () => {
  log('Retrieving section redirects...');
  const sectionColl = await basedb.collection('website', 'Section');

  const cursor = await sectionColl.aggregate([
    { $match: { 'redirects.0': { $exists: true } } },
    { $unwind: '$redirects' },
    { $project: { redirects: 1, alias: 1 } },
  ]);

  const redirects = [];
  await iterateCursor(cursor, (doc) => {
    if (typeof doc === 'object') redirects.push({ from: doc.redirects, to: doc.alias });
  });
  log(`Found ${redirects.length} section redirects.`);
  return redirects;
};

const buildWebsiteProductRedirects = async (siteId) => {
  const site = await basedb.findById('platform.Product', siteId, { projection: { redirects: 1 } });

  const redirects = [];
  if (!site || !site.redirects || typeof site.redirects !== 'object') return redirects;
  Object.keys(site.redirects).forEach((from) => {
    redirects.push({ from, to: site.redirects[from] });
  });
  log(`Found ${redirects.length} site redirects.`);
  return redirects;
};

const buildContentRedirects = async () => {
  log('Retrieving content redirects...');
  const contentColl = await basedb.collection('platform', 'Content');
  const sectionIds = await contentColl.distinct('mutations.Website.primarySection.$id', {
    'mutations.Website.redirects.0': { $exists: true },
  });
  log('Getting primarySection references...');

  const load = await getPrimarySectionLoader(sectionIds);
  log('Primary section references loaded.');

  const context = { canonicalRules, load };

  const cursor = await contentColl.aggregate([
    { $match: { 'mutations.Website.redirects.0': { $exists: true } } },
    {
      $project: {
        type: 1,
        'mutations.Website.redirects': 1,
        'mutations.Website.slug': 1,
        'mutations.Website.primarySection': 1,
      },
    },
    { $unwind: '$mutations.Website.redirects' },
    {
      $project: {
        type: 1,
        'mutations.Website.redirects': 1,
        'mutations.Website.slug': 1,
        'mutations.Website.primarySection': 1,
      },
    },
  ]);

  const redirects = [];
  await iterateCursor(cursor, async (doc) => {
    if (typeof doc === 'object') {
      const redirect = get(doc, 'mutations.Website.redirects');
      const from = redirect;
      const slug = get(doc, 'mutations.Website.slug');
      const to = await canonicalPathFor({ slug, ...doc }, context);
      redirects.push({ from, to });
    }
  });
  log(`Found ${redirects.length} content redirects.`);
  return redirects;
};

const run = async () => {
  const client = await basedb.client.connect();
  log(`BaseCMS DB connected to ${client.s.url} for ${basedb.tenant}`);

  const sites = await basedb.find('platform.Product', { status: 1, type: 'Site' }, {
    projection: { _id: 1, url: 1, name: 1 },
  });
  if (sites.length < 1) throw new Error('No website product was found.');
  if (sites.length > 1) throw new Error('You cannot run this script on multi-site instances.');

  const site = sites[0];
  log(site);

  const redirectsColl = await basedb.collection('website', 'Redirects');

  const redirectCount = await redirectsColl.countDocuments();
  if (redirectCount) throw new Error('Redirects already exists for this tenant. Please remove before running this script.');

  const exists = await redirectsColl.indexExists('from_1');
  if (exists) {
    await redirectsColl.dropIndex('from_1');
    log('Old index dropped');
  }
  await redirectsColl.createIndex({ siteId: 1, from: 1 }, { unique: true });
  log('New index created.');

  const redirectGroups = await Promise.all([
    buildIssueRedirects(),
    buildSectionRedirects(),
    buildContentRedirects(),
    buildWebsiteProductRedirects(site._id),
  ]);

  const redirects = redirectGroups
    .reduce((arr, el) => arr.concat(el), [])
    .map(({ from, to }) => ({ from: cleanPath(from), to: cleanPath(to), siteId: site._id }))
    .filter(({ from, to }) => from && to);

  log(redirects);

  await basedb.close();
};

process.on('unhandledRejection', (e) => { throw e; });
run().catch(e => setImmediate(() => { throw e; }));
