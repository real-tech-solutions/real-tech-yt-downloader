const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const treeKill = require('tree-kill');

let mainWindow = null;
let activeChildProcess = null;
let isCancelled = false;

function formatNetscapeCookies(cookies) {
  const lines = [
    '# Netscape HTTP Cookie File',
    '# http://curl.haxx.se/rfc/cookie_spec.html',
    '# Generated automatically by Real Tech YT Downloader In-App Browser',
    ''
  ];

  for (const cookie of cookies) {
    const domain = cookie.domain || '';
    const includeSubdomains = domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const path = cookie.path || '/';
    const secure = cookie.secure ? 'TRUE' : 'FALSE';
    const expiry = Math.floor(cookie.expirationDate || (Date.now() / 1000 + 31536000));
    const name = cookie.name || '';
    const value = cookie.value || '';

    lines.push(`${domain}\t${includeSubdomains}\t${path}\t${secure}\t${expiry}\t${name}\t${value}`);
  }

  return lines.join('\n');
}

function getAutoCookiesPath() {
  return path.join(app.getPath('userData'), 'auto_cookies.txt');
}

async function saveSessionCookies() {
  try {
    const cookies = await session.defaultSession.cookies.get({});
    if (cookies && cookies.length > 0) {
      const netscapeText = formatNetscapeCookies(cookies);
      const filePath = getAutoCookiesPath();
      fs.writeFileSync(filePath, netscapeText, 'utf-8');
      return { success: true, count: cookies.length, filePath };
    }
  } catch (err) {
    console.error('Error saving session cookies:', err);
  }
  return { success: false, count: 0 };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 820,
    minWidth: 800,
    minHeight: 650,
    title: 'Real Tech YT Downloader',
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    saveSessionCookies();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (activeChildProcess) {
      killActiveProcess();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function getBinaryPaths() {
  const isPackaged = app.isPackaged;
  const baseBinDir = isPackaged
    ? path.join(process.resourcesPath, 'bin')
    : path.join(__dirname, 'bin');

  const ytDlpPath = path.join(baseBinDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  const ffmpegPath = path.join(baseBinDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

  return {
    binDir: baseBinDir,
    ytDlp: ytDlpPath,
    ffmpegDir: baseBinDir,
    ffmpeg: ffmpegPath,
    exists: fs.existsSync(ytDlpPath)
  };
}

function killActiveProcess() {
  if (activeChildProcess && activeChildProcess.pid) {
    const pid = activeChildProcess.pid;
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', pid.toString()]);
      } else {
        treeKill(pid, 'SIGKILL');
      }
    } catch (err) {
      console.error('Error killing process:', err);
    }
    activeChildProcess = null;
  }
}

ipcMain.handle('app:check-binaries', async () => {
  const binaries = getBinaryPaths();
  return {
    exists: binaries.exists,
    ytDlpPath: binaries.ytDlp,
    binDir: binaries.binDir
  };
});

ipcMain.handle('app:get-default-path', async () => {
  return app.getPath('downloads');
});

ipcMain.handle('clipboard:read', async () => {
  return clipboard.readText();
});

ipcMain.handle('dialog:select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Download Folder'
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('shell:open-folder', async (event, folderPath) => {
  if (folderPath && fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
    return true;
  }
  return false;
});

ipcMain.handle('auth:check-status', async () => {
  const cookiePath = getAutoCookiesPath();
  const exists = fs.existsSync(cookiePath);
  let count = 0;
  if (exists) {
    const cookies = await session.defaultSession.cookies.get({});
    count = cookies.length;
  }
  return { hasAutoCookies: exists && count > 0, count, cookiePath };
});

ipcMain.handle('auth:logout', async () => {
  try {
    await session.defaultSession.clearStorageData({ storages: ['cookies'] });
    const cookiePath = getAutoCookiesPath();
    if (fs.existsSync(cookiePath)) {
      fs.unlinkSync(cookiePath);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth:status-changed', { success: true, count: 0 });
    }
    return { success: true };
  } catch (err) {
    console.error('Error logging out:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('auth:open-login', async () => {
  const targetUrl = 'https://www.youtube.com';

  const authWindow = new BrowserWindow({
    width: 900,
    height: 720,
    title: `Sign In to YouTube - Real Tech YT Downloader`,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  authWindow.setMenu(null);
  authWindow.loadURL(targetUrl);

  let isAutoClosed = false;

  const checkAndSave = async () => {
    const res = await saveSessionCookies();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth:status-changed', res);
    }

    if (!isAutoClosed) {
      const cookies = await session.defaultSession.cookies.get({});
      const isLoggedIn = cookies.some(c => ['SAPISID', 'LOGIN_INFO', 'SSID'].includes(c.name));
      if (isLoggedIn) {
        isAutoClosed = true;
        setTimeout(() => {
          if (authWindow && !authWindow.isDestroyed()) {
            authWindow.close();
          }
        }, 1200);
      }
    }
  };

  authWindow.webContents.on('did-finish-load', checkAndSave);
  authWindow.webContents.on('did-navigate', checkAndSave);

  authWindow.on('closed', async () => {
    const res = await saveSessionCookies();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth:status-changed', res);
    }
  });

  return { success: true };
});

ipcMain.handle('download:start', async (event, options) => {
  if (activeChildProcess) {
    return { success: false, error: 'A download is already in progress.' };
  }

  isCancelled = false;
  const binaries = getBinaryPaths();

  if (!binaries.exists) {
    return {
      success: false,
      error: `Core download engine not found at "${binaries.ytDlp}". Please check binary files.`
    };
  }

  const { url, outputDir, quality } = options;

  if (!url) {
    return { success: false, error: 'Please enter a YouTube link.' };
  }

  const targetFolder = outputDir || app.getPath('downloads');
  const outputTemplate = path.join(targetFolder, '%(title)s.%(ext)s');

  let nodeJsArg = 'node';
  const defaultNodePath = 'C:\\Program Files\\nodejs\\node.exe';
  if (fs.existsSync(defaultNodePath)) {
    nodeJsArg = `node:${defaultNodePath}`;
  }

  const args = [
    '--newline',
    '--progress',
    '--js-runtimes', nodeJsArg,
    '--ffmpeg-location', binaries.ffmpegDir,
    '-o', outputTemplate
  ];

  const autoCookiePath = getAutoCookiesPath();
  if (fs.existsSync(autoCookiePath)) {
    args.push('--cookies', autoCookiePath);
  }

  if (quality === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else if (quality === '1080p') {
    args.push('-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best', '--merge-output-format', 'mp4');
  } else if (quality === '720p') {
    args.push('-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]/best', '--merge-output-format', 'mp4');
  } else {
    args.push('-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4');
  }

  args.push(url);

  console.log(`Executing: "${binaries.ytDlp}" ${args.join(' ')}`);

  const spawnEnv = { ...process.env };
  if (fs.existsSync('C:\\Program Files\\nodejs')) {
    spawnEnv.PATH = `C:\\Program Files\\nodejs;${spawnEnv.PATH || ''}`;
  }

  try {
    activeChildProcess = spawn(binaries.ytDlp, args, {
      windowsHide: true,
      env: spawnEnv
    });

    const sendProgress = (text) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download:progress-data', text);
      }
    };

    activeChildProcess.stdout.on('data', (data) => {
      sendProgress(data.toString());
    });

    activeChildProcess.stderr.on('data', (data) => {
      sendProgress(data.toString());
    });

    activeChildProcess.on('error', (err) => {
      activeChildProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download:error', err.message);
      }
    });

    activeChildProcess.on('close', (code) => {
      activeChildProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (isCancelled) {
          mainWindow.webContents.send('download:cancelled');
        } else if (code === 0) {
          mainWindow.webContents.send('download:complete', { outputDir: targetFolder });
        } else {
          mainWindow.webContents.send('download:error', 'Download could not finish. Please check the video link or try signing in.');
        }
      }
    });

    return { success: true, pid: activeChildProcess.pid };
  } catch (err) {
    activeChildProcess = null;
    return { success: false, error: err.message };
  }
});

ipcMain.handle('download:cancel', async () => {
  if (activeChildProcess) {
    isCancelled = true;
    killActiveProcess();
    return { success: true };
  }
  return { success: false, error: 'No active download process.' };
});
