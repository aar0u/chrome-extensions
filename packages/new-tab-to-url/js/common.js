/**
 * New Tab to URL - Shared Utility & Storage Layer
 */

export const DEFAULT_CONFIG = {
  targetUrl: '',
  updatedAt: 0,
};

/**
 * Load configuration from chrome.storage.sync
 * @returns {Promise<typeof DEFAULT_CONFIG>}
 */
export async function loadConfig() {
  try {
    const data = await chrome.storage.sync.get(['newTabUrl', 'updatedAt']);
    return {
      targetUrl: data.newTabUrl || '',
      updatedAt: data.updatedAt || 0,
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration to chrome.storage.sync
 * @param {string} targetUrl
 */
export async function saveConfig(targetUrl) {
  const normalized = normalizeUrl(targetUrl);
  if (!normalized.isValid) {
    throw new Error(normalized.error || 'Invalid URL format');
  }

  const payload = {
    newTabUrl: normalized.url,
    updatedAt: Date.now(),
  };

  await chrome.storage.sync.set(payload);
  return normalized;
}

/**
 * Reset / Clear saved URL
 */
export async function clearConfig() {
  await chrome.storage.sync.remove(['newTabUrl', 'updatedAt']);
}

/**
 * Intelligently parse, validate, and normalize input URL
 * @param {string} rawInput
 */
export function normalizeUrl(rawInput) {
  const input = (rawInput || '').trim();
  if (!input) {
    return { isValid: false, url: '', type: 'empty', error: 'Please enter a target URL.' };
  }

  const lower = input.toLowerCase();

  // Support clean blank page
  if (lower === 'about:blank') {
    return { isValid: true, url: 'about:blank', type: 'internal', scheme: 'about:' };
  }

  // Explicitly disallow browser internal schemes (security restriction in Chromium)
  if (lower.startsWith('chrome://') || lower.startsWith('edge://') || lower.startsWith('brave://') || lower.startsWith('about:')) {
    return { isValid: false, url: input, type: 'disallowed', error: 'Browser internal pages (e.g. chrome://) cannot be redirected due to security restrictions.' };
  }

  // Handle local file URLs
  if (lower.startsWith('file:///')) {
    return { isValid: true, url: input, type: 'file', scheme: 'file:///' };
  }

  // Handle Windows-style file paths (e.g. C:\... or C:/...)
  if (/^[a-zA-Z]:[/\\]/.test(input)) {
    const formatted = 'file:///' + input.replace(/\\/g, '/');
    return { isValid: true, url: formatted, type: 'file', scheme: 'file:///' };
  }

  // Handle web URLs
  let candidate = input;
  // If no scheme specified, default to https:// (or http:// for localhost/ip)
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    if (lower.startsWith('localhost') || /^127(?:\.\d+){3}/.test(lower)) {
      candidate = 'http://' + candidate;
    } else {
      candidate = 'https://' + candidate;
    }
  }

  try {
    const parsed = new URL(candidate);
    const validProtocols = ['https:', 'http:', 'file:'];
    if (!validProtocols.includes(parsed.protocol)) {
      return { isValid: false, url: input, type: 'unknown', error: `Unsupported protocol: ${parsed.protocol}` };
    }
    return { isValid: true, url: parsed.href, type: parsed.protocol === 'file:' ? 'file' : 'web', scheme: parsed.protocol };
  } catch (err) {
    return { isValid: false, url: input, type: 'invalid', error: 'Invalid URL syntax.' };
  }
}
