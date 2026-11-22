import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('./client/package.json', import.meta.url));
const ts = require('typescript');
const config = readFileSync(new URL('./shared/apiConfig.ts', import.meta.url), 'utf8');
const source = readFileSync(new URL('./shared/api.ts', import.meta.url), 'utf8').replace("import { API_BASE_URL } from './apiConfig';", config);
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { apiRequest, checkServer } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const realFetch = globalThis.fetch;
try {
  let calls = 0;
  globalThis.fetch = async (url, options) => { calls++; assert.equal(url, 'https://api.nbyme.com/api/orders'); assert.equal(options.headers.Authorization, 'Bearer test-token'); assert.equal(options.timeoutMs, undefined); return new Response('{}'); };
  await apiRequest('/api/orders', { headers: { Authorization: 'Bearer test-token' }, timeoutMs: 20000 });
  await assert.rejects(apiRequest('//unrelated.example'), /server-relative/); assert.equal(calls, 1);
  globalThis.fetch = async () => new Response('<html>Blocked</html>', {status:403});
  await assert.rejects(apiRequest('/api/orders'), /Server request failed \(403\)/);
  globalThis.fetch = async () => new Response(JSON.stringify({message:'Not approved'}), {status:403});
  await assert.rejects(apiRequest('/api/orders'), /Not approved/);
  globalThis.fetch = async (url, options) => new Promise((resolve,reject) => { const aborted=()=>reject(new Error('aborted')); if(options.signal.aborted) aborted(); else options.signal.addEventListener('abort',aborted,{once:true}); });
  await assert.rejects(apiRequest('/api/orders',{timeoutMs:5}), /aborted/);
  const c = new AbortController(); const request = apiRequest('/api/orders',{signal:c.signal}); c.abort(); await assert.rejects(request,/aborted/);
  globalThis.fetch = async url => { assert.equal(url,'https://api.nbyme.com/'); return new Response('Server is Live!'); };
  await checkServer();
  console.log('Shared API checks passed: new host, headers, path guard, server errors, timeout, cancellation and health check.');
} finally { globalThis.fetch = realFetch; }
