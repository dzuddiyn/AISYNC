const ASC_PENDING_KEY = 'asc.github-pages.pending.fragment.v0.1';
const PROTECTED_ASC_PREVIEW_URL = 'https://script.google.com/macros/s/AKfycbwueOtAmw_QKpWGfHHuX-dss4TSpyhnRGLj4Y6LcEW3KR2f4tAROR8ECjlCVP1JuEm07w/exec';
const FRONT_DOOR_DRAFT_KEY = 'asc.front-door.draft.v0.1';
const FRONT_DOOR_PROVIDER_KEY = 'asc.front-door.provider.v0.1';
const FRONT_DOOR_ROUTE_OVERRIDE_KEY = 'asc.front-door.route-override.v0.1';
const SUPPORTED_PROVIDERS = Object.freeze(['ChatGPT', 'Gemini', 'Copilot']);
const ROUTE_CONFIGS = Object.freeze({
  DUMP: Object.freeze({
    route: 'DUMP',
    method: 'ZASSPILL',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zasspill/my/'
  }),
  DECIDE: Object.freeze({
    route: 'DECIDE',
    method: 'ZASSELECTION',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zasselection/my/'
  }),
  DESIGN: Object.freeze({
    route: 'DESIGN',
    method: 'ZASSIMPLE',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zassimple/my/'
  })
});

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

function getSupportedProviders() {
  return SUPPORTED_PROVIDERS.slice();
}

function getRouteConfig(route) {
  const normalized = String(route || '').toUpperCase();
  return ROUTE_CONFIGS[normalized] || null;
}

function suggestRoute(draft) {
  const text = String(draft || '').toLowerCase();

  if (/bandingkan|banding|compare|comparison|choice|choose|pilih|pilihan|antara|\bvs\b/.test(text)) {
    return 'DECIDE';
  }

  if (/bina|buat|cipta|reka|design|build|create|architecture|architect|sistem/.test(text)) {
    return 'DESIGN';
  }

  return 'DUMP';
}

function getActiveRoute(suggested, override) {
  return getRouteConfig(override) ? String(override).toUpperCase() : suggested;
}

function canPrepareHandoff(state) {
  return Boolean(
    String(state && state.draft || '').trim() &&
    SUPPORTED_PROVIDERS.includes(state && state.provider) &&
    getRouteConfig(state && state.route)
  );
}

function createHandoffPreview(state) {
  if (!canPrepareHandoff(state)) {
    return null;
  }

  const routeConfig = getRouteConfig(state.route);
  return {
    provider: state.provider,
    route: routeConfig.route,
    method: routeConfig.method,
    methodGatewayUrl: routeConfig.methodGatewayUrl,
    draft: String(state.draft).trim()
  };
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

function readRoutingState(storage) {
  return {
    draft: storage.getItem(FRONT_DOOR_DRAFT_KEY) || '',
    provider: storage.getItem(FRONT_DOOR_PROVIDER_KEY) || '',
    routeOverride: storage.getItem(FRONT_DOOR_ROUTE_OVERRIDE_KEY) || ''
  };
}

function writeRoutingState(storage, state) {
  storage.setItem(FRONT_DOOR_DRAFT_KEY, state.draft);
  storage.setItem(FRONT_DOOR_PROVIDER_KEY, state.provider);

  if (state.routeOverride) {
    storage.setItem(FRONT_DOOR_ROUTE_OVERRIDE_KEY, state.routeOverride);
  } else {
    storage.removeItem(FRONT_DOOR_ROUTE_OVERRIDE_KEY);
  }
}

function getRoutingElements() {
  return {
    draft: document.getElementById('draft'),
    provider: document.getElementById('provider'),
    routeOverride: document.getElementById('routeOverride'),
    suggestedRoute: document.getElementById('suggestedRoute'),
    activeRoute: document.getElementById('activeRoute'),
    prepareHandoff: document.getElementById('prepareHandoff'),
    handoffPreview: document.getElementById('handoffPreview'),
    previewProvider: document.getElementById('previewProvider'),
    previewRoute: document.getElementById('previewRoute'),
    previewMethod: document.getElementById('previewMethod'),
    previewGateway: document.getElementById('previewGateway'),
    previewDraft: document.getElementById('previewDraft')
  };
}

function renderRoutingState(state) {
  const elements = getRoutingElements();
  const suggested = suggestRoute(state.draft);
  const active = getActiveRoute(suggested, state.routeOverride);
  const nextState = {
    draft: state.draft,
    provider: state.provider,
    routeOverride: getRouteConfig(state.routeOverride) ? state.routeOverride : ''
  };

  elements.suggestedRoute.textContent = suggested;
  elements.activeRoute.textContent = active;
  elements.prepareHandoff.disabled = !canPrepareHandoff({
    draft: nextState.draft,
    provider: nextState.provider,
    route: active
  });
  return { state: nextState, suggested, active };
}

function renderHandoffPreview(preview) {
  const elements = getRoutingElements();
  elements.previewProvider.textContent = preview.provider;
  elements.previewRoute.textContent = preview.route;
  elements.previewMethod.textContent = preview.method;
  elements.previewGateway.textContent = preview.methodGatewayUrl;
  elements.previewGateway.href = preview.methodGatewayUrl;
  elements.previewDraft.textContent = preview.draft;
  elements.handoffPreview.hidden = false;
}

function handleRoutingChange() {
  const elements = getRoutingElements();
  const state = {
    draft: elements.draft.value,
    provider: elements.provider.value,
    routeOverride: elements.routeOverride.value
  };
  writeRoutingState(sessionStorage, state);
  renderRoutingState(state);
}

function handlePrepareHandoff() {
  const elements = getRoutingElements();
  const rendered = renderRoutingState({
    draft: elements.draft.value,
    provider: elements.provider.value,
    routeOverride: elements.routeOverride.value
  });
  const preview = createHandoffPreview({
    draft: rendered.state.draft,
    provider: rendered.state.provider,
    route: rendered.active
  });

  if (preview) {
    renderHandoffPreview(preview);
  }
}

function handleSignIn() {
  window.open(getProtectedSignInUrl(), '_blank', 'noopener');

  const status = document.getElementById('status');
  status.textContent = 'Sign-in opened in a new tab. Complete Google sign-in, return here, then press CONTINUE.';
  status.className = '';
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
    const elements = getRoutingElements();
    const state = readRoutingState(sessionStorage);
    elements.draft.value = state.draft;
    elements.provider.value = SUPPORTED_PROVIDERS.includes(state.provider) ? state.provider : '';
    elements.routeOverride.value = getRouteConfig(state.routeOverride) ? state.routeOverride : '';
    renderRoutingState({
      draft: elements.draft.value,
      provider: elements.provider.value,
      routeOverride: elements.routeOverride.value
    });
  } catch (error) {
    setFrontDoorError('The front door could not read the pending ASC request: ' + error.message);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('signIn').addEventListener('click', handleSignIn);
    document.getElementById('continue').addEventListener('click', handleContinue);
    document.getElementById('draft').addEventListener('input', handleRoutingChange);
    document.getElementById('provider').addEventListener('change', handleRoutingChange);
    document.getElementById('routeOverride').addEventListener('change', handleRoutingChange);
    document.getElementById('prepareHandoff').addEventListener('click', handlePrepareHandoff);
    bootFrontDoor();
  });
}
