var CHAVE_CARRINHO = 'pizzaria-carrinho';
 
function lerCarrinho() {
  var dados = localStorage.getItem(CHAVE_CARRINHO);
  return dados ? JSON.parse(dados) : [];
}
 
function salvarCarrinho(carrinho) {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
}
 
function formatPrice(value) {
  return 'R$ ' + value.toFixed(2).replace('.', ',');
}
 
function calcularQuantidadeTotal(carrinho) {
  return carrinho.reduce(function(total, item) {
    return total + (Number(item.quantidade) || 1);
  }, 0);
}

function renderizarCarrinho() {
  var cartItems = document.getElementById('cartItems');
  var emptyCart = document.getElementById('emptyCart');
  var carrinho = lerCarrinho();
 
  cartItems.innerHTML = '';
 
  if (carrinho.length === 0) {
    emptyCart.hidden = false;
  } else {
    emptyCart.hidden = true;
  }
 
  var total = 0;
 
  carrinho.forEach(function(item, index) {
    var subtotal = item.preco * item.quantidade;
    total += subtotal;
 
    var artigo = document.createElement('article');
    artigo.className = 'cart-item';
    artigo.dataset.index = index;
    artigo.innerHTML =
      '<img src="' + item.imagem + '" alt="' + item.nome + '">' +
      '<div>' +
        '<h3>' + item.nome + '</h3>' +
        '<strong class="cart-price">' + formatPrice(subtotal) + '</strong>' +
        '<div class="cart-controls">' +
          '<div class="quantity" aria-label="Quantidade de ' + item.nome + '">' +
            '<button type="button" data-action="decrease" aria-label="Diminuir quantidade">−</button>' +
            '<span>' + item.quantidade + '</span>' +
            '<button type="button" data-action="increase" aria-label="Aumentar quantidade">+</button>' +
          '</div>' +
          '<button class="remove-button" type="button" data-action="remove">Remover</button>' +
        '</div>' +
      '</div>';
 
    cartItems.appendChild(artigo);
  });
 
  document.getElementById('subtotalValue').textContent = formatPrice(total);
  document.getElementById('totalValue').textContent = formatPrice(total);
  document.getElementById('totalItemsValue').textContent = calcularQuantidadeTotal(carrinho);
}
 
document.getElementById('cartItems').addEventListener('click', function(event) {
  var button = event.target.closest('button');
  if (!button) return;
 
  var item = button.closest('.cart-item');
  var index = Number(item.dataset.index);
  var carrinho = lerCarrinho();
 
  if (button.dataset.action === 'increase') {
    carrinho[index].quantidade += 1;
  }
 
  if (button.dataset.action === 'decrease') {
    carrinho[index].quantidade = Math.max(1, carrinho[index].quantidade - 1);
  }
 
  if (button.dataset.action === 'remove') {
    carrinho.splice(index, 1);
  }
 
  salvarCarrinho(carrinho);
  renderizarCarrinho();
});

var clearCartBtn = document.getElementById('clearCartBtn');
if (clearCartBtn) {
  clearCartBtn.addEventListener('click', function() {
    if (confirm('Deseja limpar todo o carrinho?')) {
      localStorage.removeItem('pizzaria-carrinho');
      renderizarCarrinho();
    }
  });
}
 
renderizarCarrinho();
 