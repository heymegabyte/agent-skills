import assert from 'node:assert/strict';

assert.equal(process.env.THEME_TOOLS_PROBE_VERSION, '1.0.1');
console.log(JSON.stringify({ behavior: 'verified', version: '1.0.1' }));
