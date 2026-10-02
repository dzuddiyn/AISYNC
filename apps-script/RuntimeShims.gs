// T-008B — minimal Apps Script runtime shims for the bundled Node ES-module sources.
//
// These supply only the encoding globals the sources already use (Buffer base64/utf8,
// atob, TextDecoder) on top of Apps Script `Utilities`, plus a UrlFetchApp-backed
// `fetchImpl` for the existing GitHub REST client. They carry no ASC/GitHub semantics.

const ASC_GITHUB_API_PREFIX_ = 'https://api.github.com/';

function ascToSignedBytes_(bytes) {
  return Array.prototype.map.call(bytes, function (b) {
    const v = b & 0xff;
    return v > 127 ? v - 256 : v;
  });
}

function ascToUnsignedBytes_(bytes) {
  return Array.prototype.map.call(bytes, function (b) { return b & 0xff; });
}

function ascUtf8Bytes_(text) {
  return Utilities.newBlob('').setDataFromString(String(text), 'UTF-8').getBytes();
}

function ascUtf8String_(signedBytes) {
  return Utilities.newBlob(signedBytes).getDataAsString('UTF-8');
}

// Buffer subset used by github-rest-client.mjs:
//   Buffer.from(string, 'utf8').toString('base64')
//   Buffer.from(base64, 'base64').toString('base64' | 'utf8')
function AscBuffer_(signedBytes) {
  this.bytes_ = signedBytes;
}

AscBuffer_.from = function (value, encoding) {
  if (typeof value !== 'string') {
    throw new Error('AscBuffer_.from supports strings only.');
  }
  if (encoding === 'base64') {
    return new AscBuffer_(Utilities.base64Decode(value));
  }
  if (encoding === 'utf8' || encoding === 'utf-8' || encoding === undefined) {
    return new AscBuffer_(ascUtf8Bytes_(value));
  }
  throw new Error('Unsupported encoding.');
};

AscBuffer_.prototype.toString = function (encoding) {
  if (encoding === 'base64') {
    return Utilities.base64Encode(this.bytes_);
  }
  if (encoding === 'utf8' || encoding === 'utf-8' || encoding === undefined) {
    return ascUtf8String_(this.bytes_);
  }
  throw new Error('Unsupported encoding.');
};

function AscTextDecoder_() {}
AscTextDecoder_.prototype.decode = function (bytes) {
  return ascUtf8String_(ascToSignedBytes_(bytes));
};

function AscTextEncoder_() {}
AscTextEncoder_.prototype.encode = function (text) {
  return Uint8Array.from(ascToUnsignedBytes_(ascUtf8Bytes_(text)));
};

function ascAtob_(base64) {
  return String.fromCharCode.apply(null, ascToUnsignedBytes_(Utilities.base64Decode(base64)));
}

function ascBtoa_(binary) {
  const bytes = Array.prototype.map.call(String(binary), function (ch) { return ch.charCodeAt(0); });
  return Utilities.base64Encode(ascToSignedBytes_(bytes));
}

// T-010 — SHA-256 of the UTF-8 encoding of `text`, as lowercase hex. Injected into the
// runtime-neutral envelope security layer; carries no ASC semantics.
function ascSha256Hex_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8);
  return Array.prototype.map.call(bytes, function (b) {
    const v = b & 0xff;
    return (v < 16 ? '0' : '') + v.toString(16);
  }).join('');
}

function ascRuntimeShims_() {
  return {
    Buffer: AscBuffer_,
    atob: ascAtob_,
    btoa: ascBtoa_,
    TextEncoder: AscTextEncoder_,
    TextDecoder: AscTextDecoder_
  };
}

// fetch-compatible subset consumed by createGitHubRestClient({ fetchImpl }).
// Restricted to the GitHub API origin so the bearer token cannot be sent elsewhere.
function ascUrlFetchImpl_(url, init) {
  if (typeof url !== 'string' || url.indexOf(ASC_GITHUB_API_PREFIX_) !== 0) {
    return Promise.reject(new Error('Blocked non-GitHub API URL.'));
  }

  const request = init || {};
  const headers = {};
  Object.keys(request.headers || {}).forEach(function (key) {
    if (key.toLowerCase() !== 'user-agent') {
      headers[key] = request.headers[key];
    }
  });

  const options = {
    method: String(request.method || 'GET').toLowerCase(),
    headers: headers,
    muteHttpExceptions: true,
    followRedirects: false
  };

  if (request.body !== undefined) {
    options.payload = request.body;
    options.contentType = 'application/json';
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    const status = response.getResponseCode();
    const text = response.getContentText();
    return Promise.resolve({
      status: status,
      json: function () {
        return new Promise(function (resolve) { resolve(JSON.parse(text)); });
      }
    });
  } catch (error) {
    return Promise.reject(new Error('UrlFetchApp request failed.'));
  }
}
