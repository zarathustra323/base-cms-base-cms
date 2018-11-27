const gql = require('graphql-tag');

module.exports = gql`

extend type Query {
  taxonomy(input: TaxonomyQueryInput!): Taxonomy @findOne(model: "platform.Taxonomy", using: { id: "_id" })
  taxonomies(input: TaxonomiesQueryInput = {}): TaxonomyConnection! @findMany(model: "platform.Taxonomy")
  taxonomiesOfType(input: TaxonomiesOfTypeQueryInput!): TaxonomyConnection! @findMany(model: "platform.Taxonomy", using: { type: "type" })
  rootTaxonomies(input: RootTaxonomiesQueryInput = {}): TaxonomyConnection! @findMany(model: "platform.Taxonomy", criteria: "rootTaxonomy")
  rootTaxonomiesOfType(input: RootTaxonomiesOfTypeQueryInput!): TaxonomyConnection! @findMany(model: "platform.Taxonomy", using: { type: "type" }, criteria: "rootTaxonomy")
}

type Taxonomy {
  id: Int! @value(localField: "_id")
  name: String
  fullName: String
  description: String
  type: String
  status: Int
  redirects: [String]! @arrayValue
  sequence: Int
  parent(input: TaxonomyParentInput = {}): Taxonomy @refOne(model: "platform.Taxonomy")
  children(input: TaxonomyChildrenInput = {}): TaxonomyConnection! @refMany(model: "platform.Taxonomy", localField: "_id", foreignField: "parent.$id")
}

type TaxonomyConnection {
  totalCount: Int!
  edges: [TaxonomyEdge]!
  pageInfo: PageInfo!
}

type TaxonomyEdge {
  node: Taxonomy!
  cursor: String!
}

enum TaxonomyType {
  Bin
  Category
  Location
  Organization
  Person
  PlatformChannel
  Tag
  Topic
  Type
}

enum TaxonomySortField {
  id
  name
  fullName
  sequence
}

input TaxonomyQueryInput {
  status: ModelStatus = active
  id: Int!
}

input TaxonomiesQueryInput {
  status: ModelStatus = active
  sort: TaxonomySortInput = {}
  pagination: PaginationInput = {}
}

input TaxonomiesOfTypeQueryInput {
  type: TaxonomyType!
  status: ModelStatus = active
  sort: TaxonomySortInput = {}
  pagination: PaginationInput = {}
}

input RootTaxonomiesQueryInput {
  status: ModelStatus = active
  sort: TaxonomySortInput = {}
  pagination: PaginationInput = {}
}

input RootTaxonomiesOfTypeQueryInput {
  type: TaxonomyType!
  status: ModelStatus = active
  sort: TaxonomySortInput = {}
  pagination: PaginationInput = {}
}

input TaxonomySortInput {
  field: TaxonomySortField = id
  order: SortOrder = desc
}

input TaxonomyParentInput {
  status: ModelStatus = active
}

input TaxonomyChildrenInput {
  status: ModelStatus = active
  sort: TaxonomySortInput = {}
  pagination: PaginationInput = {}
}

`;