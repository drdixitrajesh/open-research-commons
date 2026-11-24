const cookieName = '__Host-repository_session';
const canonicalOrigin = 'https://conference.softinator.org';
const minute = 60;
const hour = 60 * minute;
const day = 24 * hour;
const challengeLifetime = 10 * minute;
const sessionLifetime = 30 * day;
const attemptLimit = 5;
const encoding = new TextEncoder();
const accountColumns = 'id, email, name, legacy_owner_id, profile_completed, mobile_ciphertext IS NOT NULL AS has_mobile';
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const epoch = () => Math.floor(Date.now() / 1000);

export class EmailAuthError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const authUnavailable = () => new EmailAuthError(503, 'auth_unavailable', 'Email sign-in is temporarily unavailable.');
const invalidCode = () => new EmailAuthError(400, 'invalid_code', 'The code is incorrect or expired.');
const linkUnavailable = () => new EmailAuthError(403, 'link_unavailable', 'Sign in to your previous account and verify its email to link it.');
const signInRequired = () => new EmailAuthError(401, 'sign_in_required', 'Sign in to continue.');

function authStorageEnabled(env) {
  return Boolean(env.DB && typeof env.AUTH_SECRET === 'string' && encoding.encode(env.AUTH_SECRET).length >= 32);
}

export function emailAuthEnabled(env) {
  return authStorageEnabled(env) && typeof env.AUTH_EMAIL_FROM === 'string' &&
    typeof env.AUTH_RESEND_API_KEY === 'string' && Boolean(env.AUTH_EMAIL_FROM.trim() && env.AUTH_RESEND_API_KEY.trim());
}

export function normalizedEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  const [local, domain, extra] = email.split('@');
  if (extra !== undefined || !domain || !local || local.length > 64 || email.length > 254 ||
      !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) || local.startsWith('.') ||
      local.endsWith('.') || local.includes('..')) return '';
  const labels = domain.split('.');
  if (labels.length < 2 || !labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return '';
  return email;
}

function normalizedMobile(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || value.length > 40) {
    throw new EmailAuthError(400, 'invalid_mobile', 'Enter a mobile number with a country calling code.');
  }
  const mobile = value.trim().replace(/[ .()-]/g, '');
  if (!mobile && !value.trim()) return '';
  if (!/^\+[1-9]\d{6,14}$/.test(mobile)) {
    throw new EmailAuthError(400, 'invalid_mobile', 'Enter a mobile number with a country calling code.');
  }
  return mobile;
}

const sha256 = value => crypto.subtle.digest('SHA-256', encoding.encode(value)).then(hex);

export async function hmac(secret, scope, value) {
  const key = await crypto.subtle.importKey('raw', encoding.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoding.encode(scope + '\0' + value)));
}

async function encryptMobile(secret, accountId, mobile) {
  const keyMaterial = await hmac(secret, 'email-auth:mobile-key', accountId);
  const key = await crypto.subtle.importKey(
    'raw', Uint8Array.from(keyMaterial.match(/../g), byte => Number.parseInt(byte, 16)), 'AES-GCM', false, ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoding.encode(accountId) }, key, encoding.encode(mobile)
  );
  return `v1.${hex(iv)}.${hex(ciphertext)}`;
}

function generateCode() {
  const random = new Uint32Array(1);
  do crypto.getRandomValues(random);
  while (random[0] >= 4_294_000_000);
  return String(random[0] % 1_000_000).padStart(6, '0');
}

function publicUser(account) {
  const user = {
    id: account.id,
    email: account.email,
    name: account.name,
    needsProfile: account.profile_completed === 0,
    hasMobile: account.has_mobile === 1,
  };
  if (account.legacy_owner_id) user.secondaryOwnerId = account.legacy_owner_id;
  return user;
}

function readToken(request) {
  const cookies = (request.headers.get('Cookie') || '').split(';');
  const raw = cookies.map(cookie => cookie.trim()).find(cookie => cookie.startsWith(cookieName + '='));
  const token = raw?.slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(token || '') ? token : '';
}

