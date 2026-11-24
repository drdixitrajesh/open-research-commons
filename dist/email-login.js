import { api, breadcrumb, esc, go, icon, link, signIn, state, t, txt, url } from './app.js';

const signInErrors = {
  invalid_email: 'loginInvalidEmail',
  invalid_code: 'loginInvalidCode',
  rate_limited: 'loginRateLimit',
  invalid_mobile: 'loginInvalidMobile',
  sign_in_required: 'loginLinkUnavailable',
  link_unavailable: 'loginLinkUnavailable',
};

const post = (action, data = {}) => api('auth/' + action, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

function returnDestination() {
  const path = new URLSearchParams(location.search).get('return_to');
  if (!path?.startsWith('/') || path.startsWith('//')) return url('account');
  try {
    const target = new URL(path,location.origin);
    const view = target.searchParams.get('view');
    if (target.origin === location.origin && target.pathname === '/' && !target.hash &&
        !target.searchParams.has('record') && ['submit','review','event-registration'].includes(view)) return target;
  } catch {}
  return url('account');
}

export function contributorSignIn({label = 'loginButton',className = 'button'} = {}) {
  if (!state.session.emailAuth) return signIn({label:label === 'loginButton' ? 'signIn' : label,className});
  return link('account',label,`class="${esc(className)}"`,{
    return_to: location.pathname + location.search,
  });
}

function emailForm(email = '', linking = false) {
  return `<form class="login-form" data-login-form="start">
    <label class="field">${t('loginEmail')}
      <input type="email" name="email" maxlength="254" autocomplete="email" inputmode="email" dir="ltr"
        value="${esc(email)}" aria-describedby="login-email-privacy"${linking ? ' readonly' : ''} required>
    </label>
    <p class="login-provider" id="login-email-privacy">${t('loginEmailPrivacy')}</p>
    <button type="submit" class="button">${t('loginSend')}</button>
  </form>`;
}

function codeForm(email, linking) {
  return `<form class="login-form" data-login-form="verify">
    <p class="login-identity">${t('loginCodeSent')} <bdi>${esc(email)}</bdi></p>
    <label class="field">${t('loginCode')}
      <input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" dir="ltr" required>
    </label>
    <button type="submit" class="button">${t('loginVerify')}</button>
    <div class="login-switch">
      <button type="button" class="text-button" data-resend-code disabled>${t('loginResend')}</button>
      ${linking ? '' : `<button type="button" class="text-button" data-change-email>${t('loginChangeEmail')}</button>`}
    </div>
  </form>`;
}

function mobileField(label, required = false) {
  return `<label class="field">${t(label)}
      <input type="tel" name="mobile" autocomplete="tel" maxlength="40" dir="ltr"
        aria-describedby="login-mobile-privacy"${required ? ' required' : ''}>
    </label>
    <p class="login-provider" id="login-mobile-privacy">${t('loginMobilePrivacy')}</p>`;
}

function mobileForm() {
  return `<form class="login-form" data-login-form="profile">
    ${mobileField('loginMobile')}
    <div class="login-actions">
      <button type="submit" class="button">${t('loginContinue')}</button>
      <button type="button" class="text-button" data-skip-profile>${t('skip')}</button>
    </div>
  </form>`;
}

function loginPage(name, {title, summary, content, mode, includeLegacy = false}) {
  return `<section class="wrap page login-page">${breadcrumb(name)}
    <article class="login-panel" aria-labelledby="login-heading">
      <span class="login-symbol" aria-hidden="true">${icon('user',24)}</span>
      <h1 id="login-heading">${t(title)}</h1>
      <p class="login-summary"${summary ? '' : ' hidden'}>${summary ? t(summary) : ''}</p>
      <div data-login-stage="${mode}">${content}</div>
      <p data-login-status role="status" class="login-provider"></p>
      <p data-login-feedback role="alert" class="form-feedback"></p>
      ${includeLegacy ? `<details class="login-account-link">
        <summary>${t('loginExisting')}</summary>
        <p class="login-provider">${t('loginLinkIntro')}</p>
        ${signIn({className:'button secondary'})}
      </details>` : ''}
    </article>
  </section>`;
}

export function dashboardLogin(name) {
  const { user, emailAuth } = state.session;
  if (user && !emailAuth) return null;
  if (user?.authMethod === 'email' && user.needsProfile) {
    return loginPage(name,{title:'loginProfileTitle',mode:'profile',content:mobileForm()});
  }
  const linking = new URLSearchParams(location.search).get('link_email') === '1';
  if (user?.authMethod === 'chatgpt' && !user.linkedEmail && linking) {
    return loginPage(name,{
      title:'loginLinkTitle',summary:'loginLinkIntro',mode:'link',
      content:emailForm(user.email,true) + `<p class="login-provider">${link('account','account')}</p>`,
    });
  }
  if (user) return null;
  return loginPage(name,{
    title:'loginTitle',summary:'signedOut',mode:emailAuth ? 'email' : 'native',
    content:emailAuth ? emailForm() : `${signIn({label:'loginButton'})}<p class="login-provider">${t('loginNative')}</p>`,
    includeLegacy:Boolean(emailAuth),
  });
}

export function emailLinkAction() {
  const { user, emailAuth } = state.session;
  return emailAuth && user?.authMethod === 'chatgpt' && !user.linkedEmail
    ? link('account','loginLinkAction','class="button secondary"',{link_email:'1'}) : '';
}

export function mobileSettings() {
  const { user, emailAuth } = state.session;
  if (!emailAuth || user?.authMethod !== 'email') return '';
  return `<details class="login-account-link login-mobile-settings">
    <summary>${t('loginManageMobile')}</summary>
    <form class="login-form" data-mobile-settings>
      ${mobileField('loginMobileNumber',true)}
      <div class="login-actions">
        <button type="submit" class="button secondary">${t('loginSaveMobile')}</button>
        <button type="button" class="text-button" data-remove-mobile${user.hasMobile ? '' : ' hidden'}>${t('loginRemoveMobile')}</button>
      </div>
      <p role="status" data-mobile-status class="login-provider"></p>
      <p role="alert" data-mobile-feedback class="form-feedback"></p>
    </form>
  </details>`;
}

export function dashboardSignOut() {
  return state.session.user.authMethod === 'email'
    ? `<button type="button" class="text-button" data-email-logout>${t('signOut')}</button>
      <output class="form-feedback" data-email-logout-feedback role="alert"></output>`
    : `<a href="/signout-with-chatgpt?return_to=%2F" target="_top">${t('signOut')}</a>`;
}

function bindEmailLogout(button) {
  button.addEventListener('click',async () => {
    button.disabled = true;
    const feedback = document.querySelector('[data-email-logout-feedback]');
    feedback.textContent = '';
    try {
      await post('logout');
      location.assign(state.session.hasNative ? '/signout-with-chatgpt?return_to=%2F' : url());
    } catch {
      feedback.textContent = txt('serviceUnavailable');
      button.disabled = false;
    }
  });
}

function bindMobileSettings(form) {
  const input = form.elements.namedItem('mobile');
  const save = form.querySelector('[type="submit"]');
  const remove = form.querySelector('[data-remove-mobile]');
  const status = form.querySelector('[data-mobile-status]');
  const feedback = form.querySelector('[data-mobile-feedback]');
  let busy = false;

  async function update(mobile) {
    if (busy) return;
    busy = true;
    for (const control of [input, save, remove]) control.disabled = true;
    feedback.textContent = '';
    status.textContent = txt('loginWorking');
    try {
      const { user } = await post('profile',{mobile});
      if (state.session.user?.id === user.id && state.session.user) state.session.user.hasMobile = user.hasMobile;
      remove.hidden = !user.hasMobile;
      input.value = '';
      status.textContent = txt('loginMobileUpdated');
    } catch (error) {
      status.textContent = '';
      feedback.textContent = txt(error.status === 401 ? 'signInError' :
        signInErrors[error.code] || 'serviceUnavailable');
    } finally {
      busy = false;
      for (const control of [input, save, remove]) control.disabled = false;
    }
  }

  form.addEventListener('submit',event => {
    event.preventDefault();
    return update(input.value);
  });
  remove.addEventListener('click',() => update(''));
}

export function bindDashboardLogin() {
  const logout = document.querySelector('[data-email-logout]');
  if (logout) bindEmailLogout(logout);
  const settings = document.querySelector('[data-mobile-settings]');
  if (settings) bindMobileSettings(settings);
  const stage = document.querySelector('[data-login-stage]');
  if (!stage || stage.dataset.loginStage === 'native') return;
  const panel = stage.closest('.login-panel');
  const status = panel.querySelector('[data-login-status]');
  const feedback = panel.querySelector('[data-login-feedback]');
  const linking = stage.dataset.loginStage === 'link';
  let email = '';
  let challenge = '';
  let busy = false;
  let resendAt = 0;
  let cooldown;

  function updateControls() {
    const form = stage.querySelector('form');
    form?.setAttribute('aria-busy',String(busy));
    for (const button of stage.querySelectorAll('button')) {
      button.disabled = busy || (button.hasAttribute('data-resend-code') && Date.now() < resendAt);
    }
  }

  function showStep(markup, name) {
    stage.innerHTML = markup;
    stage.querySelector(`input[name="${name}"]`)?.focus();
  }

  async function sendCode() {
    const result = await post('start',linking ? { email,link:true } : { email });
    challenge = result.challenge;
    resendAt = Date.now() + (Number(result.resendAfter) || 60) * 1000;
    clearTimeout(cooldown);
    cooldown = setTimeout(updateControls,resendAt - Date.now());
    if (stage.isConnected) showStep(codeForm(email,linking),'code');
  }

  async function finish(action, data) {
    const result = await post(action,data);
    state.session.user = {...result.user,authMethod:'email'};
    try {
      const session = await api('session');
      if (session.user?.authMethod === 'email') state.session = session;
    } catch {}
    if (!stage.isConnected) return;
    if (state.session.user.needsProfile) {
      panel.querySelector('h1').textContent = txt('loginProfileTitle');
      panel.querySelector('.login-summary').hidden = true;
      const legacy = panel.querySelector('.login-account-link');
      if (legacy) legacy.hidden = true;
      showStep(mobileForm(),'mobile');
      return;
    }
    await go(returnDestination());
  }

  async function perform(action) {
    if (busy) return;
    busy = true;
    feedback.textContent = '';
    status.textContent = txt('loginWorking');
    updateControls();
    try {
      await action();
    } catch (error) {
      feedback.textContent = txt(signInErrors[error.code] || 'serviceUnavailable');
      if (error.code === 'invalid_code') stage.querySelector('input[name="code"]')?.select();
    } finally {
      busy = false;
      status.textContent = '';
      updateControls();
    }
  }

  stage.addEventListener('submit',event => {
    const form = event.target;
    if (!form.matches('[data-login-form]')) return;
    event.preventDefault();
    const data = new FormData(form);
    if (form.dataset.loginForm === 'start') {
      email = String(data.get('email')).trim();
      return perform(sendCode);
    }
    if (form.dataset.loginForm === 'verify') return perform(() => finish('verify',{challenge,code:data.get('code')}));
    return perform(() => finish('profile',{mobile:data.get('mobile')}));
  });

  stage.addEventListener('click',event => {
    const button = event.target.closest('button');
    if (!button || button.disabled || busy) return;
    if (button.hasAttribute('data-resend-code')) return perform(sendCode);
    if (button.hasAttribute('data-skip-profile')) return perform(() => finish('profile',{}));
    if (button.hasAttribute('data-change-email')) {
      challenge = '';
      feedback.textContent = '';
      clearTimeout(cooldown);
      showStep(emailForm(email),'email');
    }
  });
}
