const ASC_PENDING_KEY = 'asc.github-pages.pending.fragment.v0.1';
const PROTECTED_ASC_BASE_URL = 'https://script.google.com/macros/s/AKfycbwueOtAmw_QKpWGfHHuX-dss4TSpyhnRGLj4Y6LcEW3KR2f4tAROR8ECjlCVP1JuEm07w/exec';
const CROSSAI_AUTH_URL = PROTECTED_ASC_BASE_URL + '?view=crossai-auth';
const CROSSAI_START_URL = PROTECTED_ASC_BASE_URL + '?view=crossai-start';

const CROSSAI_DRAFT_KEY = 'crossai.start.draft.v0.1';
const CROSSAI_PROVIDER_KEY = 'crossai.start.provider.v0.1';
const CROSSAI_AUTH_ATTEMPTED_KEY = 'crossai.auth.attempted.v0.1';
const CROSSAI_START_ID_KEY = 'crossai.start.id.v0.1';
const CROSSAI_START_FINGERPRINT_KEY = 'crossai.start.fingerprint.v0.1';

const SUPPORTED_PROVIDERS = Object.freeze(['ChatGPT', 'Gemini', 'Copilot']);

function getAscFragment(hashValue) {
  const hash = String(hashValue || '').replace(/^#/, '');
  if (!hash.startsWith('asc=')) return null;
  const payload = hash.slice(4);
  return payload ? '#asc=' + payload : null;
}

function preservePendingRequest(locationLike, storage) {
  const current = getAscFragment(locationLike && locationLike.hash);
  if (current) {
    storage.setItem(ASC_PENDING_KEY, current);
    return { fragment: current, source: 'url' };
  }
  const saved = storage.getItem(ASC_PENDING_KEY);
  const restored = getAscFragment(saved);
  return restored
    ? { fragment: restored, source: 'session' }
    : { fragment: null, source: 'none' };
}

function buildProtectedReplayUrl(baseUrl, fragment) {
  const normalized = getAscFragment(fragment);
  if (!normalized) throw new Error('CrossAI pending SAVE payload is missing.');
  return String(baseUrl).replace(/#.*$/, '') + normalized;
}

function getSupportedProviders() {
  return SUPPORTED_PROVIDERS.slice();
}

function normalizeStartState(state) {
  return {
    draft: String(state && state.draft || ''),
    provider: SUPPORTED_PROVIDERS.includes(state && state.provider) ? state.provider : ''
  };
}

function readStartState(storage) {
  return normalizeStartState({
    draft: storage.getItem(CROSSAI_DRAFT_KEY) || '',
    provider: storage.getItem(CROSSAI_PROVIDER_KEY) || ''
  });
}

function writeStartState(storage, state) {
  const normalized = normalizeStartState(state);
  storage.setItem(CROSSAI_DRAFT_KEY, normalized.draft);
  if (normalized.provider) storage.setItem(CROSSAI_PROVIDER_KEY, normalized.provider);
  else storage.removeItem(CROSSAI_PROVIDER_KEY);
  return normalized;
}

function clearNewConversationState(storage) {
  storage.removeItem(CROSSAI_DRAFT_KEY);
  storage.removeItem(CROSSAI_PROVIDER_KEY);
  storage.removeItem(CROSSAI_START_ID_KEY);
  storage.removeItem(CROSSAI_START_FINGERPRINT_KEY);
}

function validateStartState(state) {
  const normalized = normalizeStartState(state);
  if (!normalized.draft.trim()) return { ok: false, code: 'DRAFT_REQUIRED', message: 'Write something first.' };
  if (!normalized.provider) return { ok: false, code: 'PROVIDER_REQUIRED', message: 'Choose an AI provider first.' };
  return { ok: true, state: { draft: normalized.draft.trim(), provider: normalized.provider } };
}

function startFingerprint(state) {
  return String(state.draft || '').trim() + '\u0000' + String(state.provider || '');
}

function defaultStartId() {
  if (typeof crypto !== 'undefined' && crypto && typeof crypto.randomUUID === 'function') {
    return 'cs_' + crypto.randomUUID().replace(/-/g, '');
  }
  return 'cs_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function ensureStartId(storage, state, idFactory) {
  const fingerprint = startFingerprint(state);
  const existingFingerprint = storage.getItem(CROSSAI_START_FINGERPRINT_KEY);
  const existingId = storage.getItem(CROSSAI_START_ID_KEY);
  if (existingFingerprint === fingerprint && existingId) return existingId;
  const id = (typeof idFactory === 'function' ? idFactory() : defaultStartId());
  storage.setItem(CROSSAI_START_FINGERPRINT_KEY, fingerprint);
  storage.setItem(CROSSAI_START_ID_KEY, id);
  return id;
}

function utf8ToBase64Url(text) {
  const bytes = new TextEncoder().encode(String(text));
  let binary = '';
  bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function encodeStartPayload(state, startId) {
  const valid = validateStartState(state);
  if (!valid.ok) throw new Error(valid.code);
  return utf8ToBase64Url(JSON.stringify({
    start_id: String(startId || ''),
    draft: valid.state.draft,
    provider: valid.state.provider
  }));
}

function buildCrossAiStartUrl(state, startId) {
  return CROSSAI_START_URL + '#start=' + encodeStartPayload(state, startId);
}

function setStartStatus(message, kind) {
  const element = document.getElementById('startStatus');
  element.textContent = message || '';
  element.className = 'status' + (kind ? ' ' + kind : '');
}

function currentDomState() {
  return {
    draft: document.getElementById('draft').value,
    provider: document.querySelector('.provider[aria-pressed="true"]')
      ? document.querySelector('.provider[aria-pressed="true"]').dataset.provider
      : ''
  };
}

function renderProviderSelection(provider) {
  document.querySelectorAll('.provider').forEach(function (button) {
    button.setAttribute('aria-pressed', button.dataset.provider === provider ? 'true' : 'false');
  });
}

function saveCurrentDomState() {
  return writeStartState(localStorage, currentDomState());
}

function handleProviderClick(event) {
  const provider = event.currentTarget.dataset.provider;
  renderProviderSelection(provider);
  saveCurrentDomState();
  ensureStartId(localStorage, currentDomState());
  setStartStatus('', '');
}

function handleDraftInput() {
  saveCurrentDomState();
  ensureStartId(localStorage, currentDomState());
  setStartStatus('', '');
}

function openAuthGate(openWindow) {
  const opener = typeof openWindow === 'function' ? openWindow : window.open;
  return opener(CROSSAI_AUTH_URL, '_blank', 'noopener');
}

function handleGo() {
  const saved = saveCurrentDomState();
  const valid = validateStartState(saved);
  if (!valid.ok) {
    setStartStatus(valid.message, 'error');
    return;
  }

  const startId = ensureStartId(localStorage, valid.state);
  const authAttempted = localStorage.getItem(CROSSAI_AUTH_ATTEMPTED_KEY) === '1';

  if (!authAttempted) {
    const popup = openAuthGate(window.open);
    if (popup) {
      localStorage.setItem(CROSSAI_AUTH_ATTEMPTED_KEY, '1');
      setStartStatus('Complete Google sign-in in the new tab, then return here and press GO again. Your text is preserved.', '');
    } else {
      localStorage.removeItem(CROSSAI_AUTH_ATTEMPTED_KEY);
      setStartStatus('Your browser blocked the sign-in tab. Your text is preserved; allow pop-ups and press GO again.', 'error');
    }
    return;
  }

  const startUrl = buildCrossAiStartUrl(valid.state, startId);
  const startWindow = window.open(startUrl, '_blank', 'noopener');
  if (startWindow) {
    setStartStatus('CrossAI is starting this conversation in the new tab.', 'ok');
  } else {
    window.location.href = startUrl;
  }
}

function renderPendingSave(pending) {
  const box = document.getElementById('saveRecovery');
  if (!pending || !pending.fragment) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  document.getElementById('saveStatus').textContent = 'A saved CrossAI request is waiting for confirmation.';
}

function handleSaveSignIn() {
  window.open(PROTECTED_ASC_BASE_URL, '_blank', 'noopener');
  document.getElementById('saveStatus').textContent = 'Complete sign-in, return here, then press CONTINUE SAVE.';
}

function handleSaveContinue() {
  const fragment = sessionStorage.getItem(ASC_PENDING_KEY);
  try {
    window.location.href = buildProtectedReplayUrl(PROTECTED_ASC_BASE_URL, fragment);
  } catch (error) {
    document.getElementById('saveStatus').textContent = error.message;
  }
}

function handleAuthReadyMessage(event) {
  if (!event || !event.data || event.data.type !== 'crossai-auth-ready') return false;
  localStorage.setItem(CROSSAI_AUTH_ATTEMPTED_KEY, '1');
  setStartStatus('Sign-in ready. Press GO again to start this CrossAI conversation.', 'ok');
  return true;
}

function bootCrossAi() {
  const params = new URLSearchParams(window.location.search || '');
  if (params.get('new') === '1') {
    clearNewConversationState(localStorage);
    history.replaceState(null, '', window.location.pathname);
  }

  const state = readStartState(localStorage);
  document.getElementById('draft').value = state.draft;
  renderProviderSelection(state.provider);
  renderPendingSave(preservePendingRequest(window.location, sessionStorage));

  document.querySelectorAll('.provider').forEach(function (button) {
    button.addEventListener('click', handleProviderClick);
  });
  document.getElementById('draft').addEventListener('input', handleDraftInput);
  document.getElementById('go').addEventListener('click', handleGo);
  document.getElementById('saveSignIn').addEventListener('click', handleSaveSignIn);
  document.getElementById('saveContinue').addEventListener('click', handleSaveContinue);
  window.addEventListener('message', handleAuthReadyMessage);
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootCrossAi);
}
