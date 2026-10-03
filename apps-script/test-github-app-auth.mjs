import assert from 'node:assert/strict';
import { createPrivateKey, generateKeyPairSync } from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const SOURCE = fs.readFileSync(new URL('./GitHubAppAuth.gs', import.meta.url), 'utf8');

function b64url(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

function createWorld({ props = {}, status = 201, body } = {}) {
  const calls = [];
  const privateKey = props.GITHUB_APP_PRIVATE_KEY;
  const context = {
    JSON,
    Date,
    encodeURIComponent,
    ascScriptProperty_(name) {
      const value = props[name];
      return typeof value === 'string' && value.length > 0 ? value : null;
    },
    Utilities: {
      Charset: { UTF_8: 'UTF_8' },
      base64EncodeWebSafe(value) {
        if (Array.isArray(value)) {
          return b64url(Buffer.from(value.map(v => v & 0xff)));
        }
        return b64url(value);
      },
      computeRsaSha256Signature(value, key, charset) {
        assert.equal(key, privateKey);
        assert.equal(charset, 'UTF_8');
        assert.equal(typeof value, 'string');
        return [1, 2, 3, 4];
      }
    },
    UrlFetchApp: {
      fetch(url, options) {
        calls.push({ url, options: JSON.parse(JSON.stringify(options)) });
        return {
          getResponseCode() { return status; },
          getContentText() {
            return body === undefined
              ? JSON.stringify({
                  token: 'ghs_TEST_INSTALLATION_TOKEN',
                  expires_at: '2026-10-03T11:00:00Z'
                })
              : body;
          }
        };
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(SOURCE, context, { filename: 'GitHubAppAuth.gs' });
  return { context, calls };
}

{
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  });
  const conversionContext = {
    JSON,
    Date,
    encodeURIComponent,
    ascScriptProperty_() { return null; },
    Utilities: {
      Charset: { UTF_8: 'UTF_8' },
      base64Decode(value) {
        return Array.from(Buffer.from(String(value), 'base64'), b => b > 127 ? b - 256 : b);
      },
      base64Encode(value) {
        return Buffer.from(Array.from(value, b => b & 0xff)).toString('base64');
      },
      base64EncodeWebSafe(value) { return b64url(value); },
      computeRsaSha256Signature() { throw new Error('not used'); }
    },
    UrlFetchApp: { fetch() { throw new Error('not used'); } }
  };
  vm.createContext(conversionContext);
  vm.runInContext(SOURCE, conversionContext, { filename: 'GitHubAppAuth.gs' });
  const converted = conversionContext.ascPkcs1PemToPkcs8Pem_(privateKey);
  assert.match(converted, /^-----BEGIN PRIVATE KEY-----/);
  assert.doesNotMatch(converted, /BEGIN RSA PRIVATE KEY/);
  const parsed = createPrivateKey(converted);
  assert.equal(parsed.asymmetricKeyType, 'rsa');
}

const props = {
  GITHUB_APP_CLIENT_ID: 'Iv1.testclient',
  GITHUB_APP_INSTALLATION_ID: '12345678',
  GITHUB_APP_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----'
};

{
  const identityOnly = {
    GITHUB_APP_CLIENT_ID: props.GITHUB_APP_CLIENT_ID,
    GITHUB_APP_PRIVATE_KEY: props.GITHUB_APP_PRIVATE_KEY
  };
  const w = createWorld({ props: identityOnly });
  assert.equal(w.context.ascGitHubAppIdentityConfigured_(), true);
  assert.equal(w.context.ascGitHubAppConfigured_(), false);
  const identity = w.context.ascGitHubAppIdentityConfig_();
  assert.equal(identity.ok, true);
  assert.equal(identity.clientId, props.GITHUB_APP_CLIENT_ID);
  assert.equal(identity.privateKey, props.GITHUB_APP_PRIVATE_KEY);
}

{
  const w = createWorld({ props });
  assert.equal(w.context.ascGitHubAppConfigured_(), true);
  const config = w.context.ascGitHubAppConfig_();
  assert.equal(config.ok, true);
  const jwt = w.context.ascGitHubAppJwt_(config, Date.parse('2026-10-03T10:00:00Z'));
  const parts = jwt.split('.');
  assert.equal(parts.length, 3);
  const decode = value => JSON.parse(Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  assert.deepStrictEqual(decode(parts[0]), { alg: 'RS256', typ: 'JWT' });
  const payload = decode(parts[1]);
  assert.equal(payload.iss, 'Iv1.testclient');
  assert.equal(payload.iat, 1791021540);
  assert.equal(payload.exp, 1791022140);
}

{
  const w = createWorld({ props });
  const result = w.context.ascGitHubAppInstallationToken_();
  assert.equal(result.ok, true);
  assert.equal(result.token, 'ghs_TEST_INSTALLATION_TOKEN');
  assert.equal(result.expiresAt, '2026-10-03T11:00:00Z');
  assert.equal(w.calls.length, 1);
  const call = w.calls[0];
  assert.equal(call.url, 'https://api.github.com/app/installations/12345678/access_tokens');
  assert.equal(call.options.method, 'post');
  assert.equal(call.options.followRedirects, false);
  assert.equal(call.options.muteHttpExceptions, true);
  assert.equal(call.options.headers.Accept, 'application/vnd.github+json');
  assert.match(call.options.headers.Authorization, /^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.deepStrictEqual(JSON.parse(call.options.payload), { permissions: { contents: 'write' } });
  assert.equal(JSON.stringify(call).includes(props.GITHUB_APP_PRIVATE_KEY), false);
}

{
  const w = createWorld({ props: {} });
  const result = w.context.ascGitHubAppInstallationToken_();
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'GITHUB_APP_CONFIG_MISSING');
  assert.equal(w.calls.length, 0);
}

{
  const w = createWorld({ props, status: 401, body: JSON.stringify({ message: 'Bad credentials' }) });
  const result = w.context.ascGitHubAppInstallationToken_();
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'GITHUB_APP_TOKEN_REQUEST_FAILED');
  assert.equal(result.error.status, 401);
  assert.equal(JSON.stringify(result).includes(props.GITHUB_APP_PRIVATE_KEY), false);
}

{
  const w = createWorld({ props, body: '{bad' });
  const result = w.context.ascGitHubAppInstallationToken_();
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'GITHUB_APP_TOKEN_RESPONSE_MALFORMED');
}

assert.doesNotMatch(SOURCE, /console\.log|Logger\.log/);
assert.doesNotMatch(SOURCE, /GITHUB_TOKEN/);

console.log('T-016 Apps Script GitHub App installation auth: PASS');
console.log('RS256 JWT + installation token exchange + secret boundary: PASS');
