async function parseJsonResponse(response, fallbackMessage) {
  var text = await response.text();

  if (!text || !text.trim()) {
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(text);
  } catch (erro) {
    throw new Error(fallbackMessage);
  }
}

function lerCarrinho() {
  var dados = localStorage.getItem('pizzaria-carrinho');
  return dados ? JSON.parse(dados) : [];
}

function formatPrice(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function calcularTotal(carrinho) {
  return carrinho.reduce(function (total, item) {
    var preco = Number(item.preco) || 0;
    var quantidade = Number(item.quantidade) || 1;
    return total + (preco * quantidade);
  }, 0);
}

function calcularQuantidadeTotal(carrinho) {
  return carrinho.reduce(function (total, item) {
    return total + (Number(item.quantidade) || 1);
  }, 0);
}

function obterResumoPedido() {
  var carrinho = lerCarrinho();
  var subtotal = calcularTotal(carrinho);
  var tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked');
  var entrega = tipoEntrega && tipoEntrega.value === 'retirada' ? 0 : 12;
  var cupomAtual = localStorage.getItem('pizzaria-cupom') || '';
  var desconto = cupomAtual.toUpperCase() === 'PIZZA10' ? subtotal * 0.10 : 0;

  return {
    carrinho: carrinho,
    subtotal: subtotal,
    entrega: entrega,
    desconto: desconto,
    total: Math.max(0, subtotal + entrega - desconto),
    totalItens: calcularQuantidadeTotal(carrinho)
  };
}

function concluirPedidoLocal(dados) {
  var pedidos = JSON.parse(localStorage.getItem('pizzaria-pedidos-locais') || '[]');
  var pedido = {
    id: 'LOCAL-' + Date.now().toString(36).toUpperCase(),
    criadoEm: new Date().toISOString(),
    status: 'recebido no dispositivo',
    cliente: dados.nome,
    telefone: dados.telefone,
    endereco: dados.endereco,
    pagamento: dados.pagamento,
    itens: dados.carrinho,
    total: dados.resumo.total
  };
  pedidos.push(pedido);
  localStorage.setItem('pizzaria-pedidos-locais', JSON.stringify(pedidos));
  document.querySelector('#pedidoConcluido p').textContent = 'Pedido ' + pedido.id + ' registrado neste dispositivo. A confirmação online será ativada quando o backend estiver conectado.';
  document.getElementById('checkoutLayout').style.display = 'none';
  document.getElementById('pedidoConcluido').style.display = 'block';
  localStorage.removeItem('pizzaria-carrinho');
}

function atualizarResumoCarrinho() {
  var resumo = obterResumoPedido();
  var checkoutTotal = document.getElementById('checkoutTotal');
  var checkoutSubtotal = document.getElementById('checkoutSubtotal');
  var checkoutEntrega = document.getElementById('checkoutEntrega');
  var checkoutDesconto = document.getElementById('checkoutDesconto');
  var checkoutItens = document.getElementById('checkoutItens');

  if (checkoutTotal) {
    checkoutTotal.textContent = formatPrice(resumo.total);
  }

  if (checkoutSubtotal) {
    checkoutSubtotal.textContent = formatPrice(resumo.subtotal);
  }

  if (checkoutEntrega) {
    checkoutEntrega.textContent = formatPrice(resumo.entrega);
  }

  if (checkoutDesconto) {
    checkoutDesconto.textContent = '-' + formatPrice(resumo.desconto);
  }

  if (checkoutItens) {
    checkoutItens.textContent = resumo.totalItens;
  }
}

atualizarResumoCarrinho();

document.querySelectorAll('input[name="tipoEntrega"]').forEach(function (input) {
  input.addEventListener('change', atualizarResumoCarrinho);
});

var btnAplicarCupom = document.getElementById('btnAplicarCupom');
if (btnAplicarCupom) {
  btnAplicarCupom.addEventListener('click', function () {
    var cupomInput = document.getElementById('cupom');
    var codigo = (cupomInput.value || '').trim().toUpperCase();

    if (!codigo) {
      alert('Digite um código de cupom.');
      return;
    }

    if (codigo === 'PIZZA10') {
      localStorage.setItem('pizzaria-cupom', codigo);
      alert('Cupom aplicado com sucesso!');
    } else {
      localStorage.removeItem('pizzaria-cupom');
      alert('Cupom inválido. Tente PIZZA10.');
    }

    atualizarResumoCarrinho();
  });
}

// botão "tentar novamente" volta pro formulário
document.getElementById('btnTentarNovamente').addEventListener('click', function() {
  document.getElementById('pedidoRecusado').style.display = 'none';
  document.getElementById('checkoutLayout').style.display = 'grid';
});

document.getElementById('checkoutForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  var btnConfirmar = document.getElementById('btnConfirmarPedido');
  var checkoutLayout = document.getElementById('checkoutLayout');
  var pedidoConcluido = document.getElementById('pedidoConcluido');
  var pedidoRecusado = document.getElementById('pedidoRecusado');
  var pedidoRecusadoMotivo = document.getElementById('pedidoRecusadoMotivo');

  pedidoConcluido.style.display = 'none';
  pedidoRecusado.style.display = 'none';

  var nome = document.getElementById('nome').value.trim();
  var telefone = document.getElementById('telefone').value.trim();
  var endereco = document.getElementById('endereco').value.trim();
  var observacoes = document.getElementById('observacoes').value.trim();
  var pagamentoInput = document.querySelector('input[name="pagamento"]:checked');
  var pagamento = pagamentoInput ? pagamentoInput.value : null;

  if (!nome || !telefone || !endereco || !pagamento) {
    pedidoRecusadoMotivo.textContent = 'Preencha nome, telefone, endereço e forma de pagamento.';
    checkoutLayout.style.display = 'none';
    pedidoRecusado.style.display = 'block';
    return;
  }

  if (!confirm('Confirma o pedido e será redirecionado para o pagamento?')) {
    return;
  }

  btnConfirmar.disabled = true;
  btnConfirmar.textContent = 'REDIRECIONANDO PARA PAGAMENTO...';

  try {
    var carrinho = lerCarrinho();

    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      throw new Error('Seu carrinho está vazio.');
    }

    var resumo = obterResumoPedido();
    var respostaPedido = await fetch('/api/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: nome,
        telefone: telefone,
        endereco: endereco,
        observacoes: observacoes,
        pagamento: pagamento,
        produtos: carrinho,
        entrega: resumo.entrega,
        desconto: resumo.desconto,
        cupom: localStorage.getItem('pizzaria-cupom') || '',
        tipoEntrega: document.querySelector('input[name="tipoEntrega"]:checked')?.value || 'entrega'
      })
    });

    if ([404, 405].includes(respostaPedido.status)) {
      concluirPedidoLocal({
        nome: nome,
        telefone: telefone,
        endereco: endereco,
        pagamento: pagamento,
        carrinho: carrinho,
        resumo: resumo
      });
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'CONFIRMAR PEDIDO';
      return;
    }

    var dadosPedido = await parseJsonResponse(respostaPedido, 'Não foi possível registrar o pedido. Verifique sua conexão e tente novamente.');

    if (!respostaPedido.ok) {
      throw new Error(dadosPedido.erro || 'Não foi possível registrar o pedido.');
    }

    var respostaConfig = await fetch('/config');
    var configData = await parseJsonResponse(respostaConfig, 'Não foi possível carregar a forma de pagamento.');

    if (!respostaConfig.ok) {
      throw new Error(configData.erro || 'Não foi possível carregar a forma de pagamento.');
    }

    if (!configData.publicKey || !window.MercadoPago) {
      document.querySelector('#pedidoConcluido p').textContent = 'Pedido ' + dadosPedido.pedido.id + ' recebido. A pizzaria já começou a preparar tudo.';
      checkoutLayout.style.display = 'none';
      pedidoConcluido.style.display = 'block';
      localStorage.removeItem('pizzaria-carrinho');
      return;
    }

    var respostaPreferencia = await fetch('/criar-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtos: carrinho, tipoEntrega: resumo.entrega === 0 ? 'retirada' : 'entrega', cupom: localStorage.getItem('pizzaria-cupom') || '' })
    });
    var dadosPreferencia = await parseJsonResponse(respostaPreferencia, 'Pedido salvo, mas o pagamento não pôde ser iniciado.');

    if (!respostaPreferencia.ok) {
      throw new Error(dadosPreferencia.erro || 'Pedido salvo, mas o pagamento não pôde ser iniciado.');
    }

    var mp = new window.MercadoPago(configData.publicKey);

    var existingContainer = document.getElementById('walletBrick_container');
    if (existingContainer) {
      existingContainer.remove();
    }

    var container = document.createElement('div');
    container.id = 'walletBrick_container';
    container.style.width = '100%';
    container.style.marginTop = '20px';

    var wrapper = document.querySelector('.checkout-summary');
    if (wrapper) {
      wrapper.appendChild(container);
    } else {
      checkoutLayout.appendChild(container);
    }

    var bricksBuilder = mp.bricks();
    await bricksBuilder.create('wallet', 'walletBrick_container', {
      initialization: {
        preferenceId: dadosPreferencia.id
      },
      customization: {
        texts: {
          valueProp: 'smart_option'
        }
      }
    });

    checkoutLayout.style.display = 'grid';
    btnConfirmar.disabled = false;
    btnConfirmar.textContent = 'CONFIRMAR PEDIDO';
    pedidoConcluido.style.display = 'block';
    localStorage.removeItem('pizzaria-carrinho');

  } catch (erro) {
    var apiIndisponivel = !respostaPedido || [404, 405].includes(respostaPedido.status) || erro instanceof TypeError;
    if (apiIndisponivel) {
      concluirPedidoLocal({
        nome: nome,
        telefone: telefone,
        endereco: endereco,
        pagamento: pagamento,
        carrinho: lerCarrinho(),
        resumo: obterResumoPedido()
      });
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'CONFIRMAR PEDIDO';
      return;
    }
    pedidoRecusadoMotivo.textContent = erro.message || 'Não foi possível concluir seu pedido. Tente novamente.';
    checkoutLayout.style.display = 'none';
    pedidoRecusado.style.display = 'block';
    btnConfirmar.disabled = false;
    btnConfirmar.textContent = 'CONFIRMAR PEDIDO';
  }
});
