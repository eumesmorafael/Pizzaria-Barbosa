document.addEventListener('DOMContentLoaded', async function() {
  const areaConta = document.getElementById('areaConta');
  const nomeUsuario = document.getElementById('nomeUsuario');
  const btnSair = document.getElementById('btnSair');
  const loginLinks = Array.from(document.querySelectorAll('a[href="login.html"]'));
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html');
  const protectedPages = ['index.html', 'cardapio.html', 'carrinho.html', 'favoritos.html', 'pedido.html', 'promo.html', 'menu.html'];

  function atualizarMenu(logado) {
    if (areaConta) {
      areaConta.style.display = logado ? 'flex' : 'none';
    }

    if (nomeUsuario) {
      nomeUsuario.textContent = '';
    }

    loginLinks.forEach(function(link) {
      link.style.display = logado ? 'none' : 'inline-block';
    });
  }

  if (btnSair) {
    btnSair.addEventListener('click', async function() {
      try {
        if (window.supabaseClient && supabaseClient.auth) {
          await supabaseClient.auth.signOut();
        }
      } catch (e) {
        // ignora erro do logout
      }

      localStorage.removeItem('pizzaria-logado');
      atualizarMenu(false);

      if (currentPage !== 'login.html' && currentPage !== 'cadastro.html') {
        window.location.href = 'login.html';
      }
    });
  }

  if (!window.supabaseClient || !supabaseClient.auth) {
    atualizarMenu(false);
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
      atualizarMenu(false);

      if (protectedPages.includes(currentPage)) {
        window.location.href = 'login.html';
      }

      return;
    }

    const usuario = data.user;
    let nomeExibido = usuario.email;

    try {
      const { data: perfil } = await supabaseClient
        .from('usuarios')
        .select('nome')
        .eq('id', usuario.id)
        .single();

      if (perfil && perfil.nome) {
        nomeExibido = 'Olá, ' + perfil.nome;
      }
    } catch (e) {
      // ignora erro do perfil e usa o e-mail
    }

    if (nomeUsuario) {
      nomeUsuario.textContent = nomeExibido;
    }

    atualizarMenu(true);

    if (currentPage === 'login.html' || currentPage === 'cadastro.html') {
      window.location.href = 'index.html';
    }
  } catch (erro) {
    atualizarMenu(false);
  }
});