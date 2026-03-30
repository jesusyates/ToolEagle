#!/usr/bin/env npx tsx
import { writeSystemMapJson } from "../src/lib/seo/system-map";

writeSystemMapJson(process.cwd());
console.log("[write-system-map] generated/system-map.json");
