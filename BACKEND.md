# Repository configuration

The Worker reads the ANZSRC Fields of Research code and official English label map supplied by the site bundle. Published repository records and submission states are stored in D1. R2 keeps original uploaded files. Apply the [initial migration](drizzle/0000_repository.sql) to each new database before serving requests.

| Host setting | Purpose |
| --- | --- |
| D1 binding DB | Drafts, moderation state, publication records and file ownership |
| R2 binding BUCKET | Original uploaded files |
| MODERATOR_EMAILS | Comma-separated ChatGPT account email addresses with authority to review, approve, or withdraw records |
| DATACITE_USERNAME | Production DataCite repository account ID |
| DATACITE_PASSWORD | Production DataCite repository password or supported repository API credential |
| DATACITE_PREFIX | DOI prefix assigned to that account |
| DATACITE_PUBLISHER | Repository or institution responsible for publishing deposits |
| SITE_PUBLIC_URL | Canonical public HTTPS origin used for permanent DOI landing pages |
| DATACITE_CONTACT_EMAIL | Optional operator contact included in DataCite request identification |

Configure production values in the hosting platform. Store credentials as secrets. The Worker reads authenticated identity from Sites dispatch headers. The identity provider must own and sanitize those headers at the ingress boundary. A local preview has no authenticated sessions without a trusted ingress integration.

Approval requires a DOI. Existing DOIs are checked against DataCite or Crossref for a matching title and resource type. The publisher of an existing DOI retains control of its resolver destination. New DOIs are registered through production DataCite after approval. Registration requires the configured landing page to be accessible without sign-in. An interrupted registration keeps the reserved identifier so the moderator can retry from the same submission.

The dashboard exposes draft and moderation status, including correction notes. Files are private before publication. Public file access follows the deposit's open, embargoed, or external availability. A withdrawal preserves the DOI and its descriptive landing page while ending public file access. The upload limit is 20 MiB per file.

Supporting documentation is available from [DataCite](https://support.datacite.org/docs/api-create-dois), [Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/), and [Cloudflare](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).
