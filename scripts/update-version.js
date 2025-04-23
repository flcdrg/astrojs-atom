// This script updates package.json version using nerdbank-gitversioning
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nbgv from 'nerdbank-gitversioning';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const versionInfo = await nbgv.getVersion();
  const version = versionInfo.npmPackageVersion;
  
  // Update package.json
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Set package.json version to ${pkg.version}`);
  
  // Update generator.ts
  const generatorPath = path.join(__dirname, '..', 'src', 'generator.ts');
  let generatorContent = fs.readFileSync(generatorPath, 'utf8');
  
  // Replace the version value in the defaultGenerator object
  generatorContent = generatorContent.replace(
    /version: ['"].*?['"]/,
    `version: '${version}'`
  );
  
  fs.writeFileSync(generatorPath, generatorContent);
  console.log(`Updated generator.ts version to ${version}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
