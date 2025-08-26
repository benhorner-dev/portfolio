# Tag

This action will run semantic release, tagging and publishing a github
release for any changes following [conventional commits](conventionalcommits.org)

## Setup

This action requires no input or environment variables

Make sure that you have an `.releaserc.json` in your project root as below.

You can omit the release/uat configuration if there is only a master branch.

```json
{
  "branches": [
    "master",
    {
      "name": "release/uat",
      "prerelease": "uat"
    }
  ],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/git",
    "@semantic-release/github",
    [
      "@semantic-release/exec",
      {
        "successCmd": "echo '${nextRelease.gitTag}' > version.txt"
      }
    ]
  ]
}
```

## Inputs

- checkout: (true/false). Defaults to true. Can set to false to disable checking
  out the project, in case it's already checked out.
- node_version: (number) Defaults to 18. Can specify the node version to run. If you
  set this to a blank string it'll skip installing node, in case it's already
  setup.

## Outputs

This action has the below outputs:

- version - The version released, including the 'v' prefix. E.g. 'v1.0.0-uat1'
  Also sets the VERSION environment variable, and creates a version.txt file
  in the application root

## Example

```yaml
  - name: Tag semantic release
    id: tag
    uses: benhorner/actions/tag@v1
    with:
      checkout: true
      node_version: 18
```
