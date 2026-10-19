https://github.com/neo4j-graph-examples/recommendations
https://github.com/iftahro/Neo4NBA/tree/master

## Edge caching / CDN

Static build output is served from the edge, not a single origin: Vercel replicates it across
its global edge network, and GitHub Pages does the same via its own CDN (the second deploy
target this app builds for).

Where to verify in code/config:
- `vercel.json` — `headers` rule gives content-hashed `_app/immutable/*` assets a 1-year
  immutable cache (`Cache-Control: public, max-age=31536000, immutable`); the HTML shell stays
  `must-revalidate` since it's what points at the current hashed filenames.
- `svelte.config.js` — `adapter-static` output is what both Vercel and GitHub Pages serve.

To verify live: `curl -sI https://sk-movies-fe.vercel.app/` — the `X-Vercel-Id` response header
(e.g. `fra1::...`) shows which edge region actually answered the request.
