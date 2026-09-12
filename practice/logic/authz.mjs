/** Recruiting-app authorization desk (browser demonstration only). */

export const CHALLENGE_ID = 'recruiting-authz';
export const CHALLENGE_VERSION = '2026.09.10';

export const ACTORS = {
  guest: { id: 'guest', role: 'guest', zh: '访客', en: 'Guest' },
  'candidate-a': {
    id: 'candidate-a',
    role: 'candidate',
    zh: '候选人 A',
    en: 'Candidate A',
  },
  'candidate-b': {
    id: 'candidate-b',
    role: 'candidate',
    zh: '候选人 B',
    en: 'Candidate B',
  },
  'employer-owner': {
    id: 'employer-owner',
    role: 'employer',
    zh: '职位所属雇主',
    en: 'Employer who owns the job',
  },
  'employer-other': {
    id: 'employer-other',
    role: 'employer',
    zh: '其他雇主',
    en: 'Other employer',
  },
};

export const ACTOR_IDS = Object.keys(ACTORS);

export const ACTIONS = {
  viewPublicJob: {
    id: 'viewPublicJob',
    zh: '查看公开职位',
    en: 'View public job',
    resourceIds: ['publicJob'],
  },
  viewApplication: {
    id: 'viewApplication',
    zh: '查看私有申请',
    en: 'View private application',
    resourceIds: ['applicationA', 'applicationB'],
  },
  updateJob: {
    id: 'updateJob',
    zh: '更新该职位',
    en: 'Update this job',
    resourceIds: ['publicJob'],
  },
};

export const ACTION_IDS = Object.keys(ACTIONS);

export const RESOURCES = {
  publicJob: {
    id: 'publicJob',
    kind: 'job',
    visibility: 'public',
    ownerId: 'employer-owner',
    zh: '公开职位：温室技术员',
    en: 'Public job: greenhouse technician',
  },
  applicationA: {
    id: 'applicationA',
    kind: 'application',
    visibility: 'private',
    candidateId: 'candidate-a',
    jobOwnerId: 'employer-owner',
    zh: '候选人 A 的申请',
    en: 'Candidate A’s application',
  },
  applicationB: {
    id: 'applicationB',
    kind: 'application',
    visibility: 'private',
    candidateId: 'candidate-b',
    jobOwnerId: 'employer-owner',
    zh: '候选人 B 的申请',
    en: 'Candidate B’s application',
  },
};

export const RESOURCE_IDS = Object.keys(RESOURCES);

export const POLICY_FIELDS = [
  {
    key: 'publicJobsReadableByAnyone',
    leak: false,
    zh: '允许任何人阅读公开职位（访客和已登录用户）',
    en: 'Anyone may read public jobs (guests and signed-in users)',
  },
  {
    key: 'candidateMayReadOwnApplication',
    leak: false,
    zh: '允许候选人阅读自己的申请',
    en: 'A candidate may read their own application',
  },
  {
    key: 'candidateMayReadAnyApplication',
    leak: true,
    zh: '允许候选人阅读所有申请',
    en: 'A candidate may read every application',
  },
  {
    key: 'employerMayUpdateOwnJob',
    leak: false,
    zh: '允许职位所属雇主更新该职位',
    en: 'The owning employer may update this job',
  },
  {
    key: 'anyEmployerMayUpdateAnyJob',
    leak: true,
    zh: '允许任何雇主更新该职位',
    en: 'Any employer may update this job',
  },
  {
    key: 'employerMayReadOwnJobApplications',
    leak: false,
    zh: '允许职位所属雇主阅读该职位下的申请',
    en: 'The owning employer may read applications to this job',
  },
  {
    key: 'otherEmployersMayReadApplications',
    leak: true,
    zh: '允许其他雇主阅读申请',
    en: 'Other employers may read applications',
  },
  {
    key: 'anyoneMayReadApplications',
    leak: true,
    zh: '允许任何人阅读申请（包括访客）',
    en: 'Anyone may read applications, including guests',
  },
];

export function emptyPolicy() {
  const policy = {};
  for (const field of POLICY_FIELDS) policy[field.key] = false;
  return policy;
}

export function defaultActivityState() {
  return {
    policy: emptyPolicy(),
    actorId: 'guest',
    actionId: 'viewPublicJob',
    resourceId: 'publicJob',
    prediction: 'deny',
    lastTrial: null,
    lastEvaluation: null,
    reflection: '',
  };
}

function decide(allowed, code, zh, en) {
  return { allowed, code, zh, en };
}

export function normalizePolicy(input) {
  const policy = emptyPolicy();
  if (!input || typeof input !== 'object') return policy;
  for (const field of POLICY_FIELDS) {
    policy[field.key] = input[field.key] === true;
  }
  return policy;
}

