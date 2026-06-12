import {
  signInWithEmail, signUpWithEmail, signOut, signInWithGoogle,
  resendConfirmation, onAuthChange, getSession,
} from './auth.js';
import { passwordStrength, MIN_PASSWORD_LENGTH } from '../core/password.js';
import { supabase } from './supabase.js';
import * as baralhosStore from './baralhos-store.js';

// ── Refs do modal ──────────────────────────────────────────
const modal         = document.getElementById('authModal');
const backdrop      = document.getElementById('authModalBackdrop');
const closeBtn      = document.getElementById('authModalClose');
const form          = document.getElementById('authForm');
const nomeInput     = document.getElementById('authNome');
const emailInput    = document.getElementById('authEmail');
const passInput     = document.getElementById('authPassword');
const pass2Input    = document.getElementById('authPassword2');
const toggleBtn     = document.getElementById('authToggle');
const submitBtn     = document.getElementById('authSubmit');
const msgEl         = document.getElementById('authMsg');
const tabs          = document.querySelectorAll('.auth-tab');
const googleBtn     = document.getElementById('authGoogle');
const strengthFill  = document.getElementById('authStrengthFill');
const strengthLabel = document.getElementById('authStrengthLabel');
const signupFields  = document.querySelectorAll('.auth-field--signup');
const sentDiv       = document.getElementById('authSent');
const sentEmail     = document.getElementById('authSentEmail');
const resendBtn     = document.getElementById('authResend');
const authTabsEl    = document.querySelector('.auth-tabs');
const dividerEl     = document.querySelector('.auth-divider');

// ── Refs do painel de perfil ───────────────────────────────
const profilePane     = document.getElementById('authProfile');
const profileAvatar   = document.getElementById('authProfileAvatar');
const profileNameEl   = document.getElementById('authProfileName');
const profileEmailEl  = document.getElementById('authProfileEmail');
const profileStats    = document.getElementById('authProfileStats');
const profileNomeInput = document.getElementById('profileNomeInput');
const profileSaveBtn  = document.getElementById('profileSaveBtn');
const profileMsg      = document.getElementById('profileMsg');
const profileSignOut  = document.getElementById('profileSignOutBtn');

// ── Refs do avatar/dropdown na tab bar ────────────────────
const authBtn         = document.getElementById('authBtn');
const avatarWrap      = document.getElementById('userAvatarWrap');
const avatarBtn       = document.getElementById('userAvatarBtn');
const avatarImg       = document.getElementById('userAvatarImg');
const avatarInitials  = document.getElementById('userAvatarInitials');
const dropdown        = document.getElementById('userDropdown');
const dropdownName    = document.getElementById('userDropdownName');
const dropdownEmail   = document.getElementById('userDropdownEmail');
const dropdownProfile = document.getElementById('userProfileBtn');
const dropdownSignOut = document.getElementById('userSignOutBtn');

// ── Refs nav mobile ───────────────────────────────────────
const mobileAuthBtn     = document.getElementById('mobileAuthBtn');
const mobileNavAvatar   = document.getElementById('mobileNavAvatar');
const mobileNavAvatarImg = document.getElementById('mobileNavAvatarImg');
const mobileNavUserIcon = document.getElementById('mobileNavUserIcon');
const mobileAuthLabel   = document.getElementById('mobileAuthLabel');

// ── Refs de personalização ────────────────────────────────
const heroSubtitle    = document.getElementById('heroSubtitle');

let activeTab    = 'login';
let pendingEmail = '';
let currentSession = null;

// ── Utilitários ────────────────────────────────────────────

function initials(nome, email) {
  if (nome) {
    const parts = nome.trim().split(/\s+/);
    return parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
  }
  return (email || '?')[0];
}

function primeiroNome(nome, email) {
  if (nome) return nome.trim().split(/\s+/)[0];
  return email?.split('@')[0] ?? '';
}

// ── Abertura / fechamento do modal ────────────────────────

