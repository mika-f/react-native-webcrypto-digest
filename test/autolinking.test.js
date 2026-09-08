import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve('expo-modules-autolinking/package.json')), 'bin/expo-modules-autolinking.js');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

test('Expo autolinks the published package on iOS and Android', () => {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'digest-expo-')));
  try {
    // Test the publish artifact, so missing native files in `files` cannot pass.
    const packed = JSON.parse(execFileSync('npm', [
      'pack', '--ignore-scripts', '--json', '--cache', join(temporary, 'npm-cache'),
      '--pack-destination', temporary,
    ], { cwd: root, encoding: 'utf8' }));
    const library = join(temporary, 'node_modules', pkg.name);
    mkdirSync(library, { recursive: true });
    execFileSync('tar', ['-xzf', join(temporary, packed[0].filename), '--strip-components=1', '-C', library]);
    symlinkSync(dirname(require.resolve('react-native/package.json')), join(temporary, 'node_modules/react-native'));
    writeFileSync(join(temporary, 'package.json'), JSON.stringify({
      name: 'expo-digest-autolinking-fixture',
      private: true,
      dependencies: { [pkg.name]: pkg.version, 'react-native': '*' },
    }));
    for (const platform of ['ios', 'android']) {
      const config = JSON.parse(execFileSync(process.execPath, [
        cli, 'react-native-config', '--platform', platform, '--project-root', temporary, '--json',
      ], { cwd: temporary, encoding: 'utf8' }));
      const linked = config.dependencies[pkg.name]?.platforms[platform];
      assert.ok(linked, `${platform}: package must be detected`);
      if (platform === 'ios') {
        assert.equal(linked.podspecPath, join(library, 'react-native-webcrypto-digest.podspec'));
      } else {
        assert.equal(linked.sourceDir, join(library, 'android'));
        assert.equal(linked.packageImportPath, 'import com.webcryptodigest.RNWebCryptoDigestPackage;');
        assert.equal(linked.packageInstance, 'new RNWebCryptoDigestPackage()');
      }
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
