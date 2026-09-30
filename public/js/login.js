const form = document.getElementById('loginForm');
const empresa = document.getElementById('empresa');
const usuario = document.getElementById('usuario');
const clave = document.getElementById('clave');
const empresaSelect = document.getElementById('empresaSelect');
const empresaSelectButton = document.getElementById('empresaSelectButton');
const empresaSelectValue = document.getElementById('empresaSelectValue');
const empresaSelectMenu = document.getElementById('empresaSelectMenu');
const empresaOptions = [...document.querySelectorAll('.empresa-option')];

function cerrarEmpresaSelect() {
  empresaSelect.classList.remove('open');
  empresaSelectButton.setAttribute('aria-expanded', 'false');
}

empresaSelectButton.addEventListener('click', () => {
  const abierto = empresaSelect.classList.toggle('open');
  empresaSelectButton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
});

empresaOptions.forEach((option) => {
  option.addEventListener('click', () => {
    empresa.value = option.dataset.value;
    empresaSelectValue.textContent = option.dataset.value;
    empresaOptions.forEach((item) => {
      const selected = item === option;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    empresa.dispatchEvent(new Event('change', { bubbles: true }));
    cerrarEmpresaSelect();
  });
});

document.addEventListener('click', (event) => {
  if (!empresaSelect.contains(event.target)) cerrarEmpresaSelect();
});

const checkbox = document.getElementById('checkbox');
const submit = document.getElementById('submit');
const mensaje = document.getElementById('mensaje');

checkbox.addEventListener('change', () => {
  clave.type = checkbox.checked ? 'text' : 'password';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  mensaje.className = '';
  mensaje.textContent = 'Verificando...';
  submit.disabled = true;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        empresa: empresa.value,
        usuario: usuario.value,
        clave: clave.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Usuario o contraseña incorrectos');
    }

    mensaje.className = 'success';
    mensaje.textContent = 'Acceso correcto...';

    window.location.href = '/inicio';

  } catch (error) {
    mensaje.textContent = error.message;
    submit.disabled = false;
  }
});