const API_URL = 'http://localhost:3001';
const TOKEN_KEY = 'token';

const $ = (id) => document.getElementById(id);
const els = {
  auth: $('view-auth'), profile: $('view-profile'),
  tabLogin: $('tab-login'), tabRegister: $('tab-register'),
  form: $('form'), msg: $('msg'), submit: $('submit'),
  username: $('field-username'), pwHint: $('pw-hint'),
};

let mode = 'login'; // 'login' | 'register'

async function api(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se ele está rodando.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Algo deu errado. Tente novamente.');
    err.status = res.status;
    throw err;
  }
  return data;
}

function showMessage(text, type = 'error') {
  els.msg.textContent = text;
  els.msg.className = 'msg ' + type;
}

function setMode(next) {
  mode = next;
  const isRegister = mode === 'register';
  els.tabLogin.setAttribute('aria-selected', String(!isRegister));
  els.tabRegister.setAttribute('aria-selected', String(isRegister));
  els.username.hidden = !isRegister;
  els.pwHint.hidden = !isRegister;
  els.form.senha.autocomplete = isRegister ? 'new-password' : 'current-password';
  els.submit.textContent = isRegister ? 'Criar conta' : 'Entrar';
  showMessage('');
}

function showProfile(user) {
  $('p-name').textContent = user.username;
  $('p-id').textContent = user.id;
  $('p-email').textContent = user.email;
  $('p-username').textContent = user.username;
  els.auth.hidden = true;
  els.profile.hidden = false;
}

function showAuth() {
  els.profile.hidden = true;
  els.auth.hidden = false;
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  els.form.reset();
  setMode('login');
  showAuth();
}

async function login(email, senha) {
  const { token, user } = await api('/login', { method: 'POST', body: { email, senha } });
  localStorage.setItem(TOKEN_KEY, token);
  showProfile(user);
}

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { email, senha, username } = els.form;
  const values = { email: email.value.trim(), senha: senha.value, username: username.value.trim() };

  if (!values.email || !values.senha || (mode === 'register' && !values.username)) {
    return showMessage('Preencha todos os campos.');
  }
  if (mode === 'register' && (values.senha.length < 8 || values.senha.length > 72)) {
    return showMessage('A senha deve ter entre 8 e 72 caracteres.');
  }

  els.submit.disabled = true;
  showMessage('');
  try {
    if (mode === 'register') {
      await api('/register', { method: 'POST', body: values });
    }
    await login(values.email, values.senha);
    els.form.reset();
  } catch (err) {
    showMessage(err.message);
  } finally {
    els.submit.disabled = false;
  }
});

els.tabLogin.addEventListener('click', () => setMode('login'));
els.tabRegister.addEventListener('click', () => setMode('register'));
$('logout').addEventListener('click', logout);

// Ao abrir a página, valida o token salvo consultando /me
(async function init() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  try {
    const { user } = await api('/me', { token });
    showProfile(user);
  } catch (err) {
    if (err.status === 401 || err.status === 404) localStorage.removeItem(TOKEN_KEY);
  }
})();
