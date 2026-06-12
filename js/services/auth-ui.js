import {
  signInWithEmail, signUpWithEmail, signOut, signInWithGoogle,
  resendConfirmation, onAuthChange, getSession,
} from './auth.js';
import { passwordStrength, MIN_PASSWORD_LENGTH } from '../core/password.js';

const modal       = document.getElementById('authModal');
const backdrop    = document.getElementById('authModalBackdrop');
const closeBtn    = document.getElementById('authModalClose');
const form        = document.getElementById('authForm');
const nomeInput   = document.getElementById('authNome');
const emailInput  = document.getElementById('authEmail');
const passInput   = document.getElementById('authPassword');
const pass2Input  = document.getElementById('authPassword2');
const toggleBtn   = document.getElementById('authToggle');
const submitBtn   = document.getElementById('authSubmit');
const msgEl       = document.getElementById('authMsg');
const tabs        = document.querySelectorAll('.auth-tab');
const googleBtn   = document.getElementById('authGoogle');
const strengthBox = document.getElementById('authStrength');
const strengthFill  = document.getElementById('authStrengthFill');
const strengthLabel = document.getElementById('authStrengthLabel');
const signupFields  = document.querySelectorAll('.auth-field--signup');
const sentDiv     = document.getElementById('authSent');
const sentEmail   = document.getElementById('authSentEmail');
const resendBtn   = document.getElementById('authResend');
const loggedDiv   = document.getElementById('authLogged');
const loggedName  = document.getElementById('authLoggedName');
const loggedEmail = document.getElementById('authLoggedEmail');
const signOutBtn  = document.getElementById('authSignOut');
const authBtn     = document.getElementById('authBtn');
const authLabel   = document.getElementById('authLabel');

let activeTab = 'login'; // 'login' | 'signup'
let pendingEmail = '';

function openModal() {
  modal.hidden = false;
  document.body.classList.add('auth-modal-open');
  emailInput.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove('auth-modal-open');
  clearMsg();
  showView('form');
}

function setMsg(text, isOk = false) {
  msgEl.textContent = text;
  msgEl.className = 'auth-msg' + (isOk ? ' auth-msg--ok' : '');
}

function clearMsg() { msgEl.textContent = ''; }

// Alterna entre formulário, tela "e-mail enviado" e estado logado
function showView(view) {
  form.hidden     = view !== 'form';
  sentDiv.hidden  = view !== 'sent';
  loggedDiv.hidden = view !== 'logged';
  const showTabs = view === 'form';
  document.querySelector('.auth-tabs').hidden = !showTabs;
  googleBtn.hidden = !showTabs;
  document.querySelector('.auth-divider').hidden = !showTabs;
}

function setTab(tab) {
  activeTab = tab;
  tabs.forEach(t => t.classList.toggle('active', t.dataset.authTab === tab));
  const isSignup = tab === 'signup';
  submitBtn.textContent = isSignup ? 'Criar conta' : 'Entrar';
  passInput.autocomplete = isSignup ? 'new-password' : 'current-password';
  signupFields.forEach(el => { el.hidden = !isSignup; });
  clearMsg();
  if (isSignup) updateStrength();
}

function updateStrength() {
  const { score, label } = passwordStrength(passInput.value);
  strengthFill.style.width = `${(score / 4) * 100}%`;
  strengthFill.dataset.score = String(score);
  strengthLabel.textContent = passInput.value ? label : '';
}

function updateAuthBtn(session) {
  if (session) {
    const meta = session.user.user_metadata || {};
    const nome = meta.nome || session.user.email.split('@')[0];
    authBtn.classList.add('logged');
    authLabel.textContent = nome;
    loggedName.textContent = meta.nome || '';
    loggedName.hidden = !meta.nome;
    loggedEmail.textContent = session.user.email;
    showView('logged');
  } else {
    authBtn.classList.remove('logged');
    authLabel.textContent = 'Entrar';
    if (sentDiv.hidden) showView('form');
  }
}

// ── Eventos ───────────────────────────────────────────────

authBtn.addEventListener('click', openModal);
backdrop.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

tabs.forEach(t => t.addEventListener('click', () => setTab(t.dataset.authTab)));

passInput.addEventListener('input', () => { if (activeTab === 'signup') updateStrength(); });

toggleBtn.addEventListener('click', () => {
  const show = passInput.type === 'password';
  passInput.type = show ? 'text' : 'password';
  toggleBtn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  toggleBtn.querySelector('i').setAttribute('data-lucide', show ? 'eye-off' : 'eye');
  if (window.lucide) window.lucide.createIcons();
});

googleBtn.addEventListener('click', async () => {
  clearMsg();
  try {
    await signInWithGoogle();
  } catch (err) {
    setMsg(traduzirErro(err.message));
  }
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  clearMsg();
  const email    = emailInput.value.trim();
  const password = passInput.value;

  // Validação extra no cadastro
  if (activeTab === 'signup') {
    if (!passwordStrength(password).valid) {
      setMsg(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== pass2Input.value) {
      setMsg('As senhas não coincidem.');
      return;
    }
  }

  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  try {
    if (activeTab === 'login') {
      await signInWithEmail(email, password);
      closeModal();
    } else {
      await signUpWithEmail(email, password, nomeInput.value);
      pendingEmail = email;
      sentEmail.textContent = email;
      showView('sent');
      if (window.lucide) window.lucide.createIcons();
    }
  } catch (err) {
    setMsg(traduzirErro(err.message));
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  }
});

resendBtn.addEventListener('click', async () => {
  if (!pendingEmail) return;
  resendBtn.disabled = true;
  try {
    await resendConfirmation(pendingEmail);
    resendBtn.textContent = 'E-mail reenviado ✓';
  } catch (err) {
    resendBtn.textContent = traduzirErro(err.message);
  }
});

signOutBtn.addEventListener('click', async () => {
  await signOut();
  closeModal();
});

// ── Auth state ────────────────────────────────────────────

onAuthChange(session => updateAuthBtn(session));
getSession().then(session => updateAuthBtn(session));

// ── Helpers ───────────────────────────────────────────────

function traduzirErro(msg) {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed'))       return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('User already registered'))   return 'E-mail já cadastrado.';
  if (msg.includes('Password should be'))        return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (msg.includes('over_email_send_rate_limit') || msg.includes('rate limit'))
    return 'Muitas tentativas. Aguarde um momento e tente de novo.';
  if (msg.includes('provider is not enabled'))   return 'Login com Google ainda não está configurado.';
  return msg;
}