function sessionCookie(token, maxAge) {
  return `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function respond(data, cookie) {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (cookie) headers['Set-Cookie'] = cookie;
  return Response.json(data, { headers });
}

export async function emailSession(request, env) {
  if (!authStorageEnabled(env)) return null;
  const token = readToken(request);
  if (!token) return null;
  const account = await env.DB.prepare(
    'SELECT a.id, a.email, a.name, a.legacy_owner_id, a.profile_completed, a.mobile_ciphertext IS NOT NULL AS has_mobile FROM auth_accounts a ' +
    'JOIN auth_sessions s ON s.account_id = a.id WHERE s.session_hash = ? AND s.expires_at > ?'
  ).bind(await sha256(token), epoch()).first();
  return account ? publicUser(account) : null;
}

export async function linkedLegacyUser(env, legacyUser) {
  if (!legacyUser || !authStorageEnabled(env)) return legacyUser;
  const account = await env.DB.prepare(
    'SELECT ' + accountColumns + ' FROM auth_accounts WHERE legacy_owner_id = ?'
  ).bind(legacyUser.id).first();
  return account ? publicUser(account) : legacyUser;
}

async function reserveSend(request, env, email, now) {
  const address = await hmac(env.AUTH_SECRET, 'email-auth:email-limit', email);
  // Use the edge-supplied address. Client-provided forwarding headers cannot choose a new rate limit.
  const ip = request.headers.get('CF-Connecting-IP');
  const limits = [
    ['email-minute', address, minute, 1],
    ['email-hour', address, hour, 5],
    ['global-hour', 'global', hour, 40],
    ['global-day', 'global', day, 80],
  ];
  if (ip && ip.length <= 64 && /^[0-9a-f.:]+$/i.test(ip)) {
    limits.push(['ip-hour', await hmac(env.AUTH_SECRET, 'email-auth:ip-limit', ip), hour, 20]);
  }
  if (!(await reserveRateLimits(env.DB, now, limits))) {
    throw new EmailAuthError(429, 'rate_limited', 'Please wait before requesting another code.');
  }
}

export async function reserveRateLimits(db, now, limits) {
  const values = limits.flatMap(([scope, identifier, period, quota]) =>
    [scope, identifier, (Math.floor(now / period) + 1) * period, quota]);
  const placeholders = limits.map(() => '(?, ?, ?, ?)').join(', ');
  const { results } = await db.prepare(`
    WITH requested(scope, identifier, reset_at, quota) AS MATERIALIZED (VALUES ${placeholders}),
    allowed(ok) AS MATERIALIZED (
      SELECT NOT EXISTS (
        SELECT 1 FROM requested q JOIN auth_rate_limits a
          ON a.scope = q.scope AND a.identifier = q.identifier AND a.reset_at = q.reset_at
        WHERE a.request_count >= q.quota
      )
    )
    INSERT INTO auth_rate_limits (scope, identifier, reset_at, request_count)
    SELECT scope, identifier, reset_at, 1 FROM requested WHERE (SELECT ok FROM allowed)
    ON CONFLICT (scope, identifier, reset_at) DO UPDATE SET request_count = request_count + 1
    RETURNING scope
  `).bind(...values).all();
  return results.length > 0;
}

async function sendCode(env, email, challenge, code) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.AUTH_RESEND_API_KEY.trim(),
        'Content-Type': 'application/json',
        'Idempotency-Key': 'repository-auth/' + challenge,
      },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from: env.AUTH_EMAIL_FROM.trim(),
        to: [email],
        subject: 'Your repository sign-in code',
        text: `Your Global Conference & Research Repository sign-in code is ${code}.\n\nIt expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      }),
    });
    await response.body?.cancel().catch(() => {});
    if (!response.ok) throw authUnavailable();
  } catch {
    throw authUnavailable();
  }
}

async function start(request, env, input, legacyUser) {
  if (!emailAuthEnabled(env)) throw authUnavailable();
  const email = normalizedEmail(input.email);
  if (!email) throw new EmailAuthError(400, 'invalid_email', 'Enter a valid email address.');
  const linking = input.link === true;
  if (linking && (!legacyUser?.id || normalizedEmail(legacyUser.email) !== email)) throw linkUnavailable();
  const now = epoch();
  await reserveSend(request, env, email, now);
  const challenge = crypto.randomUUID();
  const code = generateCode();
  const digest = await hmac(env.AUTH_SECRET, 'email-auth:otp', challenge + '\0' + code);
  const db = env.DB;
  await db.batch([
    db.prepare('DELETE FROM auth_challenges WHERE expires_at <= ?').bind(now),
    db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').bind(now),
    db.prepare('DELETE FROM auth_rate_limits WHERE reset_at <= ?').bind(now),
    db.prepare(`INSERT INTO auth_challenges (id, email, legacy_owner_id, code_hash, expires_at)
      VALUES (?, ?, ?, ?, ?)`).bind(challenge, email, linking ? legacyUser.id : null, digest, now + challengeLifetime),
  ]);
  try {
    await sendCode(env, email, challenge, code);
  } catch (error) {
    await db.prepare('DELETE FROM auth_challenges WHERE id = ?').bind(challenge).run();
    throw error;
  }
  return respond({ challenge, resendAfter: minute });
}

