window.onerror = function (mensagem, url, linha) {
  alert('ERRO no favoritos.js:\n' + mensagem + '\nLinha: ' + linha);
};

var CHAVE_FAVORITOS = 'pizzaria-favoritos';
var CHAVE_CARRINHO = 'pizzaria-carrinho';

var CATALOGO_PIZZAS = {
  'calabresa': { nome: 'Calabresa', descricao: 'Molho de tomate, mussarela, calabresa e cebola.', preco: 42, imagem: 'imagem/OIP.jpg', badge: { texto: 'MAIS PEDIDA', classe: '' } },
  'frango-catupiry': { nome: 'Frango com catupiry', descricao: 'Frango desfiado, catupiry, milho e orégano.', preco: 44, imagem: 'imagem/Pizza-de-frango-com-catupiry.jpg', badge: { texto: 'ESPECIAL', classe: 'yellow' } },
  'morango-chocolate': { nome: 'Morango com chocolate', descricao: 'Chocolate, morango e creme de leite.', preco: 41, imagem: 'imagem/OIP (3).webp', badge: { texto: 'DOCE', classe: 'pink' } },
  'portuguesa': { nome: 'Portuguesa', descricao: 'Presunto, ovos, cebola, ervilha, azeitona e mussarela.', preco: 43, imagem: 'imagem/Receita-de-pizza-portuguesa-3.webp', badge: null },
  'mussarela': { nome: 'Mussarela', descricao: 'Molho de tomate, mussarela e orégano.', preco: 39, imagem: 'imagem/OIP (2).webp', badge: null },
  'margherita': { nome: 'Margherita', descricao: 'Mussarela, tomate, manjericão e azeite.', preco: 41, imagem: 'imagem/OIP.webp', badge: null },
  'quatro-queijos': { nome: 'Quatro queijos', descricao: 'Mussarela, provolone, gorgonzola e parmesão.', preco: 47, imagem: 'imagem/747855897-a-arte-e-a-historia-da-pizza-quatro-queijos-um-guia-completo.jpg', badge: { texto: 'ESPECIAL DA CASA', classe: 'yellow' } },
  'banana-canela': { nome: 'Banana com canela', descricao: 'Banana, doce de leite e canela.', preco: 36, imagem: 'imagem/OIP (1).jpg', badge: null },
  'romeu-julieta': { nome: 'Romeu e Julieta', descricao: 'Goiabada, queijo e canela.', preco: 40, imagem: 'imagem/receita-de-pizza-romeu-e-julieta.jpg', badge: null }
};

function lerFavoritos() {
  var dados = localStorage.getItem(CHAVE_FAVORITOS);
  return dados ? JSON.parse(dados) : [];
}

function salvarFavoritos(favoritos) {
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
}

function lerCarrinho() {
  var dados = localStorage.getItem(CHAVE_CARRINHO);
  return dados ? JSON.parse(dados) : [];
}

function salvarCarrinho(carrinho) {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
}

function formatarPreco(valor) {
  return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function renderizarFavoritos() {
  var grid = document.getElementById('favoritesGrid');
  if (!grid) {
    alert('PROBLEMA: não encontrei o elemento com id="favoritesGrid" no HTML.');
    return;
  }

  var vazio = document.getElementById('favoritesEmpty');
  var favoritos = lerFavoritos();

  grid.innerHTML = '';
  vazio.hidden = favoritos.length !== 0;

  favoritos.forEach(function (id) {
    var pizza = CATALOGO_PIZZAS[id];
    if (!pizza) return;

    var artigo = document.createElement('article');
    artigo.className = 'favorite-card';
    artigo.dataset.favorite = id;

    var badgeHtml = pizza.badge
      ? '<span class="mini-badge ' + pizza.badge.classe + '">' + pizza.badge.texto + '</span>'
      : '';

    artigo.innerHTML =
      '<img src="' + pizza.imagem + '" alt="Pizza ' + pizza.nome + '">' +
      '<div class="favorite-info">' +
        badgeHtml +
        '<h2>' + pizza.nome + '</h2>' +
        '<p>' + pizza.descricao + '</p>' +
        '<div class="favorite-meta">' +
          '<strong>' + formatarPreco(pizza.preco) + '</strong>' +
          '<div class="favorite-actions">' +
            '<button class="favorite-toggle" type="button" data-action="remover" aria-label="Remover ' + pizza.nome + ' dos favoritos" aria-pressed="true">♥</button>' +
            '<button class="btn primary buy-button" type="button" data-action="comprar">COMPRAR</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    grid.appendChild(artigo);
  });
}

var gridElemento = document.getElementById('favoritesGrid');
if (!gridElemento) {
  alert('PROBLEMA: elemento favoritesGrid não existe no momento em que o script rodou.');
} else {
  gridElemento.addEventListener('click', function (event) {
    alert('Clique detectado no grid!');

    var button = event.target.closest('button');
    if (!button) {
      alert('Cliquei, mas não achei nenhum botão (closest button retornou nulo).');
      return;
    }

    alert('Botão clicado, action = ' + button.dataset.action);

    var card = button.closest('.favorite-card');
    var id = card.dataset.favorite;
    var pizza = CATALOGO_PIZZAS[id];

    if (button.dataset.action === 'remover') {
      var favoritos = lerFavoritos();
      var posicao = favoritos.indexOf(id);
      if (posicao !== -1) favoritos.splice(posicao, 1);
      salvarFavoritos(favoritos);
      renderizarFavoritos();
    }

    if (button.dataset.action === 'comprar') {
      var carrinho = lerCarrinho();
      var itemExistente = carrinho.find(function (item) {
        return item.nome === pizza.nome;
      });

      if (itemExistente) {
        itemExistente.quantidade += 1;
      } else {
        carrinho.push({ nome: pizza.nome, preco: pizza.preco, imagem: pizza.imagem, quantidade: 1 });
      }

      salvarCarrinho(carrinho);
      alert('Item salvo no carrinho! Vou te mandar para carrinho.html agora.');
      window.location.href = 'carrinho.html';
    }
  });
}

renderizarFavoritos();