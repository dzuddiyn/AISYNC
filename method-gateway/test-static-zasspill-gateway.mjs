import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(
  new URL('../docs/method/zasspill/my/index.html', import.meta.url),
  'utf8'
);

assert.match(html, /<meta name="aisync-method" content="ZASSPILL">/);
assert.match(html, /<meta name="aisync-version" content="1\.0\.0">/);
assert.match(
  html,
  /<meta name="aisync-source-commit" content="9a6755ea4dc2f9a067343855331078d9a1773a0c">/
);
assert.match(html, /\*\*Version:\*\* 1\.0\.0/);
assert.match(html, /METHOD \/ PROTOCOL CONTRACT PRODUCTION READY/);
assert.match(html, /20\.2 Unknown Write Outcome/);
assert.doesNotMatch(html, /content="0\.1\.0"/);
assert.doesNotMatch(html, /38760ddbc194ea530730bb615be2553cc38f267b/);

console.log('T-017 ZASSPILL static Method Gateway freshness regression: PASS');
