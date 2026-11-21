# Cloudflare deployment

The Cloudflare Worker is a read-only mirror of Open Research Commons. It serves the complete browsing interface and proxies public catalog records and public file requests to the primary OpenAI Sites deployment. Submission, account, sign-in, and moderation links take visitors to the primary website. Both deployments use the same repository. The Cloudflare mirror does not need its own D1 database, R2 bucket, or secrets.

The primary site controls access to all real records and attachments. The mirror makes anonymous requests and does not transmit caller credentials or identity headers. If the primary site's audience is private, the mirror shows the illustrative catalog. Real records and downloads become visible to unauthenticated visitors once the primary site permits public access.

## Build and deploy

Install project dependencies with `pnpm install --frozen-lockfile`. The command `pnpm build:cloudflare` builds `dist/cloudflare/index.js`. Run `pnpm dlx wrangler deploy` from this repository using an authenticated Cloudflare account, or select the GitHub repository in Cloudflare Workers Builds.

For Workers Builds, use the repository root and the following settings.

| Setting | Value |
| --- | --- |
| Worker name | `open-research-commons` |
| Build command | `pnpm build:cloudflare` |
| Deploy command | `pnpm dlx wrangler deploy` |

For the canonical deployment and its backend configuration, see [Repository configuration](BACKEND.md).
