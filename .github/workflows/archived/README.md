# Archived workflows

These four workflows are kept for reference only — they are **not active**. GitHub/Gitea Actions
only scans files directly inside `.github/workflows/`, not subfolders, so nothing in here runs.

They originated as Gitea Actions CI/CD templates for a different, self-hosted project (Cloud
Foundry deploys, an internal Nexus registry, SonarQube, self-hosted runners). They were anonymized
(company-specific hostnames/orgs/emails replaced with `vars`/`secrets` placeholders — see each
file's header comment) but not adapted to `sk-movies-fe`, which deploys via
[deploy.yml](../deploy.yml) to GitHub Pages instead.

- `deploy-dev.yml` / `deploy-test.yml` — build + deploy to a Cloud Foundry dev/test environment
- `mirroring.yml` — mirrors pushes on `main`/`rc/**`/`release/**`/`hotfix/**` to a Bitbucket repo
- `release.yml` — manual version-bump workflow (patch/minor/major/custom) via `./semver.sh`, pushed
  back over SSH

If this project ever needs equivalents of any of these (e.g. a real release/versioning flow), treat
these as a starting point to adapt rather than something to re-enable as-is.
