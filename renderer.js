document.addEventListener('DOMContentLoaded', async () => {

  const urlInput = document.getElementById('url-input');
  const pasteUrlBtn = document.getElementById('paste-url-btn');
  const clearUrlBtn = document.getElementById('clear-url-btn');

  const outputDirInput = document.getElementById('output-dir-input');
  const browseDirBtn = document.getElementById('browse-dir-btn');
  const openDirBtn = document.getElementById('open-dir-btn');

  const startBtn = document.getElementById('start-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const progressContainer = document.getElementById('progress-container');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressPercentageText = document.getElementById('progress-percentage-text');
  const progressStatusText = document.getElementById('progress-status-text');

  const loginYoutubeBtn = document.getElementById('login-youtube-btn');
  const logoutBtn = document.getElementById('logout-btn');

  const errorModal = document.getElementById('error-modal');
  const errorModalMessage = document.getElementById('error-modal-message');
  const errorModalCloseBtn = document.getElementById('error-modal-close-btn');

  let activeOutputDir = '';

  try {
    const defaultPath = await window.electronAPI.getDefaultPath();
    activeOutputDir = localStorage.getItem('amd_output_dir') || defaultPath;
    outputDirInput.value = activeOutputDir;
  } catch (err) {
    console.error('Failed to get path:', err);
  }

  async function updateAuthStatusUI() {
    try {
      const status = await window.electronAPI.checkAuthStatus();
      if (status.hasAutoCookies) {
        if (logoutBtn) logoutBtn.classList.remove('hidden');
      } else {
        if (logoutBtn) logoutBtn.classList.add('hidden');
      }
    } catch (err) {
      console.error('Error checking auth:', err);
    }
  }

  updateAuthStatusUI();

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.electronAPI.logout();
      await updateAuthStatusUI();
    });
  }

  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim() !== '') {
      clearUrlBtn.classList.remove('hidden');
    } else {
      clearUrlBtn.classList.add('hidden');
    }
  });

  clearUrlBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearUrlBtn.classList.add('hidden');
    urlInput.focus();
  });

  pasteUrlBtn.addEventListener('click', async () => {
    try {
      const text = await window.electronAPI.readClipboard();
      if (text && text.trim() !== '') {
        urlInput.value = text.trim();
        clearUrlBtn.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  });

  if (loginYoutubeBtn) {
    loginYoutubeBtn.addEventListener('click', () => {
      window.electronAPI.openLoginWindow('youtube');
    });
  }

  window.electronAPI.onAuthStatusChanged(() => {
    updateAuthStatusUI();
  });

  browseDirBtn.addEventListener('click', async () => {
    const folder = await window.electronAPI.selectDirectory();
    if (folder) {
      activeOutputDir = folder;
      outputDirInput.value = folder;
      localStorage.setItem('amd_output_dir', folder);
    }
  });

  openDirBtn.addEventListener('click', async () => {
    if (activeOutputDir) {
      await window.electronAPI.openFolder(activeOutputDir);
    }
  });

  startBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
      showErrorModal('Please paste a YouTube video link first.');
      urlInput.focus();
      return;
    }

    const selectedQuality = document.querySelector('input[name="quality-choice"]:checked')?.value || 'best';

    setDownloadingState(true);
    updateProgressUI(0, 'Preparing download...');

    const res = await window.electronAPI.startDownload({
      url: url,
      outputDir: activeOutputDir,
      quality: selectedQuality
    });

    if (!res.success) {
      setDownloadingState(false);
      showErrorModal(res.error || 'Could not start download.');
    }
  });

  cancelBtn.addEventListener('click', async () => {
    await window.electronAPI.cancelDownload();
  });

  window.electronAPI.onProgressData((data) => {
    parseYtDlpOutput(data);
  });

  window.electronAPI.onComplete(() => {
    setDownloadingState(false);
    updateProgressUI(100, 'Download Finished! Check your folder.');
  });

  window.electronAPI.onError((errMessage) => {
    setDownloadingState(false);
    showErrorModal(errMessage || 'Download could not finish.');
  });

  window.electronAPI.onCancelled(() => {
    setDownloadingState(false);
    updateProgressUI(0, 'Download Cancelled');
  });

  errorModalCloseBtn.addEventListener('click', () => {
    errorModal.classList.add('hidden');
  });

  function showErrorModal(message) {
    errorModalMessage.textContent = message;
    errorModal.classList.remove('hidden');
  }

  function setDownloadingState(downloading) {
    if (downloading) {
      startBtn.disabled = true;
      startBtn.className = 'w-full sm:w-auto px-8 py-3.5 bg-slate-400 text-white font-bold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2.5';
      startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Downloading...';

      cancelBtn.classList.remove('hidden');
      cancelBtn.disabled = false;
      progressContainer.classList.remove('hidden');
    } else {
      startBtn.disabled = false;
      startBtn.className = 'w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2.5 transition-all';
      startBtn.innerHTML = '<i class="fa-solid fa-download"></i> Start Download';

      cancelBtn.classList.add('hidden');
      cancelBtn.disabled = true;
    }
  }

  function updateProgressUI(percentage, statusText) {
    const pct = Math.min(100, Math.max(0, percentage));
    progressBarFill.style.width = `${pct}%`;
    progressPercentageText.textContent = `${pct.toFixed(0)}%`;
    if (statusText) progressStatusText.textContent = statusText;
  }

  function parseYtDlpOutput(rawText) {
    if (!rawText) return;

    if (rawText.includes('[ExtractAudio]')) {
      progressStatusText.textContent = 'Converting Audio to MP3...';
    } else if (rawText.includes('[Merger]') || rawText.includes('Merging formats')) {
      progressStatusText.textContent = 'Merging Highest Quality Video & Audio...';
    } else if (rawText.includes('[download]')) {
      const pctMatch = rawText.match(/\[download\]\s+(\d+(?:\.\d+)?)%/i);
      if (pctMatch) {
        const pct = parseFloat(pctMatch[1]);
        updateProgressUI(pct, `Downloading... ${pct.toFixed(0)}%`);
      }
    }
  }

});