export function authorize(actorId, actionId, resourceId, policyInput) {
  const actor = ACTORS[actorId];
  const action = ACTIONS[actionId];
  const resource = RESOURCES[resourceId];
  const policy = normalizePolicy(policyInput);

  if (!actor || !action || !resource) {
    return decide(false, 'invalid', '请求无效。', 'The request is invalid.');
  }

  if (!action.resourceIds.includes(resourceId)) {
    return decide(
      false,
      'mismatch',
      '该动作不能作用在这个对象上。',
      'This action does not apply to that resource.',
    );
  }

  if (actionId === 'viewPublicJob') {
    if (resource.kind !== 'job' || resource.visibility !== 'public') {
      return decide(false, 'not-public-job', '这不是公开职位。', 'This is not a public job.');
    }
    if (policy.publicJobsReadableByAnyone) {
      return decide(true, 'public-job', '公开职位可阅读。', 'The public job may be read.');
    }
    return decide(
      false,
      'deny-default',
      '默认拒绝：没有允许阅读公开职位的规则。',
      'Deny by default: no rule allows reading public jobs.',
    );
  }

  if (actionId === 'viewApplication') {
    if (resource.kind !== 'application') {
      return decide(false, 'not-application', '这不是申请。', 'This is not an application.');
    }
    if (policy.anyoneMayReadApplications) {
      return decide(
        true,
        'leak-anyone-application',
        '当前规则把申请开放给了任何人。',
        'The current rule opens applications to anyone.',
      );
    }
    if (actor.role === 'candidate' && actor.id === resource.candidateId && policy.candidateMayReadOwnApplication) {
      return decide(
        true,
        'own-application',
        '候选人可阅读自己的申请。',
        'A candidate may read their own application.',
      );
    }
    if (actor.role === 'candidate' && policy.candidateMayReadAnyApplication) {
      return decide(
        true,
        'leak-any-candidate',
        '当前规则允许候选人阅读他人申请。',
        'The current rule lets a candidate read someone else’s application.',
      );
    }
    if (
      actor.role === 'employer' &&
      actor.id === resource.jobOwnerId &&
      policy.employerMayReadOwnJobApplications
    ) {
      return decide(
        true,
        'employer-own-applications',
        '职位所属雇主可阅读该职位下的申请。',
        'The owning employer may read applications to this job.',
      );
    }
    if (
      actor.role === 'employer' &&
      actor.id !== resource.jobOwnerId &&
      policy.otherEmployersMayReadApplications
    ) {
      return decide(
        true,
        'leak-other-employer',
        '当前规则允许其他雇主阅读申请。',
        'The current rule lets another employer read applications.',
      );
    }
    return decide(
      false,
      'deny-private',
      '默认拒绝：申请是私有数据。',
      'Deny by default: the application is private.',
    );
  }

  if (actionId === 'updateJob') {
    if (resource.kind !== 'job') {
      return decide(false, 'not-job', '这不是职位。', 'This is not a job.');
    }
    if (actor.role === 'employer' && actor.id === resource.ownerId && policy.employerMayUpdateOwnJob) {
      return decide(
        true,
        'owner-update',
        '职位所属雇主可更新该职位。',
        'The owning employer may update this job.',
      );
    }
    if (actor.role === 'employer' && policy.anyEmployerMayUpdateAnyJob) {
      return decide(
        true,
        'leak-any-employer-update',
        '当前规则允许其他雇主改这个职位。',
        'The current rule lets another employer change this job.',
      );
    }
    return decide(
      false,
      'deny-default',
      '默认拒绝：不能更新该职位。',
      'Deny by default: job update is not allowed.',
    );
  }

  return decide(false, 'deny-default', '默认拒绝。', 'Deny by default.');
}

export function runTrial({ actorId, actionId, resourceId, policy, prediction }) {
  const result = authorize(actorId, actionId, resourceId, policy);
  const expected = result.allowed ? 'allow' : 'deny';
  const guessed = prediction === 'allow' || prediction === 'deny' ? prediction : null;
  return {
    actorId,
    actionId,
    resourceId,
    allowed: result.allowed,
    code: result.code,
    zh: result.zh,
    en: result.en,
    prediction: guessed,
    predictedCorrect: guessed != null && guessed === expected,
  };
}

