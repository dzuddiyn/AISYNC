var ASC_GITHUB_APP_API_ROOT_ = 'https://api.github.com';
var ASC_GITHUB_APP_API_VERSION_ = '2022-11-28';

function ascBase64UrlNoPad_(value) {
  return Utilities.base64EncodeWebSafe(value, Utilities.Charset.UTF_8).replace(/=+$/g, '');
}

function ascBase64UrlBytesNoPad_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function ascGitHubAppIdentityConfig_() {
  var clientId = ascScriptProperty_('GITHUB_APP_CLIENT_ID');
  var privateKey = ascScriptProperty_('GITHUB_APP_PRIVATE_KEY');
  if (!clientId || !privateKey || privateKey.indexOf('PRIVATE KEY') < 0) {
    return {
      ok: false,
      error: {
        code: 'GITHUB_APP_IDENTITY_CONFIG_MISSING',
        message: 'GitHub App client ID and private key must be configured server-side.'
      }
    };
  }
  return {
    ok: true,
    clientId: clientId,
    privateKey: privateKey
  };
}

function ascGitHubAppConfig_() {
  var identity = ascGitHubAppIdentityConfig_();
  if (!identity.ok) {
    return {
      ok: false,
      error: {
        code: 'GITHUB_APP_CONFIG_MISSING',
        message: 'GitHub App client ID, installation ID, and private key must be configured server-side.'
      }
    };
  }

  var installationId = ascScriptProperty_('GITHUB_APP_INSTALLATION_ID');
  if (!installationId || !/^\d+$/.test(installationId)) {
    return {
      ok: false,
      error: {
        code: 'GITHUB_APP_CONFIG_MISSING',
        message: 'GitHub App client ID, installation ID, and private key must be configured server-side.'
      }
    };
  }

  return {
    ok: true,
    clientId: identity.clientId,
    installationId: installationId,
    privateKey: identity.privateKey
  };
}

function ascGitHubAppIdentityConfigured_() {
  return ascGitHubAppIdentityConfig_().ok === true;
}

function ascGitHubAppConfigured_() {
  return ascGitHubAppConfig_().ok === true;
}

function ascDerLength_(length) {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error('INVALID_DER_LENGTH');
  }
  if (length < 128) return [length];
  var bytes = [];
  var value = length;
  while (value > 0) {
    bytes.unshift(value & 255);
    value = Math.floor(value / 256);
  }
  return [128 | bytes.length].concat(bytes);
}

