const ASC_PENDING_KEY = 'asc.github-pages.pending.fragment.v0.1';
const PROTECTED_ASC_PREVIEW_URL = 'https://script.google.com/macros/s/AKfycbwueOtAmw_QKpWGfHHuX-dss4TSpyhnRGLj4Y6LcEW3KR2f4tAROR8ECjlCVP1JuEm07w/exec';

function getAscFragment(hashValue) {
  const hash = String(hashValue || '').replace(/^#/, '');
  if (!hash.startsWith('asc=')) return null;
  const payload = hash.slice(4);
  return payload ? '#asc=' + payload : null;
}

function preservePendingRequest(locationLike, storage) {
  const current = getAscFragment(locationLike.hash);

  if (current) {
    storage.setItem(ASC_PENDING_KEY, current);
    return { fragment: current, source: 'url' };
  }

  const saved = storage.getItem(ASC_PENDING_KEY);
  const restored = getAscFragment(saved);

  if (restored) {
    return { fragment: restored, source: 'session' };
  }

  return { fragment: null, source: 'none' };
}

function getProtectedSignInUrl() {
  return PROTECTED_ASC_PREVIEW_URL;
}

function buildProtectedReplayUrl(baseUrl, fragment) {
  const normalized = getAscFragment(fragment);
  if (!normalized) {
    throw new Error('ASC pending fragment is missing.');
  }
  return String(baseUrl).replace(/#.*$/, '') + normalized;
}

function setPendingState(pending) {
  const status = document.getElementById('status');
  const continueButton = document.getElementById('continue');

  if (pending.fragment) {
    status.textContent = 'Pending ASC request detected.';
    status.className = '';
    continueButton.disabled = false;
    return;
  }

  status.textContent = 'Pending ASC request not detected.';
  status.className = 'warning';
  continueButton.disabled = true;
}

function setFrontDoorError(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'warning';
  document.getElementById('continue').disabled = true;
}

function handleSignIn() {
  const opened = window.open(getProtectedSignInUrl(), '_blank', 'noopener');

  if (!opened) {
    setFrontDoorError('Sign-in could not open. Allow pop-ups, then try SIGN IN again.');
  }
}

function handleContinue() {
  const fragment = sessionStorage.getItem(ASC_PENDING_KEY);

  try {
    window.location.href = buildProtectedReplayUrl(
      PROTECTED_ASC_PREVIEW_URL,
      fragment
    );
  } catch (error) {
    setFrontDoorError('The pending ASC request could not be replayed: ' + error.message);
  }
}

function bootFrontDoor() {
  try {
    setPendingState(preservePendingRequest(window.location, sessionStorage));
  } catch (error) {
    setFrontDoorError('The front door could not read the pending ASC request: ' + error.message);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('signIn').addEventListener('click', handleSignIn);
    document.getElementById('continue').addEventListener('click', handleContinue);
    bootFrontDoor();
  });
}
