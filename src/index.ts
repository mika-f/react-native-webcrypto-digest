import { NativeModules } from 'react-native';

function unsupportedAlgorithm(name: string): Error {
  const message = `Unsupported digest algorithm: ${name}`;
  if (typeof DOMException !== 'undefined') {
    return new DOMException(message, 'NotSupportedError');
  }
  const error = new Error(message);
  error.name = 'NotSupportedError';
  return error;
}

async function digest(
  algorithm: AlgorithmIdentifier,
  data: BufferSource,
): Promise<ArrayBuffer> {
  const name = typeof algorithm === 'string' ? algorithm : algorithm?.name;
  if (typeof name !== 'string') {
    throw new TypeError('The algorithm must be a string or an object with a name.');
  }

  const normalized = name.toUpperCase();
  if (!['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].includes(normalized)) {
    throw unsupportedAlgorithm(name);
  }

  let input: Uint8Array;
  if (data instanceof ArrayBuffer) {
    input = new Uint8Array(data);
  } else if (ArrayBuffer.isView(data) && data.buffer instanceof ArrayBuffer) {
    input = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  } else {
    throw new TypeError('The data must be an ArrayBuffer or an ArrayBuffer view.');
  }

  const native = NativeModules.RNWebCryptoDigest as
    | { digest(algorithm: string, bytes: number[]): Promise<number[]> }
    | undefined;
  if (!native) {
    throw new Error('RNWebCryptoDigest is not linked. Rebuild your native app after installing the package.');
  }
  // Snapshot the view before yielding; no Buffer or TextEncoder polyfill is needed.
  const result = await native.digest(normalized, Array.from(input));
  return Uint8Array.from(result).buffer;
}

function define(target: object, name: string, value: unknown): void {
  Object.defineProperty(target, name, {
    value,
    configurable: true,
    writable: true,
    enumerable: true,
  });
}

// Do not declare a complete Crypto implementation: this package only adds digest.
const root = globalThis as unknown as {
  crypto?: { subtle?: { digest?: unknown } };
};
if (root.crypto == null) define(root, 'crypto', {});
const crypto = root.crypto!;
if (crypto.subtle == null) define(crypto, 'subtle', {});
if (crypto.subtle!.digest === undefined) define(crypto.subtle!, 'digest', digest);
