# GitHub Workflows

This directory contains GitHub Actions workflows for automating various tasks in the Shipkit repository.

## Run Codex Workflow

The `run-codex` workflow allows you to use AI to automatically fix issues, update documentation, or make other improvements to the codebase.

### How to Use

1. Go to the GitHub Actions tab and select the "Run Codex" workflow
2. Click "Run workflow"
3. Enter a prompt that describes what you want the AI to do
4. Select an approval mode:
   - `suggest`: The AI will suggest changes but not make them
   - `auto-edit`: The AI will make changes that are safe and suggest others
   - `full-auto`: The AI will make all changes it thinks are necessary

### Example Prompts

A collection of example prompts is available in the [run-codex-prompts.yml](run-codex-prompts.yml) file. These prompts are organized by category:

- Maintenance tasks
- Bug fixes
- Performance improvements
- Feature implementation
- Security enhancements
- Documentation updates

### Referencing Issues

You can reference GitHub issues in your prompts to have the AI fix specific issues:

```
fix issue #123 regarding authentication errors
```

### Custom Prompts

When creating custom prompts, be specific about what you want the AI to do. Some tips:

- Specify file paths when relevant: `update the docs/deployment.mdx file with Vercel deployment instructions`
- Mention technologies when appropriate: `fix React key warnings in the components directory`
- Give context about the problem: `fix the authentication flow to handle expired tokens properly`

### Automated Issue Fixing

You can set up automatic triggers for the Run Codex workflow by creating issues with specific labels or comments. This requires additional configuration in the workflow file.