function openModal(view = 'form') {
  showView(view);
  modal.hidden = false;
  document.body.classList.add('auth-modal-open');
  if (view === 'form') emailInput.focus();
  if (view === 'profile') profileNomeInput.focus();
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

function showView(view) {
  form.hidden        = view !== 'form';
  sentDiv.hidden     = view !== 'sent';
  profilePane.hidden = view !== 'profile';
  const isForm = view === 'form';
  authTabsEl.hidden = !isForm;
  googleBtn.hidden  = !isForm;
  dividerEl.hidden  = !isForm;
  if (view === 'profile') renderProfile();
}

// ── Tab login/cadastro ────────────────────────────────────

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

// ── Dropdown do avatar ────────────────────────────────────

function openDropdown() {
  dropdown.hidden = false;
  avatarBtn.setAttribute('aria-expanded', 'true');
}

function closeDropdown() {
  dropdown.hidden = true;
  avatarBtn.setAttribute('aria-expanded', 'false');
}

// ── Personalização da UI ──────────────────────────────────

function updatePersonalization(session) {
  if (!session) {
    heroSubtitle.textContent = '72 caracteres · Guia de estudo + Flash Cards interativos';
    return;
  }
  const meta  = session.user.user_metadata || {};
  const nome  = meta.full_name || meta.nome || null;
  const first = primeiroNome(nome, session.user.email);
  heroSubtitle.textContent = `Bem-vindo de volta, ${first} · 72 caracteres`;
}

// ── Avatar na tab bar ─────────────────────────────────────

function updateAvatarBar(session) {
  if (!session) {
    authBtn.hidden    = false;
    avatarWrap.hidden = true;
    return;
  }
  const meta   = session.user.user_metadata || {};
  const nome   = meta.full_name || meta.nome || null;
  const email  = session.user.email;
  const pic    = meta.avatar_url || meta.picture || null;

  authBtn.hidden    = true;
  avatarWrap.hidden = false;

  if (pic) {
    avatarImg.src    = pic;
    avatarImg.hidden = false;
    avatarInitials.textContent = '';
  } else {
    avatarImg.hidden = true;
    avatarInitials.textContent = initials(nome, email);
  }

  dropdownName.textContent  = nome || primeiroNome(null, email);
  dropdownEmail.textContent = email;

  updatePersonalization(session);
  updateMobileNav(session);
}

function updateMobileNav(session) {
  if (!session) {
    mobileAuthBtn.classList.remove('logged');
    mobileNavAvatarImg.hidden = true;
    mobileNavUserIcon.hidden  = false;
    mobileAuthLabel.textContent = 'Entrar';
    return;
  }
  const meta  = session.user.user_metadata || {};
  const nome  = meta.full_name || meta.nome || null;
  const pic   = meta.avatar_url || meta.picture || null;
  const first = primeiroNome(nome, session.user.email);

  mobileAuthBtn.classList.add('logged');
  mobileAuthLabel.textContent = first;

  if (pic) {
    mobileNavAvatarImg.src    = pic;
    mobileNavAvatarImg.hidden = false;
    mobileNavUserIcon.hidden  = true;
  } else {
    mobileNavAvatarImg.hidden = true;
    mobileNavUserIcon.hidden  = false;
  }
}

// ── Painel de perfil ──────────────────────────────────────

function renderProfile() {
  if (!currentSession) return;
  const meta  = currentSession.user.user_metadata || {};
  const nome  = meta.full_name || meta.nome || '';
  const email = currentSession.user.email;
  const pic   = meta.avatar_url || meta.picture || null;

  profileNameEl.textContent  = nome || primeiroNome(null, email);
  profileEmailEl.textContent = email;
  profileNomeInput.value     = nome;
  profileMsg.textContent     = '';

  if (pic) {
    profileAvatar.innerHTML = `<img src="${pic}" alt="${nome}">`;
  } else {
    profileAvatar.textContent = initials(nome, email);
  }

  // estatísticas: baralhos e itens marcados
  const bs      = baralhosStore.getBaralhos();
  const total   = bs.reduce((s, b) => s + b.ids.length, 0);
  profileStats.innerHTML = `
    <div class="auth-stat">
      <span class="auth-stat-value">${bs.length}</span>
      <span class="auth-stat-label">Baralhos</span>
    </div>
    <div class="auth-stat">
      <span class="auth-stat-value">${total}</span>
      <span class="auth-stat-label">Itens marcados</span>
    </div>`;
  if (window.lucide) window.lucide.createIcons({ attrs: { class: ['lucide'] } });
}

// ── Eventos ───────────────────────────────────────────────

authBtn.addEventListener('click', () => openModal('form'));
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
  try { await signInWithGoogle(); } catch (err) { setMsg(traduzirErro(err.message)); }
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  clearMsg();
  const email    = emailInput.value.trim();
  const password = passInput.value;

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

// Mobile auth button
mobileAuthBtn.addEventListener('click', () => {
  openModal(currentSession ? 'profile' : 'form');
});

// Avatar dropdown
avatarBtn.addEventListener('click', e => {
  e.stopPropagation();
  dropdown.hidden ? openDropdown() : closeDropdown();
});

document.addEventListener('click', e => {
  if (!avatarWrap.contains(e.target)) closeDropdown();
});

dropdownProfile.addEventListener('click', () => {
  closeDropdown();
  openModal('profile');
});

dropdownSignOut.addEventListener('click', async () => {
  closeDropdown();
  await signOut();
});

// Painel de perfil
profileSaveBtn.addEventListener('click', async () => {
  const nome = profileNomeInput.value.trim();
  profileSaveBtn.disabled = true;
  try {
    const { error } = await supabase.auth.updateUser({ data: { nome } });
    if (error) throw error;
    profileMsg.className = 'auth-msg auth-msg--ok';
    profileMsg.textContent = 'Nome atualizado!';
    // atualiza sessão local
    const { data } = await supabase.auth.getSession();
    if (data.session) updateAvatarBar(data.session);
  } catch (err) {
    profileMsg.className = 'auth-msg';
    profileMsg.textContent = traduzirErro(err.message);
  } finally {
    profileSaveBtn.disabled = false;
  }
});

profileSignOut.addEventListener('click', async () => {
  closeModal();
  await signOut();
});

// ── Auth state ────────────────────────────────────────────

onAuthChange(session => {
  currentSession = session;
  updateAvatarBar(session);
  updateMobileNav(session);
  if (!session) closeDropdown();
});

getSession().then(session => {
  currentSession = session;
  updateAvatarBar(session);
  updateMobileNav(session);
});

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
