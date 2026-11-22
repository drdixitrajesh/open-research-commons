# Open Research Commons

A multilingual repository for academic events, the materials they produce, and postgraduate research. Use the site to search published metadata by title, contributor, subject, country, international dialing code, language, or DOI. New submissions go through review. Every published record requires a verified or newly registered DOI.

## Run and build

Use Node.js 22 or later and pnpm.

- `pnpm install`
- `pnpm preview` to browse the interface and clearly marked examples on localhost. The static preview has no sign-in, submission, or upload service.
- `pnpm build` to generate `dist/server/index.js`, a Cloudflare Worker bundle ready for Sites packaging.

The hosted application uses Sites sign-in, D1, and R2. [Backend configuration](BACKEND.md) covers migrations, moderator access, and real DOI registration. The catalog is empty until approved records are published. Illustrative records have no registered DOIs.

[Cloudflare deployment](README-CLOUDFLARE.md) describes the public catalog mirror and its shared records and contributor workflows.

## Data and media

- [ANZSRC source and license](dist/data/subjects-license.txt). The official English classification is complete. Platform-provided subject translations cover all divisions and selected groups and fields. Other subject labels use the official English text.
- [Country and dialing-code data sources](dist/data/countries-license.txt). Country names display in the selected interface language when supported by the browser. Shared calling codes can match multiple ISO regions.
- The events directory links to official organizer notices. The daily [refresh workflow](.github/workflows/refresh-event-directory.yml) imports Stanford and MIT calendar data and RSS from the University of Central Florida and Max Planck Institute for Solar System Research. The Sources list provides CERN's public calendars as references while the organizer’s crawler guidance restricts the export path. The snapshot retains 30 days of previously listed events from active feeds. Run `node scripts/refresh-event-directory.mjs` to refresh it locally. The hosted catalog uses the published snapshot with a bundled fallback. Curated listings are maintained in `dist/data/events-directory.json`. Readers can subscribe from the Events page or at `/events.rss`.
- The decorative photograph `dist/images/field-notes.jpg` was generated with the built-in OpenAI image generator for this website. The brief was an overhead editorial photograph of a scientific field notebook, botanical sketches, and a skeleton leaf, with a cobalt and parchment palette.

Submission changes appear in the account dashboard. Email notifications and language-based assignment of moderator queues are outside this build. New DOI registration needs a public landing URL and the operator's production DataCite account.
