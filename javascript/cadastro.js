document.getElementById('registerForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  var form = this;
  var name = document.getElementById('registerName').value.trim();
  var email = document.getElementById('registerEmail').value.trim().toLowerCase();
  var phone = document.getElementById('registerPhone').value.trim();
  var password = document.getElementById('registerPassword').value;
  var confirmation = document.getElementById('registerPasswordConfirm').value;
  var registerError = document.getElementById('registerError');
  var registerMessage = document.getElementById('registerMessage');

  registerError.style.display = 'none';
  registerMessage.style.display = 'none';

  if (password !== confirmation) {
    registerError.textContent = 'As senhas não coincidem.';
    registerError.style.display = 'block';
    return;
  }

  var result;

  try {
    result = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: { data: { name: name, phone: phone } }
    });
  } catch (error) {
    registerError.textContent = 'Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.';
    registerError.style.display = 'block';
    return;
  }

  if (result.error) {
    registerError.textContent = result.error.message;
    registerError.style.display = 'block';
    return;
  }

  registerMessage.style.display = 'block';
  form.reset();
});
