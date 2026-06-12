import { signInWithEmail, signUpWithEmail, signOut, onAuthChange, getSession } from './auth.js';

const modal       = document.getElementById('authModal');
const backdrop    = document.getElementById('authModalBackdrop');
const closeBtn    = document.getElementById('authModalClose');
const form        = document.getElementById('authForm');
const emailInput  = document.getElementById('authEmail');
const passInput   = document.getElementById('authPassword');
const submitBtn   = document.getElementById('authSubmit');
const msgEl       = document.getElementById('authMsg');
const tabs        = document.querySelectorAll('.auth-tab');
const loggedDiv   = document.getElementById('authLogged');
const loggedEmail = document.getElementById('authLoggedEmail');
const signOutBtn  = document.getElementById('authSignOut');
const authBtn     = document.getElementById('authBtn');
const authLabel   = document.getElementById('authLabel');

let activeTab = 'login'; // 'login' | 'signup'

function openModal() {
  modal.hidden = false;
  document.body.classList.add('auth-modal-open');
  emailInput.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove('auth-modal-open');
  clearMsg();
}

function setMsg(text, isOk = false) {
  msgEl.textContent = text;
  msgEl.className = 'auth-msg' + (isOk ? ' auth-msg--ok' : '');
}

function clearMsg() { msgEl.textContent = ''; }

function setTab(tab) {
  activeTab = tab;
  tabs.forEach(t => t.classList.toggle('active', t.dataset.authTab === tab));
  submitBtn.textContent = tab === 'login' ? 'Entrar' : 'Criar conta';
  passInput.autocomplete = tab === 'login' ? 'current-password' : 'new-password';
  clearMsg();
}

function updateAuthBtn(session) {
  if (session) {
    authBtn.classList.add('logged');
    authLabel.textContent = session.user.email.split('@')[0];
    loggedEmail.textContent = session.user.email;
    form.hidden = true;
    loggedDiv.hidden = false;
  } else {
    authBtn.classList.remove('logged');
    authLabel.textContent = 'Entrar';
    form.hidden = false;
    loggedDiv.hidden = true;
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

form.addEventListener('submit', async e => {
  e.preventDefault();
  clearMsg();
  submitBtn.disabled = true;
  const email    = emailInput.value.trim();
  const password = passInput.value;
  try {
    if (activeTab === 'login') {
      await signInWithEmail(email, password);
      closeModal();
    } else {
      await signUpWithEmail(email, password);
      setMsg('Conta criada! Verifique seu e-mail para confirmar.', true);
    }
  } catch (err) {
    setMsg(traduzirErro(err.message));
  } finally {
    submitBtn.disabled = false;
  }
});

signOutBtn.addEventListener('click', async () => {
  await signOut();
  closeModal();
});

// ── Auth state ────────────────────────────────────────────

onAuthChange(session => updateAuthBtn(session));

// Sincroniza estado inicial
getSession().then(session => updateAuthBtn(session));

// ── Helpers ───────────────────────────────────────────────

function traduzirErro(msg) {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed'))       return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('User already registered'))   return 'E-mail já cadastrado.';
  if (msg.includes('Password should be'))        return 'A senha deve ter pelo menos 6 caracteres.';
  return msg;
}
