import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
const served = [];
const output = {
  setTitle() { return this; },
  setXFrameOptionsMode() { return this; }
};
const context = {
  HtmlService: {
    createTemplateFromFile(name) {
      served.push(name);
      return { evaluate: () => output };
    },
    XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }
  },
  Session: {
    getActiveUser: () => ({ getEmail: () => 'beta@example.test' }),
    getEffectiveUser: () => ({ getEmail: () => 'owner@example.test' })
  },
  ascBetaAuthorizationContext_: () => ({
    betaAuthorized: true,
    betaParticipantId: 'bp_test',
    betaAllowedProjects: ['AISYNC'],
    activeUser: '',
    effectiveUser: ''
  }),
  ascIsBetaActor_: () => true,
  ascIsOwner_: () => false
};
vm.createContext(context);
vm.runInContext(code, context);

context.doGet({ parameter: { view: 'crossai-auth' } });
context.doGet({ parameter: { view: 'crossai-start' } });
context.doGet({ parameter: { view: 'dashboard' } });
context.doGet({ parameter: { view: 'beta-enroll', invite: 'token' } });

assert.deepEqual(served, ['CrossAiAuth', 'CrossAiStart', 'Dashboard', 'BetaEnroll']);

const enrollTemplate = {
  values: {},
  evaluate: () => output
};
const served2 = [];
context.HtmlService.createTemplateFromFile = (name) => {
  served2.push(name);
  return new Proxy(enrollTemplate, {
    set(target, prop, value) {
      target.values[prop] = value;
      target[prop] = value;
      return true;
    }
  });
};
context.doGet({ parameter: { view: 'beta-enroll', invite: 'abc' } });
assert.equal(enrollTemplate.crossAiUrl, 'https://dzuddiyn.github.io/AISYNC/asc/');

console.log('CrossAI Apps Script route binding test: PASS');
console.log('beta enrollment -> public CrossAI landing: PASS');
