// T-018A — protected project/thread continuation handoff.
//
// This binding exposes only the minimum owner-visible continuity needed to continue
// a known private thread. It does not expose provider memory, full transcripts,
// bearer tokens, arbitrary semantic records, or any new persistence path.

const ASC_DASHBOARD_HANDOFF_ROUTES_ = Object.freeze({
  DUMP: Object.freeze({
    route: 'DUMP',
    method: 'ZASSPILL',
    expectedMethodVersion: '1.0.0',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zasspill/my/'
  }),
  DECIDE: Object.freeze({
    route: 'DECIDE',
    method: 'ZASSELECTION',
    expectedMethodVersion: '0.2.2',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zasselection/my/'
  }),
  DESIGN: Object.freeze({
    route: 'DESIGN',
    method: 'ZASSIMPLE',
    expectedMethodVersion: '0.3.0',
    methodGatewayUrl: 'https://dzuddiyn.github.io/AISYNC/method/zassimple/my/'
  })
});

const ASC_DASHBOARD_HANDOFF_PROVIDERS_ = Object.freeze({
  ChatGPT: 'https://chatgpt.com/',
  Gemini: 'https://gemini.google.com/app',
  Copilot: 'https://copilot.microsoft.com/'
});

function ascDashboardHandoffError_(code, message) {
  return { ok: false, error: { code: code, message: message } };
}

function ascDashboardHandoffOwner_() {
  try {
    return ascIsOwner_(ascAuthorizationContext_());
  } catch (error) {
    return false;
  }
}

function ascDashboardHandoffRoute_(route) {
  return ASC_DASHBOARD_HANDOFF_ROUTES_[String(route || '').toUpperCase()] || null;
}

function ascDashboardMinimumContinuity_(readResult) {
  const record = readResult && readResult.record;
  const semantic = record && record.semantic_record && typeof record.semantic_record === 'object'
    ? record.semantic_record
    : {};
  const continuity = semantic.continuity && typeof semantic.continuity === 'object'
    ? semantic.continuity
    : {};

  const minimum = {};
  if (typeof semantic.title === 'string' && semantic.title.trim()) minimum.title = semantic.title;
  if (continuity.current !== undefined && continuity.current !== null) minimum.current = continuity.current;
  if (continuity.matters !== undefined && continuity.matters !== null) minimum.matters = continuity.matters;
  if (continuity.open !== undefined && continuity.open !== null) minimum.open = continuity.open;
  return minimum;
}

function getDashboardProjectContinuity(projectId) {
  if (!ascDashboardHandoffOwner_()) {
    return ascDashboardHandoffError_('OWNER_REQUIRED', 'Protected project continuity requires the owner session.');
  }
  if (typeof projectId !== 'string' || !projectId.trim()) {
    return ascDashboardHandoffError_('INVALID_PROJECT_ID', 'A project_id string is required.');
  }

  try {
    const projectResult = getDashboardProject(projectId);
    if (!projectResult || projectResult.ok !== true) return projectResult;

    const list = ascZasspillListThreads_(projectId);
    if (!list || list.status !== 'LIST_RESULT' || !Array.isArray(list.threads)) {
      return ascDashboardHandoffError_('CONTINUITY_READ_FAILED', 'Private project threads could not be listed.');
    }

    return {
      ok: true,
      project_id: projectId,
      threads: list.threads.map(function (thread) {
        return {
          thread_id: thread.thread_id,
          revision: thread.revision,
          title: thread.title || '',
          state: thread.state || null,
          current: thread.current == null ? null : thread.current
        };
      })
    };
  } catch (error) {
    return ascDashboardHandoffError_('CONTINUITY_READ_FAILED', 'Private project threads could not be listed.');
  }
}

function prepareDashboardProjectHandoff(input) {
  if (!ascDashboardHandoffOwner_()) {
    return ascDashboardHandoffError_('OWNER_REQUIRED', 'Protected project handoff requires the owner session.');
  }

  const request = input && typeof input === 'object' ? input : {};
  const projectId = typeof request.project_id === 'string' ? request.project_id.trim() : '';
  const threadId = typeof request.thread_id === 'string' ? request.thread_id.trim() : '';
  const provider = typeof request.provider === 'string' ? request.provider.trim() : '';
  const route = ascDashboardHandoffRoute_(request.route);
  const draft = typeof request.draft === 'string' ? request.draft.trim() : '';

  if (!projectId) return ascDashboardHandoffError_('INVALID_PROJECT_ID', 'A project_id string is required.');
  if (!threadId) return ascDashboardHandoffError_('INVALID_THREAD_ID', 'Choose a project thread before preparing a handoff.');
  if (!ASC_DASHBOARD_HANDOFF_PROVIDERS_[provider]) {
    return ascDashboardHandoffError_('INVALID_PROVIDER', 'Choose ChatGPT, Gemini, or Copilot.');
  }
  if (!route) return ascDashboardHandoffError_('INVALID_ROUTE', 'Choose DUMP, DECIDE, or DESIGN.');
  if (!draft || draft.length > 4000) {
    return ascDashboardHandoffError_('INVALID_DRAFT', 'Tell ASC what changed or what you want to do next (1–4000 characters).');
  }

  try {
    const projectResult = getDashboardProject(projectId);
    if (!projectResult || projectResult.ok !== true) return projectResult;

    const read = ascZasspillGetById_(projectId, threadId);
    if (!read || read.status !== 'FOUND') {
      return ascDashboardHandoffError_(
        read && read.status ? read.status : 'THREAD_NOT_FOUND',
        'The selected private thread is not available.'
      );
    }

    const minimum = ascDashboardMinimumContinuity_(read);
    const handoff = ascZasspillCreateMethodHandoff_({
      projectId: projectId,
      threadId: threadId,
      sourceMethod: projectResult.project.source_method || 'ZASSPILL',
      targetMethod: route.method,
      transition: route.route,
      minimumRelevantContinuity: minimum,
      methodLineage: []
    });
    if (!handoff || handoff.status !== 'HANDOFF_CREATED') {
      return ascDashboardHandoffError_('HANDOFF_CREATE_FAILED', 'The project handoff could not be created.');
    }

    const reference = ascZasspillIssueScopedReference_({
      projectId: projectId,
      threadId: threadId,
      revision: read.revision,
      targetProvider: provider,
      targetMethod: route.method,
      handoffId: handoff.handoff.handoff_id,
      ttlSeconds: 600
    });
    if (!reference || reference.status !== 'REFERENCE_ISSUED') {
      return ascDashboardHandoffError_(
        reference && reference.status ? reference.status : 'REFERENCE_ISSUE_FAILED',
        'The scoped continuity reference could not be issued.'
      );
    }

    const bootstrap = ascZasspillBuildScopedTransferBootstrap_({
      threadId: threadId,
      sourceRevision: read.revision,
      targetProvider: provider,
      targetMethod: route.method,
      methodGatewayUrl: route.methodGatewayUrl,
      expectedMethodVersion: route.expectedMethodVersion,
      handoffId: handoff.handoff.handoff_id,
      referenceId: reference.reference_id,
      minimumRelevantContinuity: minimum
    }) + '\nUser request:\n' + draft;

    return {
      ok: true,
      project_id: projectId,
      provider: provider,
      provider_url: ASC_DASHBOARD_HANDOFF_PROVIDERS_[provider],
      route: route.route,
      method: route.method,
      thread_title: minimum.title || '',
      expires_at: reference.expires_at,
      bootstrap: bootstrap
    };
  } catch (error) {
    return ascDashboardHandoffError_('HANDOFF_PREPARE_FAILED', 'The protected project handoff could not be prepared.');
  }
}