export const REQUIRED_CHECKS = [
  {
    id: 'guest-view-public-job',
    actorId: 'guest',
    actionId: 'viewPublicJob',
    resourceId: 'publicJob',
    expect: 'allow',
    explainZh: '公开职位列表应对访客可见，否则招聘台无法被浏览。',
    explainEn: 'Guests should be able to read the public job listing, or the board cannot be browsed.',
  },
  {
    id: 'signed-in-view-public-job',
    actorId: 'candidate-a',
    actionId: 'viewPublicJob',
    resourceId: 'publicJob',
    expect: 'allow',
    explainZh: '已登录用户同样应能阅读公开职位；不要只给访客开放。',
    explainEn: 'Signed-in users should also read public jobs; do not allow guests only.',
  },
  {
    id: 'guest-view-application',
    actorId: 'guest',
    actionId: 'viewApplication',
    resourceId: 'applicationA',
    expect: 'deny',
    explainZh: '申请是私有数据。访客即使猜到地址也不能阅读。',
    explainEn: 'Applications are private. A guest must not read them even with a guessed URL.',
  },
  {
    id: 'candidate-own-application',
    actorId: 'candidate-a',
    actionId: 'viewApplication',
    resourceId: 'applicationA',
    expect: 'allow',
    explainZh: '候选人应能查看自己提交的申请。',
    explainEn: 'A candidate should be able to read their own application.',
  },
  {
    id: 'candidate-other-application',
    actorId: 'candidate-a',
    actionId: 'viewApplication',
    resourceId: 'applicationB',
    expect: 'deny',
    explainZh: '候选人 A 不能阅读候选人 B 的申请。',
    explainEn: 'Candidate A must not read candidate B’s application.',
  },
  {
    id: 'candidate-b-own-application',
    actorId: 'candidate-b',
    actionId: 'viewApplication',
    resourceId: 'applicationB',
    expect: 'allow',
    explainZh: '候选人 B 应能查看自己的申请，说明规则按“本人”而不是按“所有候选人”生效。',
    explainEn: 'Candidate B should read their own application: the rule is ownership, not “any candidate”.',
  },
  {
    id: 'candidate-update-job',
    actorId: 'candidate-a',
    actionId: 'updateJob',
    resourceId: 'publicJob',
    expect: 'deny',
    explainZh: '候选人不能修改雇主的职位。',
    explainEn: 'A candidate must not update the employer’s job.',
  },
  {
    id: 'owner-update-job',
    actorId: 'employer-owner',
    actionId: 'updateJob',
    resourceId: 'publicJob',
    expect: 'allow',
    explainZh: '职位所属雇主应能更新自己的职位。',
    explainEn: 'The owning employer should be able to update this job.',
  },
  {
    id: 'other-employer-update-job',
    actorId: 'employer-other',
    actionId: 'updateJob',
    resourceId: 'publicJob',
    expect: 'deny',
    explainZh: '其他雇主不能改不属于自己的职位。',
    explainEn: 'Another employer must not change a job they do not own.',
  },
  {
    id: 'owner-view-application',
    actorId: 'employer-owner',
    actionId: 'viewApplication',
    resourceId: 'applicationA',
    expect: 'allow',
    explainZh: '职位所属雇主需要阅读该职位收到的申请。',
    explainEn: 'The owning employer needs to read applications to that job.',
  },
  {
    id: 'other-employer-view-application',
    actorId: 'employer-other',
    actionId: 'viewApplication',
    resourceId: 'applicationA',
    expect: 'deny',
    explainZh: '其他雇主不能阅读别人职位下的申请。',
    explainEn: 'Another employer must not read applications to someone else’s job.',
  },
  {
    id: 'guest-update-job',
    actorId: 'guest',
    actionId: 'updateJob',
    resourceId: 'publicJob',
    expect: 'deny',
    explainZh: '访客不能更新职位。未列出的动作应默认拒绝。',
    explainEn: 'A guest must not update a job. Unlisted actions stay denied.',
  },
];

export function evaluatePolicy(policyInput) {
  const policy = normalizePolicy(policyInput);
  const results = REQUIRED_CHECKS.map((check) => {
    const got = authorize(check.actorId, check.actionId, check.resourceId, policy);
    const expectedAllow = check.expect === 'allow';
    const pass = got.allowed === expectedAllow;
    return {
      id: check.id,
      pass,
      expected: check.expect,
      actual: got.allowed ? 'allow' : 'deny',
      code: got.code,
      actorId: check.actorId,
      actionId: check.actionId,
      resourceId: check.resourceId,
      explainZh: check.explainZh,
      explainEn: check.explainEn,
      gotZh: got.zh,
      gotEn: got.en,
    };
  });
  return {
    passed: results.every((row) => row.pass),
    results,
    firstFailure: results.find((row) => !row.pass) || null,
  };
}

export function policyConfigSnapshot(policyInput) {
  const policy = normalizePolicy(policyInput);
  return { ...policy };
}
