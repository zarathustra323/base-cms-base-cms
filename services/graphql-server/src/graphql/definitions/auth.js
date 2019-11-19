const gql = require('graphql-tag');

module.exports = gql`

extend type Query {
  activeUser: User @requiresAuth
}

extend type Mutation {
  userTokenCreate(input: UserLoginMutationInput!): UserAuthentication!
  userTokenDestroy: String! @requiresAuth
}

enum AuthRole {
  admin
  member
  restricted
}

type UserAuthentication {
  user: User!
  token: UserAuthToken!
}

type UserAuthToken {
  id: String!
  value: String!
}

input UserLoginMutationInput {
  username: String!
  password: String!
}

`;