async function verify(request, env, input, legacyUser) {
  const { challenge, code } = input;
  if (typeof challenge !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(challenge) ||
      typeof code !== 'string' || !/^\d{6}$/.test(code)) throw invalidCode();
  const now = epoch();
  const digest = await hmac(env.AUTH_SECRET, 'email-auth:otp', challenge + '\0' + code);
  const db = env.DB;
  // A single database statement increments the guess counter and consumes a correct code exactly once.
  const issued = await db.prepare(`
    UPDATE auth_challenges SET attempts = attempts + 1,
      consumed_at = CASE WHEN code_hash = ? THEN ? ELSE NULL END
    WHERE id = ? AND expires_at > ? AND attempts < ? AND consumed_at IS NULL
      AND (legacy_owner_id IS NULL OR (legacy_owner_id = ? AND email = ?))
    RETURNING email, legacy_owner_id, consumed_at
  `).bind(digest, now, challenge, now, attemptLimit, legacyUser?.id || '', normalizedEmail(legacyUser?.email)).first();
  if (!issued?.consumed_at) throw invalidCode();

  const legacyId = issued.legacy_owner_id;
  const email = issued.email;
  const name = legacyId ? String(legacyUser.name || email).trim().slice(0, 160) || email : email;
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const previousToken = readToken(request);
  const sessionHash = await sha256(token);
  const previousHash = previousToken ? await sha256(previousToken) : '';
  const statements = [
    db.prepare(`
      INSERT INTO auth_accounts (id, email, name, legacy_owner_id, created_at)
      SELECT ?, ?, ?, ?, ? WHERE ? IS NULL OR NOT EXISTS (
        SELECT 1 FROM auth_accounts WHERE legacy_owner_id = ? AND email <> ?
      )
      ON CONFLICT (email) DO UPDATE SET legacy_owner_id = excluded.legacy_owner_id
      WHERE excluded.legacy_owner_id IS NOT NULL AND
        (auth_accounts.legacy_owner_id IS NULL OR auth_accounts.legacy_owner_id = excluded.legacy_owner_id)
    `).bind('email:' + crypto.randomUUID(), email, name, legacyId, now, legacyId, legacyId, email),
    db.prepare(`
      INSERT INTO auth_sessions (session_hash, account_id, expires_at)
      SELECT ?, id, ? FROM auth_accounts
      WHERE email = ? AND (? IS NULL OR legacy_owner_id = ?)
    `).bind(sessionHash, now + sessionLifetime, email, legacyId, legacyId),
    db.prepare('DELETE FROM auth_sessions WHERE session_hash = ? AND EXISTS (SELECT 1 FROM auth_sessions WHERE session_hash = ?)').bind(previousHash, sessionHash),
    db.prepare(`
      SELECT ${accountColumns} FROM auth_accounts
      WHERE email = ? AND (? IS NULL OR legacy_owner_id = ?)
    `).bind(email, legacyId, legacyId),
  ];
  const writes = await db.batch(statements);
  const account = writes.at(-1).results[0];
  if (!account) throw linkUnavailable();
  return respond({ user: publicUser(account) }, sessionCookie(token, sessionLifetime));
}

async function saveProfile(request, env, input) {
  const user = await emailSession(request, env);
  if (!user) throw signInRequired();
  if (!user.needsProfile && !Object.hasOwn(input, 'mobile')) return respond({ user });
  const mobile = normalizedMobile(input.mobile);
  const encrypted = mobile ? await encryptMobile(env.AUTH_SECRET, user.id, mobile) : null;
  await env.DB.prepare('UPDATE auth_accounts SET profile_completed = 1, mobile_ciphertext = ? WHERE id = ?')
    .bind(encrypted, user.id).run();
  return respond({ user: { ...user, needsProfile: false, hasMobile: Boolean(mobile) } });
}

async function logout(request, env) {
  const token = readToken(request);
  if (token && env.DB) await env.DB.prepare('DELETE FROM auth_sessions WHERE session_hash = ?').bind(await sha256(token)).run();
  return respond({ ok: true }, sessionCookie('', 0));
}

function enforceOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const configured = typeof env.SITE_PUBLIC_URL === 'string' && URL.canParse(env.SITE_PUBLIC_URL)
    ? new URL(env.SITE_PUBLIC_URL).origin : canonicalOrigin;
  if (request.method !== 'POST') throw new EmailAuthError(405, 'method_not_allowed', 'Use a POST request.');
  if (!origin || (origin !== new URL(request.url).origin && origin !== configured)) {
    throw new EmailAuthError(403, 'origin_denied', 'Open the repository to sign in.');
  }
}

export async function handleEmailAuth(request, env, action, input = {}, legacyUser = null) {
  enforceOrigin(request, env);
  if (action === 'logout') return logout(request, env);
  if (!authStorageEnabled(env)) throw authUnavailable();
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new EmailAuthError(400, 'bad_request', 'Send a JSON object.');
  }
  if (action === 'start') return start(request, env, input, legacyUser);
  if (action === 'verify') return verify(request, env, input, legacyUser);
  if (action === 'profile') return saveProfile(request, env, input);
  throw new EmailAuthError(404, 'not_found', 'This action could not be found.');
}
