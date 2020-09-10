const { ApolloServer } = require('apollo-server-express');
const { get } = require('@base-cms/object-path');
const { getFromRequest } = require('@base-cms/tenant-context');
const { Router } = require('express');
const { isObject } = require('@base-cms/utils');
const { requestParser: canonicalRules } = require('@base-cms/canonical-path');
const ApolloNewrelicExtension = require('apollo-newrelic-extension');
const createAuthContext = require('../auth-context/create');
const createUserService = require('../user/create');
const createBaseRestClient = require('../create-rest-client');
const newrelic = require('../newrelic');
const basedbFactory = require('../basedb');
const createLoaders = require('../dataloaders');
const schema = require('../graphql/schema');
const loadSiteContext = require('../site-context/load');
const {
  GRAPHQL_ENDPOINT,
  APOLLO_ENGINE_ENABLED,
  APOLLO_ENGINE_API_KEY,
  NEW_RELIC_ENABLED,
  GRAPHQL_DEBUG_ENABLED,
  GRAPHQL_PLAYGROUND_ENABLED,
} = require('../env');

const { keys } = Object;
const router = Router();

const config = {
  // @todo Investigate why tracing and cacheControl are causing
  // responses to be multiple megabytes in size!
  tracing: false,
  cacheControl: false,
  extensions: NEW_RELIC_ENABLED ? [() => new ApolloNewrelicExtension()] : [],
  engine: APOLLO_ENGINE_ENABLED ? { apiKey: APOLLO_ENGINE_API_KEY } : false,
  introspection: true,
  debug: GRAPHQL_DEBUG_ENABLED,
  playground: GRAPHQL_PLAYGROUND_ENABLED ? { endpoint: GRAPHQL_ENDPOINT } : false,
};

const server = new ApolloServer({
  schema,
  ...config,
  context: async ({ req }) => {
    const { body } = req;
    const { tenant, siteId } = getFromRequest(req);
    const dbContext = {
      type: 'Apollo GraphQL Request',
      clientName: req.get('apollographql-client-name'),
      clientVersion: req.get('apollographql-client-version'),
      operationName: body.operationName,
      variables: body.variables,
    };
    const basedb = basedbFactory(tenant, dbContext);
    const loaders = createLoaders(basedb);

    // Load the (optional) site context from the database.
    const site = await loadSiteContext({ siteId, basedb, tenant });

    // Load the (optional) Base4 REST API client.
    // Some GraphQL mutations require this.
    const base4rest = createBaseRestClient({ uri: req.get('x-base4-api-uri') });

    // Create the auth context for use with the requires-auth directive.
    const userService = createUserService({ basedb });
    const auth = await createAuthContext({ req, userService });

    return {
      tenant,
      basedb,
      base4rest,
      site,
      auth,
      userService,
      load: async (loader, id, projection, criteria = {}) => {
        if (!loaders[loader]) throw new Error(`No dataloader found for '${loader}'`);

        const query = isObject(criteria) ? criteria : {};
        const queryKeys = keys(query);
        const sortedQuery = queryKeys.sort().reduce((o, key) => ({ ...o, [key]: query[key] }), {});

        const fieldKeys = isObject(projection) ? keys({ ...projection, _id: 1 }) : [];
        // Need to also project by any query fields.
        const sortedFields = fieldKeys.concat(queryKeys).sort();

        return loaders[loader].load([
          id,
          sortedFields.length ? sortedFields : null,
          queryKeys.length ? sortedQuery : null,
        ]);
      },
      canonicalRules: canonicalRules(req),
    };
  },
  formatError: (e) => {
    const code = get(e, 'extensions.code');
    if (code === 'INTERNAL_SERVER_ERROR') newrelic.noticeError(e);
    return e;
  },
});
server.applyMiddleware({ app: router, path: GRAPHQL_ENDPOINT });

module.exports = router;
