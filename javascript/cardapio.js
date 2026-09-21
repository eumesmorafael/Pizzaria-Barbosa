// ---------- FAVORITOS ----------
var CHAVE_FAVORITOS = 'pizzaria-favoritos';

function lerFavoritos() {
  var dados = localStorage.getItem(CHAVE_FAVORITOS);
  return dados ? JSON.parse(dados) : [];
}

function salvarFavoritos(favoritos) {
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
}

document.querySelectorAll('.menu-favorite').forEach(function(botao) {
  var id = botao.dataset.favorite;
  var favoritos = lerFavoritos();

  // marca visualmente se já é favorito
  if (favoritos.includes(id)) {
    botao.setAttribute('aria-pressed', 'true');
    botao.classList.add('active');
  }

  botao.addEventListener('click', function() {
    var favoritos = lerFavoritos();
    var index = favoritos.indexOf(id);

    if (index === -1) {
      favoritos.push(id);
      botao.setAttribute('aria-pressed', 'true');
      botao.classList.add('active');
    } else {
      favoritos.splice(index, 1);
      botao.setAttribute('aria-pressed', 'false');
      botao.classList.remove('active');
    }

    salvarFavoritos(favoritos);
  });
});

// ---------- TOAST DE FEEDBACK ----------
// Injeta o CSS do toast e da animação do botão uma única vez,
// sem precisar mexer no style.css.
(function injetarEstiloToast() {
  var estilo = document.createElement('style');
  estilo.textContent =
    '.cart-toast {' +
    '  position: fixed;' +
    '  bottom: 24px;' +
    '  left: 50%;' +
    '  transform: translateX(-50%) translateY(20px);' +
    '  background: #1f8a3c;' +
    '  color: #fff;' +
    '  padding: 12px 20px;' +
    '  border-radius: 8px;' +
    '  font-weight: 600;' +
    '  font-size: 14px;' +
    '  box-shadow: 0 6px 18px rgba(0,0,0,0.2);' +
    '  opacity: 0;' +
    '  pointer-events: none;' +
    '  transition: opacity 0.25s ease, transform 0.25s ease;' +
    '  z-index: 9999;' +
    '  display: flex;' +
    '  align-items: center;' +
    '  gap: 8px;' +
    '}' +
    '.cart-toast.show {' +
    '  opacity: 1;' +
    '  transform: translateX(-50%) translateY(0);' +
    '}' +
    '.cart-toast .check {' +
    '  display: inline-flex;' +
    '  align-items: center;' +
    '  justify-content: center;' +
    '  width: 18px;' +
    '  height: 18px;' +
    '  border-radius: 50%;' +
    '  background: rgba(255,255,255,0.25);' +
    '  font-size: 12px;' +
    '}' +
    '@keyframes botaoPulso {' +
    '  0%   { transform: scale(1); }' +
    '  40%  { transform: scale(0.92); }' +
    '  70%  { transform: scale(1.06); }' +
    '  100% { transform: scale(1); }' +
    '}' +
    '.menu-buy.comprado {' +
    '  animation: botaoPulso 0.35s ease;' +
    '}';
  document.head.appendChild(estilo);
})();

var toastAtual = null;
var toastTimeout = null;

function mostrarToast(mensagem) {
  if (!toastAtual) {
    toastAtual = document.createElement('div');
    toastAtual.className = 'cart-toast';
    document.body.appendChild(toastAtual);
  }

  toastAtual.innerHTML = '<span class="check">✓</span><span>' + mensagem + '</span>';

  // reinicia a transição mesmo se o toast já estiver visível
  toastAtual.classList.remove('show');
  void toastAtual.offsetWidth; // força reflow
  toastAtual.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(function() {
    toastAtual.classList.remove('show');
  }, 2200);
}

// ---------- ADICIONAR AO CARRINHO ----------
var CHAVE_CARRINHO = 'pizzaria-carrinho';

document.querySelectorAll('[data-comprar]').forEach(function(botao) {
  botao.addEventListener('click', function(event) {
    // Continua sem navegar para o carrinho — só mostra o feedback.
    event.preventDefault();

    var nome = botao.dataset.nome;
    var preco = Number(botao.dataset.preco);
    var imagem = botao.dataset.imagem;
    var id = botao.dataset.id || botao.closest('.menu-item').querySelector('[data-favorite]')?.dataset.favorite || nome.toLowerCase();

    var carrinho = JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) || [];
    var existente = carrinho.find(function(item) { return item.nome === nome; });

    if (existente) {
      existente.quantidade += 1;
    } else {
      carrinho.push({ id: id, nome: nome, preco: preco, imagem: imagem, quantidade: 1 });
    }

    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));

    // animação de "pulso" no botão clicado
    botao.classList.remove('comprado');
    void botao.offsetWidth; // força reflow para reiniciar a animação
    botao.classList.add('comprado');

    mostrarToast(nome + ' adicionada ao carrinho!');
  });
});
