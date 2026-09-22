/**
 * New Tab to URL - Popup Configuration Script
 */
import { loadConfig, saveConfig, clearConfig, normalizeUrl } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlInput = document.getElementById('url-input');
  const typeBadge = document.getElementById('type-badge');
  const useCurrentBtn = document.getElementById('use-current-btn');
  const testUrlBtn = document.getElementById('test-url-btn');
  const saveBtn = document.getElementById('save-btn');
  const resetBtn = document.getElementById('reset-btn');
  const statusEl = document.getElementById('status-msg');

  // Load existing configuration
  const config = await loadConfig();
  if (config.targetUrl) {
    urlInput.value = config.targetUrl;
    updateBadge(config.targetUrl);
  }

  // Real-time badge & validation
  urlInput.addEventListener('input', () => {
    updateBadge(urlInput.value);
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  });

  // "Use Current Tab" Quick Action
  useCurrentBtn.addEventListener('click', async () => {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.url) {
        // Disallow setting the extension's own newtab page as redirect loop
        if (activeTab.url.includes(chrome.runtime.id)) {
          showStatus('Cannot use the extension page itself as target', 'error');
          return;
        }

        const check = normalizeUrl(activeTab.url);
        if (!check.isValid) {
          showStatus(check.error || 'Current tab is a restricted internal page', 'error');
          return;
        }

        urlInput.value = check.url;
        updateBadge(check.url);
        showStatus('Filled with current tab URL', 'info');
      } else {
        showStatus('Could not read current tab URL', 'error');
      }
    } catch (err) {
      showStatus('Unable to access current tab', 'error');
    }
  });

  // "Test URL" button
  testUrlBtn.addEventListener('click', () => {
    const raw = urlInput.value.trim();
    const result = normalizeUrl(raw);
    if (!result.isValid) {
      showStatus(result.error || 'Please enter a valid URL first', 'error');
      return;
    }
    chrome.tabs.create({ url: result.url });
  });

  // Save action
  saveBtn.addEventListener('click', handleSave);

  // Reset action
  resetBtn.addEventListener('click', async () => {
    await clearConfig();
    urlInput.value = '';
    updateBadge('');
    showStatus('Custom URL reset. New tab will show setup screen.', 'info');
  });

  async function handleSave() {
    const raw = urlInput.value.trim();
    if (!raw) {
      showStatus('Please enter a target URL or reset', 'error');
      urlInput.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      const saved = await saveConfig(raw);
      urlInput.value = saved.url;
      updateBadge(saved.url);
      showStatus('Saved successfully! New tabs will open this URL.', 'success');
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  }

  function updateBadge(raw) {
    if (!typeBadge) return;
    const trimmed = (raw || '').trim();
    if (!trimmed) {
      typeBadge.textContent = '';
      typeBadge.className = 'type-badge hidden';
      return;
    }

    const check = normalizeUrl(trimmed);
    typeBadge.classList.remove('hidden');
    if (!check.isValid) {
      typeBadge.textContent = 'Invalid';
      typeBadge.className = 'type-badge badge-invalid';
      return;
    }

    if (check.type === 'file') {
      typeBadge.textContent = '📁 Local File';
      typeBadge.className = 'type-badge badge-file';
    } else if (check.type === 'internal') {
      typeBadge.textContent = '📄 Blank Page';
      typeBadge.className = 'type-badge badge-internal';
    } else {
      typeBadge.textContent = '🌐 Web URL';
      typeBadge.className = 'type-badge badge-web';
    }
  }

  function showStatus(text, type = 'info') {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = `status-msg ${type}`;
    setTimeout(() => {
      if (statusEl.textContent === text) {
        statusEl.textContent = '';
        statusEl.className = 'status-msg';
      }
    }, 3500);
  }
});
