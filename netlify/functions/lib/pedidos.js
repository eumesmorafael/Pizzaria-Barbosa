const crypto = require("crypto");
const catalogo = require("../../../data/cardapio.json");

function normalizarTexto(valor, limite) {
  return String(valor || "").trim().slice(0, limite);
}

function validarPedido(dados) {
  const produtos = Array.isArray(dados.produtos) ? dados.produtos : [];

  if (!produtos.length) {
    throw new Error("O carrinho está vazio.");
  }

  const itens = produtos.map((produto) => {
    const itemCatalogo = catalogo.find((item) => item.id === produto.id || item.nome === produto.nome);
    const quantidade = Number(produto.quantidade);

    if (!itemCatalogo || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) {
      throw new Error("Um dos itens do carrinho é inválido.");
    }

    return { id: itemCatalogo.id, nome: itemCatalogo.nome, preco: itemCatalogo.preco, quantidade };
  });

  const subtotal = itens.reduce((total, item) => total + item.preco * item.quantidade, 0);
  const tipoEntrega = dados.tipoEntrega === "retirada" ? "retirada" : "entrega";
  const entrega = tipoEntrega === "retirada" ? 0 : 12;
  const cupom = normalizarTexto(dados.cupom, 30).toUpperCase();
  const desconto = cupom === "PIZZA10" ? subtotal * 0.1 : 0;

  return {
    itens,
    subtotal,
    entrega,
    desconto,
    total: Number((subtotal + entrega - desconto).toFixed(2)),
    tipoEntrega,
    cupom: cupom === "PIZZA10" ? cupom : null
  };
}

function criarPedido(dados) {
  const nome = normalizarTexto(dados.nome, 100);
  const telefone = normalizarTexto(dados.telefone, 30);
  const endereco = normalizarTexto(dados.endereco, 240);
  const pagamento = ["pix", "cartao", "dinheiro"].includes(dados.pagamento) ? dados.pagamento : null;

  if (nome.length < 3 || telefone.length < 8 || !pagamento || (dados.tipoEntrega !== "retirada" && endereco.length < 8)) {
    throw new Error("Confira nome, telefone, endereço e forma de pagamento.");
  }

  return {
    id: crypto.randomUUID(),
    criadoEm: new Date().toISOString(),
    status: "pendente",
    nome,
    telefone,
    endereco: dados.tipoEntrega === "retirada" ? "Retirada no balcão" : endereco,
    observacoes: normalizarTexto(dados.observacoes, 300),
    pagamento,
    ...validarPedido(dados)
  };
}

async function salvarPedido(pedido) {
  const resposta = await fetch(`${process.env.SUPABASE_URL}/rest/v1/pedidos`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      id: pedido.id,
      nome: pedido.nome,
      telefone: pedido.telefone,
      endereco: pedido.endereco,
      pagamento: pedido.pagamento,
      total: pedido.total,
      status: pedido.status,
      criado_em: pedido.criadoEm,
      dados: pedido
    })
  });

  if (!resposta.ok) {
    throw new Error("Não foi possível salvar o pedido no Supabase.");
  }
}

async function buscarPedido(id) {
  const resposta = await fetch(`${process.env.SUPABASE_URL}/rest/v1/pedidos?id=eq.${encodeURIComponent(id)}&select=dados`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const dados = await resposta.json();
  return dados[0] ? dados[0].dados : null;
}

module.exports = { catalogo, validarPedido, criarPedido, salvarPedido, buscarPedido };