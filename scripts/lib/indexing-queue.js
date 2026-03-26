/**
 * Node scripts (blog:generate, en:indexing:queue) load this file via plain `node`.
 * Implementation lives in `src/lib/indexing-queue.ts`; tsx compiles on the fly.
 */
require("tsx/cjs/register");
module.exports = require("../../src/lib/indexing-queue.ts");
