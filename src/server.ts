
import { createSchema, createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { proofreadEntry } from "./proofreader.js";
import logger from "./logger.js";

// -----------------------------------------------------------------------------
// Schema Definition
// -----------------------------------------------------------------------------
const typeDefs = /* GraphQL */ `
  type ProofreadError {
    field: String!
    message: String!
    severity: String!
  }

  type ProofreadResult {
    errors: [ProofreadError!]!
    isValid: Boolean!
    processingTimeMs: Float!
    rawResponse: String
  }

  input ProofreadInput {
    yamlEntry: String!
    specVersion: String
  }

  type Query {
    hello: String
  }

  type Mutation {
    proofreadYamlEntry(input: ProofreadInput!): ProofreadResult!
  }
`;

// -----------------------------------------------------------------------------
// Resolvers
// -----------------------------------------------------------------------------
const resolvers = {
    Query: {
        hello: () => "Hello from VEEDS Proofreader API",
    },
    Mutation: {
        proofreadYamlEntry: async (_: any, { input }: { input: { yamlEntry: string; specVersion?: string } }) => {
            logger.info("Received proofread request", { operation: "graphql-mutation" });

            try {
                const result = await proofreadEntry(input.yamlEntry, {
                    tags: ["load-test", "graphql"],
                });
                return result;
            } catch (error) {
                logger.error("GraphQL Resolver Error", { error: String(error) });
                throw error;
            }
        },
    },
};

// -----------------------------------------------------------------------------
// Server Setup
// -----------------------------------------------------------------------------
const yoga = createYoga({
    schema: createSchema({
        typeDefs,
        resolvers,
    }),
    graphqlEndpoint: "/graphql", // Matches the path in k6 test
});

const server = createServer(yoga);

const PORT = 4000;

server.listen(PORT, () => {
    logger.info(`🚀 GraphQL Server running on http://localhost:${PORT}/graphql`, {
        operation: "server-start",
        port: PORT
    });
});
