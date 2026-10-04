import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';

const syncSource = fs.readFileSync(new URL('./sync/RegistrySync.gs', import.meta.url), 'utf8');
const gatewaySource = fs.readFileSync(new URL('./public/Gateway.gs', import.meta.url), 'utf8');

function makeUtilities() {
  return {
    newBlob(value) {
      const bytes = Buffer.isBuffer(value)
        ? Buffer.from(value)
        : Array.isArray(value)
          ? Buffer.from(value.map(v => v & 0xff))
          : Buffer.from(String(value), 'utf8');
      return {
        getBytes() {
          return Array.from(bytes, b => b > 127 ? b - 256 : b);
        },
        getDataAsString() {
          return bytes.toString('utf8');
        }
      };
    },
    gzip(blob) {
      const input = Buffer.from(blob.getBytes().map(v => v & 0xff));
      const out = zlib.gzipSync(input);
      return {
        getBytes() {
          return Array.from(out, b => b > 127 ? b - 256 : b);
        }
      };
    },
    ungzip(blob) {
      const input = Buffer.from(blob.getBytes().map(v => v & 0xff));
      const out = zlib.gunzipSync(input);
      return {
        getDataAsString() {
          return out.toString('utf8');
        }
      };
    },
    base64Encode(values) {
      return Buffer.from(values.map(v => v & 0xff)).toString('base64');
    },
    base64Decode(value) {
      return Array.from(Buffer.from(String(value), 'base64'), b => b > 127 ? b - 256 : b);
    }
  };
}

const syncContext = {
  Object,
  String,
  Date,
  JSON,
  encodeURIComponent,
  Utilities: makeUtilities(),
  SpreadsheetApp: {},
  PropertiesService: {},
  UrlFetchApp: {},
  ScriptApp: {}
};
vm.createContext(syncContext);
vm.runInContext(syncSource, syncContext, { filename: 'RegistrySync.gs' });

const gatewayContext = {
  Object,
  String,
  JSON,
  Utilities: makeUtilities(),
  SpreadsheetApp: {},
  ContentService: {}
};
vm.createContext(gatewayContext);
vm.runInContext(gatewaySource, gatewayContext, { filename: 'Gateway.gs' });

const shortText = '# Short\nhello';
assert.equal(syncContext.encodeMethodSnapshotContent_(shortText), shortText);
assert.equal(gatewayContext.decodeMethodSnapshotContent_(shortText), shortText);

const longText = [
  '# ZASSPILL synthetic long method',
  '',
  ...Array.from({ length: 2400 }, (_, i) =>
    'Section ' + (i % 37) + ': continuity retrieval packet handoff revision authority privacy lineage.'
  )
].join('\n');
assert.ok(longText.length > 50000);

const encoded = syncContext.encodeMethodSnapshotContent_(longText);
assert.match(encoded, /^gzip\+base64:/);
assert.ok(encoded.length < 49000, 'compressed snapshot must fit safely inside one Sheets cell');
assert.equal(gatewayContext.decodeMethodSnapshotContent_(encoded), longText);

assert.match(syncSource, /encodeMethodSnapshotContent_\(snapshot\.content\)/);
assert.match(syncSource, /rowRange\.setNumberFormat\('@'\)/);
assert.match(gatewaySource, /content: decodeMethodSnapshotContent_\(rows\[i\]\[8\]\)/);

console.log('T-017 method snapshot gzip+base64 compatibility: PASS');
console.log('large content -> one METHODS content cell -> exact decode: PASS');
