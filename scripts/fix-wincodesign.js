const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const cacheDir = path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign');
const sevenZipBin = path.join(__dirname, '..', 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

if (fs.existsSync(cacheDir)) {
  const files = fs.readdirSync(cacheDir);
  const archive = files.find(f => f.endsWith('.7z'));
  if (archive) {
    const archivePath = path.join(cacheDir, archive);
    const targetDir = path.join(cacheDir, 'winCodeSign-2.6.0');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    console.log(`Extracting ${archivePath} to ${targetDir}...`);
    // Exclude darwin folder to avoid symlink errors on Windows
    spawnSync(sevenZipBin, ['x', '-y', archivePath, `-o${targetDir}`, '-xr!darwin/*'], { stdio: 'inherit' });
    console.log('Done fixing winCodeSign extraction!');
  }
}
