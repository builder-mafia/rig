import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(appDir, 'package.json');
const tauriConfigPath = path.join(appDir, 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = path.join(appDir, 'src-tauri', 'Cargo.toml');

const readPackageVersion = async () => {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const versionArg = process.argv[2];
  const version = versionArg ?? packageJson.version;

  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('A valid version is required.');
  }

  return {
    packageJson,
    version,
    versionArg,
  };
};

const syncPackageJson = async (packageJson, versionArg, version) => {
  if (versionArg == null) {
    return;
  }

  packageJson.version = version;
  await writeFile(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
    'utf8',
  );
};

const syncTauriConfig = async version => {
  const tauriConfig = JSON.parse(await readFile(tauriConfigPath, 'utf8'));
  tauriConfig.version = version;
  await writeFile(
    tauriConfigPath,
    `${JSON.stringify(tauriConfig, null, 2)}\n`,
    'utf8',
  );
};

const syncCargoToml = async version => {
  const cargoToml = await readFile(cargoTomlPath, 'utf8');
  const packageSectionStart = cargoToml.indexOf('[package]');

  if (packageSectionStart === -1) {
    throw new Error('Failed to find [package] section in Cargo.toml.');
  }

  const rest = cargoToml.slice(packageSectionStart + '[package]'.length);
  const nextSectionOffset = rest.search(/\n\[[^\]]+\]/);
  const packageSectionEnd =
    nextSectionOffset === -1
      ? cargoToml.length
      : packageSectionStart + '[package]'.length + nextSectionOffset;
  const packageSection = cargoToml.slice(
    packageSectionStart,
    packageSectionEnd,
  );
  const hasVersionLine = /^version\s*=\s*".*"$/m.test(packageSection);

  if (!hasVersionLine) {
    throw new Error(
      'Failed to find version in [package] section of Cargo.toml.',
    );
  }

  const nextPackageSection = packageSection.replace(
    /^version\s*=\s*".*"$/m,
    `version = "${version}"`,
  );

  const nextCargoToml = cargoToml.replace(packageSection, nextPackageSection);

  await writeFile(cargoTomlPath, nextCargoToml, 'utf8');
};

const main = async () => {
  const { packageJson, version, versionArg } = await readPackageVersion();

  await syncPackageJson(packageJson, versionArg, version);
  await Promise.all([syncTauriConfig(version), syncCargoToml(version)]);

  process.stdout.write(`Synced Tauri versions to ${version}\n`);
};

main().catch(error => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
