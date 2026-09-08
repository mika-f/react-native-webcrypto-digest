import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'react-native') return {
      url: 'data:text/javascript,export const NativeModules = globalThis.__nativeModules;',
      shortCircuit: true,
    };
    return next(specifier, context);
  },
});
const native = {
  async digest(algorithm, bytes) {
    return [...createHash(algorithm.replace('-', '').toLowerCase()).update(Buffer.from(bytes)).digest()];
  },
};
globalThis.__nativeModules = { RNWebCryptoDigest: native };
const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
let revision = 0;
async function install(crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: crypto, configurable: true, writable: true });
  await import(`../dist/index.js?test=${revision++}`);
  return globalThis.crypto;
}

test('digest polyfill contract', async t => {
  try {
    const crypto = await install(undefined);
    await t.test('all algorithms, algorithm objects, and exact input views', async () => {
      const storage = new Uint8Array([255, 97, 98, 99, 254]);
      const inputs = [new Uint8Array(), new Uint8Array([97, 98, 99]).buffer,
        storage.subarray(1, 4), new DataView(storage.buffer, 1, 3), new Uint16Array([1, 65535])];
      for (const algorithm of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
        for (const input of inputs) {
          const bytes = input instanceof ArrayBuffer ? new Uint8Array(input)
            : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
          const expected = createHash(algorithm.replace('-', '').toLowerCase()).update(bytes).digest('hex');
          for (const name of [algorithm, { name: algorithm.toLowerCase() }]) {
            const pending = crypto.subtle.digest(name, input);
            assert.ok(pending instanceof Promise);
            const result = await pending;
            assert.ok(result instanceof ArrayBuffer);
            assert.equal(Buffer.from(result).toString('hex'), expected);
          }
        }
      }
    });
    await t.test('rejects invalid inputs and unsupported algorithms', async () => {
      for (const input of [null, {}, [], 'abc', 42, new SharedArrayBuffer(2)]) {
        await assert.rejects(crypto.subtle.digest('SHA-256', input), TypeError);
      }
      await assert.rejects(crypto.subtle.digest({}, new Uint8Array()), TypeError);
      await assert.rejects(crypto.subtle.digest('MD5', new Uint8Array()), { name: 'NotSupportedError' });
      const dom = globalThis.DOMException;
      try {
        globalThis.DOMException = undefined;
        await assert.rejects(crypto.subtle.digest('MD5', new Uint8Array()), { name: 'NotSupportedError' });
      } finally { globalThis.DOMException = dom; }
    });
    await t.test('snapshots inputs and propagates native failure', async () => {
      const input = new Uint8Array([97, 98, 99]);
      const pending = crypto.subtle.digest('SHA-256', input);
      input.fill(0);
      assert.equal(Buffer.from(await pending).toString('hex'), createHash('sha256').update('abc').digest('hex'));
      const error = new Error('native failure');
      globalThis.__nativeModules.RNWebCryptoDigest = { digest: async () => { throw error; } };
      await assert.rejects(crypto.subtle.digest('SHA-1', input), e => e === error);
      delete globalThis.__nativeModules.RNWebCryptoDigest;
      await assert.rejects(crypto.subtle.digest('SHA-1', input), /not linked/);
      globalThis.__nativeModules.RNWebCryptoDigest = native;
    });
    await t.test('preserves existing objects and implementation; repeat import is safe', async () => {
      const getRandomValues = () => {};
      const subtle = { encrypt() {} };
      const existing = { getRandomValues, subtle };
      assert.equal(await install(existing), existing);
      assert.equal(existing.subtle, subtle);
      assert.equal(existing.getRandomValues, getRandomValues);
      const digest = subtle.digest;
      await install(existing);
      assert.equal(subtle.digest, digest);
      const nativeDigest = () => Promise.resolve(new ArrayBuffer(0));
      const frozen = Object.freeze({ subtle: Object.freeze({ digest: nativeDigest }) });
      await install(frozen);
      assert.equal(globalThis.crypto.subtle.digest, nativeDigest);
    });
  } finally {
    if (original) Object.defineProperty(globalThis, 'crypto', original);
    else delete globalThis.crypto;
  }
});
