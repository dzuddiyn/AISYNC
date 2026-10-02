import { runGitHubAdapter } from './github-adapter.mjs';
import { createGitHubRestClient } from './github-rest-client.mjs';

const repository = 'dzuddiyn/AISYNC';
const branch = 'main';
const path = 'proofs/t006b-github-adapter-live.md';
const content = '# T-006B GitHub Adapter Live Proof\n\nThis file was created by the controlled T-006B GitHub adapter live proof.\n';
const commitMessage = 'add T-006B controlled GitHub adapter proof';
const token = process.env.GITHUB_TOKEN;

if (process.env.T006B_LIVE !== 'YES' || typeof token !== 'string' || token.length === 0) {
  console.log('T-006B live proof not run. Set T006B_LIVE=YES and GITHUB_TOKEN to enable the controlled proof.');
} else {
  const invocation = {
    destination: 'GitHub',
    adapterId: 'github',
    contract: {
      Project: 'AISYNC',
      'Source method': 'ZASSIMPLE',
      Operation: 'SAVE',
      'Record type': 'proof',
      'Record ID': 'T-006B',
      'Content/change': content,
      Lineage: ['T-005', 'T-006A'],
      Destination: ['GitHub']
    }
  };
  const writeSpec = { repository, path, branch, content, commitMessage };
  const githubClient = createGitHubRestClient({ token });
  const result = await runGitHubAdapter(invocation, writeSpec, githubClient);

  console.log(JSON.stringify({
    outcome: result.outcome,
    repository: result.repository,
    path: result.path,
    branch: result.branch,
    writePerformed: result.writePerformed,
    commitSha: result.commitSha || null,
    contentSha: result.contentSha || null,
    persistedSha: result.persistedSha || null,
    verified: result.verified
  }, null, 2));
}
