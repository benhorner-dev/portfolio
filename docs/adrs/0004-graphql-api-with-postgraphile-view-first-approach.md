# 4. GraphQL API with PostGraphile View-First Approach

Date: 2025-09-12

## Status

Superseded by ADR-0006

superceded-by [6. SSA in Next.js Override to Avoid Over-Engineering](0006-ssa-in-next-js-override-to-avoid-over-engineering.md)

## Context

The portfolio requires a robust API layer that can:

- Provide type-safe data access for frontend applications
- Automatically generate GraphQL schema from database schema
- Support real-time subscriptions and queries
- Handle authentication and authorization at the API level
- Scale with complex data relationships

The initial approach was to use PostGraphile for:

- Automatic GraphQL schema generation from PostgreSQL
- Database-first API development
- Built-in authentication and authorization
- Real-time subscriptions
- Type safety through generated types

## Decision

Implement GraphQL API using PostGraphile with a view-first approach:

- **PostGraphile** for automatic GraphQL schema generation
- **Database views** as the primary data access layer
- **PostgreSQL functions** for complex business logic
- **Row Level Security (RLS)** for authorization
- **JWT tokens** for authentication

## Consequences

### Positive

- **Rapid development**: Automatic schema generation from database
- **Type safety**: Generated TypeScript types from database schema
- **Real-time capabilities**: Built-in subscriptions support
- **Security**: Row Level Security provides fine-grained access control
- **Performance**: Database-level optimizations and caching

### Negative

- **Database coupling**: API tightly coupled to database schema
- **Learning curve**: Team needs to understand PostGraphile concepts
- **Complexity**: Database views and functions can become complex
- **Debugging**: GraphQL errors may be harder to trace to database issues
- **Flexibility**: Less control over API design compared to custom resolvers

### Risks

- **Vendor lock-in**: Dependency on PostGraphile for API generation
- **Schema evolution**: Database changes directly impact API
- **Performance**: Complex views may impact database performance
- **Debugging complexity**: Issues span database and GraphQL layers
