/**
 * New Tab to URL - New Tab Redirector & Setup Screen
 */
import { loadConfig, saveConfig, normalizeUrl } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading-state');
  const setupEl = document.getElementById('setup-screen');
  const urlInput = document.getElementById('quick-url-input');
  const saveBtn = document.getElementById('quick-save-btn');
  const feedbackEl = document.getElementById('quick-feedback');
  const presetBtns = document.querySelectorAll('.preset-chip');
  const openExtDetailsBtn = document.getElementById('open-ext-details');

  // 1. Check if a target URL is configured
  const config = await loadConfig();

  if (config.targetUrl) {
    // Perform fast redirect
    redirectToUrl(config.targetUrl);
    return;
  }

  // 2. Unconfigured state: show modern setup interface
  if (loadingEl) loadingEl.classList.add('hidden');
  if (setupEl) setupEl.classList.remove('hidden');

  // Preset chips click handler
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-url');
      if (preset && urlInput) {
        urlInput.value = preset;
        urlInput.focus();
        validateCurrentInput();
      }
    });
  });

  // Realtime input validation hint
  if (urlInput) {
    urlInput.addEventListener('input', validateCurrentInput);
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveAndRedirect();
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', saveAndRedirect);
  }

  if (openExtDetailsBtn) {
    openExtDetailsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const extId = chrome.runtime.id;
      const detailsUrl = `chrome://extensions/?id=${extId}`;
      chrome.tabs.create({ url: detailsUrl });
    });
  }

  function validateCurrentInput() {
    const val = urlInput.value.trim();
    if (!val) {
      clearFeedback();
      return;
    }
    const check = normalizeUrl(val);
    if (!check.isValid) {
      showFeedback(check.error || 'Invalid URL syntax', 'error');
    } else {
      showFeedback(`Target: ${check.url} (${check.type})`, 'info');
    }
  }

  async function saveAndRedirect() {
    const raw = urlInput.value.trim();
    if (!raw) {
      showFeedback('Please enter a target URL', 'error');
      urlInput.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      const normalized = await saveConfig(raw);
      showFeedback('Saved! Launching new tab...', 'success');
      setTimeout(() => {
        redirectToUrl(normalized.url);
      }, 250);
    } catch (err) {
      showFeedback(err.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save & Launch';
    }
  }

  function showFeedback(msg, type = 'info') {
    if (!feedbackEl) return;
    feedbackEl.textContent = msg;
    feedbackEl.className = `feedback-banner ${type}`;
  }

  function clearFeedback() {
    if (!feedbackEl) return;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback-banner hidden';
  }

  function redirectToUrl(targetUrl) {
    // Safety fallback: if navigation fails or is blocked, recover from infinite loading
    const recoveryTimer = setTimeout(() => {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (setupEl) setupEl.classList.remove('hidden');
      if (urlInput) urlInput.value = targetUrl;
      showFeedback('Could not navigate to target URL. Check if the address is valid or if file access is enabled.', 'error');
    }, 1800);

    try {
      chrome.tabs.getCurrent((tab) => {
        if (tab && tab.id) {
          chrome.tabs.update(tab.id, { url: targetUrl }, () => {
            if (chrome.runtime.lastError) {
              clearTimeout(recoveryTimer);
              if (loadingEl) loadingEl.classList.add('hidden');
              if (setupEl) setupEl.classList.remove('hidden');
              if (urlInput) urlInput.value = targetUrl;
              showFeedback(`Redirect failed: ${chrome.runtime.lastError.message}`, 'error');
            }
          });
        } else {
          clearTimeout(recoveryTimer);
          window.location.replace(targetUrl);
        }
      });
    } catch (err) {
      clearTimeout(recoveryTimer);
      window.location.replace(targetUrl);
    }
  }
});