function ascPkcs1PemToPkcs8Pem_(pem) {
  if (typeof pem !== 'string' || pem.indexOf('-----BEGIN RSA PRIVATE KEY-----') !== 0) {
    return pem;
  }

  var body = pem
    .replace('-----BEGIN RSA PRIVATE KEY-----', '')
    .replace('-----END RSA PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  var pkcs1 = Utilities.base64Decode(body);

  // PrivateKeyInfo ::= SEQUENCE {
  //   version                   INTEGER 0,
  //   privateKeyAlgorithm       AlgorithmIdentifier(rsaEncryption),
  //   privateKey                OCTET STRING(PKCS#1 RSAPrivateKey)
  // }
  var version = [0x02, 0x01, 0x00];
  var rsaAlgorithmIdentifier = [
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00
  ];
  var privateKeyOctets = [0x04].concat(ascDerLength_(pkcs1.length), pkcs1.map(function (b) {
    return b < 0 ? b + 256 : b;
  }));
  var inner = version.concat(rsaAlgorithmIdentifier, privateKeyOctets);
  var der = [0x30].concat(ascDerLength_(inner.length), inner);
  var base64 = Utilities.base64Encode(der.map(function (b) { return b > 127 ? b - 256 : b; }))
    .replace(/(.{64})/g, '$1\n')
    .replace(/\n$/, '');

  return '-----BEGIN PRIVATE KEY-----\n' +
    base64 +
    '\n-----END PRIVATE KEY-----\n';
}

function ascNormalizeGitHubAppPrivateKey_(pem) {
  if (typeof pem !== 'string') throw new Error('GITHUB_APP_PRIVATE_KEY_INVALID');
  if (pem.indexOf('-----BEGIN PRIVATE KEY-----') === 0) return pem;
  if (pem.indexOf('-----BEGIN RSA PRIVATE KEY-----') === 0) {
    return ascPkcs1PemToPkcs8Pem_(pem);
  }
  throw new Error('GITHUB_APP_PRIVATE_KEY_UNSUPPORTED_FORMAT');
}

function ascGitHubAppJwt_(config, nowMs) {
  var nowSeconds = Math.floor((typeof nowMs === 'number' ? nowMs : Date.now()) / 1000);
  var header = ascBase64UrlNoPad_(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  var payload = ascBase64UrlNoPad_(JSON.stringify({
    iat: nowSeconds - 60,
    exp: nowSeconds + 540,
    iss: config.clientId
  }));
  var signingInput = header + '.' + payload;
  var signature = Utilities.computeRsaSha256Signature(
    signingInput,
    ascNormalizeGitHubAppPrivateKey_(config.privateKey),
    Utilities.Charset.UTF_8
  );
  return signingInput + '.' + ascBase64UrlBytesNoPad_(signature);
}

function ascGitHubAppInstallationToken_() {
  var config = ascGitHubAppConfig_();
  if (!config.ok) {
    return config;
  }

  var jwt;
  try {
    jwt = ascGitHubAppJwt_(config);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GITHUB_APP_JWT_FAILED',
        message: 'GitHub App JWT could not be generated.'
      }
    };
  }

  var response;
  try {
    response = UrlFetchApp.fetch(
      ASC_GITHUB_APP_API_ROOT_ + '/app/installations/' +
        encodeURIComponent(config.installationId) + '/access_tokens',
      {
        method: 'post',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': ASC_GITHUB_APP_API_VERSION_,
          Authorization: 'Bearer ' + jwt
        },
        contentType: 'application/json',
        payload: JSON.stringify({ permissions: { contents: 'write' } }),
        muteHttpExceptions: true,
        followRedirects: false
      }
    );
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GITHUB_APP_TOKEN_FETCH_ERROR',
        message: 'GitHub App installation token request could not be completed.'
      }
    };
  }

  var status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    return {
      ok: false,
      error: {
        code: 'GITHUB_APP_TOKEN_REQUEST_FAILED',
        message: 'GitHub App installation token request failed.',
        status: status
      }
    };
  }

  var data;
  try {
    data = JSON.parse(response.getContentText());
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'GITHUB_APP_TOKEN_RESPONSE_MALFORMED',
        message: 'GitHub App installation token response was malformed.'
      }
    };
  }

  if (!data || typeof data.token !== 'string' || data.token.length === 0 ||
      typeof data.expires_at !== 'string') {
    return {
      ok: false,
      error: {
        code: 'GITHUB_APP_TOKEN_RESPONSE_INVALID',
        message: 'GitHub App installation token response lacked required fields.'
      }
    };
  }

  return {
    ok: true,
    token: data.token,
    expiresAt: data.expires_at
  };
}

function ascCreateGitHubAppRestClient_() {
  var client = null;
  var configFailure = null;

  function resolveClient_() {
    if (client) {
      return { ok: true, client: client };
    }
    if (configFailure) {
      return { ok: false, error: configFailure };
    }

    var tokenResult = ascGitHubAppInstallationToken_();
    if (!tokenResult.ok) {
      configFailure = tokenResult.error || {
        code: 'GITHUB_APP_TOKEN_UNAVAILABLE',
        message: 'GitHub App installation token is unavailable.'
      };
      return { ok: false, error: configFailure };
    }

    client = ascRuntime_().githubRest.createGitHubRestClient({
      token: tokenResult.token,
      fetchImpl: ascUrlFetchImpl_
    });
    return { ok: true, client: client };
  }

  return {
    readFile: function (input) {
      var resolved = resolveClient_();
      if (!resolved.ok) {
        return Promise.resolve({ ok: false, error: resolved.error });
      }
      return resolved.client.readFile(input);
    },
    writeFile: function (input) {
      var resolved = resolveClient_();
      if (!resolved.ok) {
        return Promise.resolve({ ok: false, error: resolved.error });
      }
      return resolved.client.writeFile(input);
    }
  };
}
