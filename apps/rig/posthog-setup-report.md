# PostHog post-wizard report

The wizard has completed a deep integration of your project. PostHog was initialized via `instrumentation-client.ts` (Next.js 15.3+ client instrumentation), and five key user interactions are now tracked across the Rig desktop app. Environment variables are stored in `.env.local`. Because this is a Tauri static export, the integration uses the direct PostHog ingestion host rather than a reverse proxy.

| Event | Description | File |
|---|---|---|
| `skill_selected` | User selects a skill from the sidebar list | `src/features/skills/components/SkillList.tsx` |
| `repository_imported` | User imports a local folder as a skill repository | `src/features/skills/useImportSkillRoot.ts` |
| `repository_selected` | User switches to a different skill repository | `src/features/skills/components/RepositorySelector.tsx` |
| `view_switched` | User switches between Skills and Dashboard views | `src/app/root.tsx` |
| `update_installed` | User clicks to install an available app update | `src/features/update/components/AppUpdateDialog.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/473251/dashboard/1720744)
- [Skill selections over time (wizard)](https://us.posthog.com/project/473251/insights/GTb2OUpe)
- [Repository imports (wizard)](https://us.posthog.com/project/473251/insights/CtlGuQ2z)
- [View switching breakdown (wizard)](https://us.posthog.com/project/473251/insights/4SPWlt2u)
- [Update installs (wizard)](https://us.posthog.com/project/473251/insights/H991MRdB)
- [Weekly active skill users (wizard)](https://us.posthog.com/project/473251/insights/dhYdEV8D)

## Verify before merging

- [ ] Run `pnpm install` from the monorepo root (`/path/to/allin`) to install `posthog-js`, then run a full production build and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.release.example` (and any other bootstrap example files) so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
