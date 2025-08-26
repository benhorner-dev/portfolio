# Pull Request Template

PR Title Convention (must match conventional commit format):
type: description

See examples:

- feat: add new user endpoints
- fix: resolve session timeout issue
- docs: update deployment steps
- BREAKING CHANGE: migrate to PostgreSQL 14

## Change Type

- [ ] feat: A new feature
- [ ] fix: A bug fix
- [ ] docs: Documentation only changes
- [ ] style: Changes that do not affect the meaning of the code
- [ ] refactor: A code change that neither fixes a bug nor adds a feature
- [ ] perf: A code change that improves performance
- [ ] test: Adding missing tests or correcting existing tests
- [ ] chore: Changes to the build process or auxiliary tools
- [ ] BREAKING CHANGE: Change that breaks backwards compatibility

## Semantic Version Impact

- [ ] Major (Breaking Changes) - vX+1.0.0
- [ ] Minor (New Features) - vX.Y+1.0
- [ ] Patch (Bug Fixes) - vX.Y.Z+1

## Description

Fixes # (issue)

### Technical Implementation

### Breaking Changes

## Testing

### Automated Tests

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated

### Manual Testing

- [ ] Local development environment
- [ ] Staging environment
- [ ] Production simulation

## Deployment Impact

## Documentation

- [ ] README updates
- [ ] Architecture diagrams
- [ ] Deployment guides
- [ ] Database schema changes
- [ ] Configuration changes

## Quality Checklist

- [ ] PR title follows conventional commit format
- [ ] Code follows project style guidelines
- [ ] Tests cover happy path and edge cases
- [ ] No new linting errors or warnings
- [ ] Branch is up to date with target branch
- [ ] PR size is reasonable (< 500 lines excluding tests)
- [ ] No sensitive information included
- [ ] Performance impact assessed
- [ ] Security implications reviewed

## Screenshots/Videos

## Additional Notes

## Reviewer Notes

## Coverage Exclusions
