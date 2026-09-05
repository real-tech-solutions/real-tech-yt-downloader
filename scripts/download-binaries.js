/**
 * Automated Windows Binaries Downloader Script
 * Downloads yt-dlp.exe into ./bin/ directory
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} ...`);
    const file = fs.createWriteStream(destPath);

    const request = (targetUrl) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          return request(response.headers.location);
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file. Status code: ${response.statusCode}`));
          return;
        }

        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            process.stdout.write(`\rProgress: ${pct}% (${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB)`);
          }
        });

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`\nSuccessfully downloaded: ${destPath}`);
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };

    request(url);
  });
}

async function main() {
  console.log('=== Advanced Media Downloader - Binary Setup ===\n');

  // 1. Download yt-dlp.exe
  const ytDlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
  const ytDlpDest = path.join(binDir, 'yt-dlp.exe');

  try {
    await downloadFile(ytDlpUrl, ytDlpDest);
  } catch (err) {
    console.error('Error downloading yt-dlp.exe:', err.message);
  }

  console.log('\n--- FFmpeg Setup Info ---');
  console.log('To complete binary setup:');
  console.log('1. Place "ffmpeg.exe" inside: ' + binDir);
  console.log('2. Place "ffprobe.exe" inside: ' + binDir);
  console.log('Official FFmpeg Windows build links: https://github.com/BtbN/FFmpeg-Builds/releases or https://ffbinaries.com/downloads\n');
}

main();
