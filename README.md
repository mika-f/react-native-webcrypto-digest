# react-native-webcrypto-digest

A native-backed polyfill for `crypto.subtle.digest` in React Native on iOS and Android.
iOS uses CommonCrypto; Android uses java.security.MessageDigest.

## Installation

```sh
npm install @natsuneko-laboratory/react-native-webcrypto-digest
```

Install iOS pods (`cd ios && pod install`) and rebuild your app. Android uses
React Native autolinking. For Expo, follow the development build instructions below.

Import once at the start of your app's entry point, before modules that use digest:

```ts
import '@natsuneko-laboratory/react-native-webcrypto-digest';

const bytes = new Uint8Array([104, 101, 108, 108, 111]); // "hello" in UTF-8
const result = await crypto.subtle.digest('SHA-256', bytes);
const hex = Array.from(new Uint8Array(result), byte =>
  byte.toString(16).padStart(2, '0'),
).join('');
```

## Expo (development builds and EAS Build)

Install the package in your Expo app:

```sh
npx expo install @natsuneko-laboratory/react-native-webcrypto-digest expo-dev-client
```

[Expo Autolinking](https://docs.expo.dev/modules/autolinking/) discovers the iOS
podspec and Android ReactPackage automatically. No config plugin or entry in
`app.json`'s `plugins` array is needed. Hashing uses the same native implementation
as a bare React Native app; no `expo-crypto` dependency is required.

### Entry point

For Expo Router, create `index.js` at the app root:

```js
import '@natsuneko-laboratory/react-native-webcrypto-digest';
import 'expo-router/entry';
```

Set `main` in your app's `package.json` to this file (keep the other fields):

```json
{
  "main": "index.js"
}
```

For an app without Expo Router, import the polyfill before your `App` import in
the entry file that calls `registerRootComponent(App)`.

### Local development build

Run the command for your target platform:

```sh
npx expo run:ios
# or
npx expo run:android
```

These commands generate native projects when they do not exist and build the app.
If you use Continuous Native Generation and need to regenerate existing native
projects, run `npx expo prebuild` first. After adding or updating native code in
this package, rebuild the app; restarting Metro or delivering an OTA update alone
cannot install native code.

### EAS Build

Configure EAS if the app does not have an EAS project yet:

```sh
npx eas-cli@latest build:configure
```

Add or merge a development profile into `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

```sh
npx eas-cli@latest build --profile development --platform ios
# or
npx eas-cli@latest build --profile development --platform android
```

Install the resulting build and start Metro with `npx expo start --dev-client`.
The package is also autolinked in EAS production builds. EAS runs Prebuild when
native project directories are absent; if you keep those directories in source
control, keep their generated configuration up to date.

[Expo Go cannot load this package's custom native module](https://docs.expo.dev/develop/development-builds/introduction/).
Use a development build or production build.


## API

- Supports `SHA-1`, `SHA-256`, `SHA-384`, and `SHA-512` (case-insensitive).
- Accepts an algorithm string or `{ name: 'SHA-256' }`.
- Accepts `ArrayBuffer`, typed arrays, and `DataView`, respecting view offsets and lengths.
- Returns a `Promise<ArrayBuffer>` containing the digest.
- Unsupported algorithms reject with `NotSupportedError`. Without `DOMException`,
  an `Error` with that name is used. Invalid inputs reject with `TypeError`.
- Creates `crypto` and `subtle` only when absent, and preserves an existing `digest`.
  If native digest exists, its behavior and supported algorithms apply.

Only `digest` is polyfilled. Other Web Crypto operations, random values, and
`TextEncoder` are not provided. Native module linking and an app rebuild are required. A random-values polyfill is
not required for hashing. SharedArrayBuffer inputs are not supported.

Hashing runs on the native module queue, with a Promise-based API. Input bytes are
copied to a number array for the native bridge; very large inputs incur JavaScript
conversion and bridge overhead. The module uses the legacy native module API
(and the New Architecture interop layer), rather than a generated TurboModule. SHA-1 is included for compatibility and should not
be used for new collision-resistant designs.

## Development

```sh
pnpm install
pnpm test
pnpm build
```

Tests use a mocked native bridge backed by Node hashing to check all four algorithm
names, installation, input views, rejection behavior, and operation without DOMException.
These tests do not execute the iOS or Android module. React Native
on-device validation is separate from these Node tests.

The test suite also packs the library and runs Expo Autolinking against that
artifact for iOS and Android, checking the podspec and ReactPackage registration.
This verifies package discovery, not native compilation or on-device execution.
