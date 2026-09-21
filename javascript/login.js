document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  var email = document.getElementById('loginEmail').value.trim().toLowerCase();
  var password = document.getElementById('loginPassword').value;
  var loginError = document.getElementById('loginError');
  var loginMessage = document.getElementById('loginMessage');

  loginError.style.display = 'none';
  loginMessage.style.display = 'none';

  var result;

  try {
    result = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
  } catch (error) {
    loginError.textContent = 'Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.';
    loginError.style.display = 'block';
    return;
  }

  if (result.error) {
    loginError.textContent = 'Email ou senha incorretos.';
    loginError.style.display = 'block';
    return;
  }

  localStorage.setItem('pizzaria-logado', 'true');
  loginMessage.style.display = 'block';

  window.location.href = 'index.html'; // troque pelo nome da página que quiser abrir
});