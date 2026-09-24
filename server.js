const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
require("dotenv").config();

const {
  MercadoPagoConfig,
  Preference
} = require("mercadopago");

const app = express();
const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const catalogPath = path.join(dataDir, "cardapio.json");
const ordersPath = path.join(dataDir, "pedidos.json");
const managementPath = path.join(dataDir, "gestao.json");

const managementResources = [
  "eventos",
  "fornecedores",
  "funcionarios",
  "patrocinadores",
  "produtos",
  "convidados",
  "contratacoes",
  "orcamentos",
  "historico"
];

app.use(express.json());
app.use(express.static(rootDir));

function lerJson(caminho, valorPadrao) {
  try {
    return JSON.parse(fs.readFileSync(caminho, "utf8"));
  } catch (erro) {
    return valorPadrao;
  }
}

function salvarJson(caminho, valor) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(caminho, JSON.stringify(valor, null, 2));
}

function lerGestao() {
  const vazio = managementResources.reduce((dados, recurso) => {
    dados[recurso] = [];
    return dados;
  }, {});
  const dados = lerJson(managementPath, vazio);
  return { ...vazio, ...dados };
}

function salvarGestao(dados) {
  salvarJson(managementPath, dados);
}

function normalizarRegistro(dados) {
  return Object.entries(dados || {}).reduce((registro, [chave, valor]) => {
    if (chave === "id") return registro;
    registro[chave] = typeof valor === "string" ? normalizarTexto(valor, 500) : valor;
    return registro;
  }, {});
}

function normalizarTexto(valor, limite) {
  return String(valor || "").trim().slice(0, limite);
}

function validarPedido(dados) {
  const catalogo = lerJson(catalogPath, []);
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

    return {
      id: itemCatalogo.id,
      nome: itemCatalogo.nome,
      preco: itemCatalogo.preco,
      quantidade
    };
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

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;

if (!accessToken) {
  console.error("ERRO: Access Token não configurado no arquivo .env");
}

if (!publicKey) {
  console.error("ERRO: Public Key não configurada no arquivo .env");
}

const client = accessToken
  ? new MercadoPagoConfig({ accessToken })
  : null;

app.get("/teste", function (req, res) {
  res.json({
    mensagem: "Servidor funcionando corretamente."
  });
});

app.get("/api/cardapio", function (req, res) {
  res.json(lerJson(catalogPath, []));
});

app.get("/api/gestao", function (req, res) {
  res.json(lerGestao());
});

app.get("/api/gestao/:recurso", function (req, res) {
  if (!managementResources.includes(req.params.recurso)) {
    return res.status(404).json({ erro: "Módulo não encontrado." });
  }
  res.json(lerGestao()[req.params.recurso]);
});

app.post("/api/gestao/:recurso", function (req, res) {
  const recurso = req.params.recurso;
  if (!managementResources.includes(recurso)) {
    return res.status(404).json({ erro: "Módulo não encontrado." });
  }
  const dados = lerGestao();
  const registro = { id: crypto.randomUUID(), criadoEm: new Date().toISOString(), ...normalizarRegistro(req.body) };
  dados[recurso].push(registro);
  salvarGestao(dados);
  res.status(201).json(registro);
});

app.put("/api/gestao/:recurso/:id", function (req, res) {
  const recurso = req.params.recurso;
  if (!managementResources.includes(recurso)) {
    return res.status(404).json({ erro: "Módulo não encontrado." });
  }
  const dados = lerGestao();
  const indice = dados[recurso].findIndex((item) => item.id === req.params.id);
  if (indice < 0) return res.status(404).json({ erro: "Registro não encontrado." });
  dados[recurso][indice] = { ...dados[recurso][indice], ...normalizarRegistro(req.body) };
  salvarGestao(dados);
  res.json(dados[recurso][indice]);
});

app.delete("/api/gestao/:recurso/:id", function (req, res) {
  const recurso = req.params.recurso;
  if (!managementResources.includes(recurso)) {
    return res.status(404).json({ erro: "Módulo não encontrado." });
  }
  const dados = lerGestao();
  const quantidadeInicial = dados[recurso].length;
  dados[recurso] = dados[recurso].filter((item) => item.id !== req.params.id);
  if (dados[recurso].length === quantidadeInicial) return res.status(404).json({ erro: "Registro não encontrado." });
  salvarGestao(dados);
  res.status(204).end();
});

app.get("/api/pedidos/:id", function (req, res) {
  const pedido = lerJson(ordersPath, []).find((item) => item.id === req.params.id);

  if (!pedido) {
    return res.status(404).json({ erro: "Pedido não encontrado." });
  }

  res.json(pedido);
});

app.post("/api/pedidos", function (req, res) {
  try {
    const nome = normalizarTexto(req.body.nome, 100);
    const telefone = normalizarTexto(req.body.telefone, 30);
    const endereco = normalizarTexto(req.body.endereco, 240);
    const pagamento = ["pix", "cartao", "dinheiro"].includes(req.body.pagamento)
      ? req.body.pagamento
      : null;

    if (nome.length < 3 || telefone.length < 8 || !pagamento || (req.body.tipoEntrega !== "retirada" && endereco.length < 8)) {
      return res.status(400).json({ erro: "Confira nome, telefone, endereço e forma de pagamento." });
    }

    const resumo = validarPedido(req.body);
    const pedidos = lerJson(ordersPath, []);
    const pedido = {
      id: `PB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      criadoEm: new Date().toISOString(),
      status: "recebido",
      nome,
      telefone,
      endereco: req.body.tipoEntrega === "retirada" ? "Retirada no balcão" : endereco,
      observacoes: normalizarTexto(req.body.observacoes, 300),
      pagamento,
      ...resumo
    };

    pedidos.push(pedido);
    salvarJson(ordersPath, pedidos);
    res.status(201).json({ pedido });
  } catch (erro) {
    res.status(400).json({ erro: erro.message || "Não foi possível registrar o pedido." });
  }
});

app.get("/config", function (req, res) {
  res.json({
    publicKey: publicKey || null
  });
});

app.get("/", function (req, res) {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.post("/criar-preferencia", async function (req, res) {
  try {
    if (!client) {
      return res.status(500).json({
        erro: "Access Token do Mercado Pago não configurado."
      });
    }

    const resumo = validarPedido(req.body);
    const itens = resumo.itens.map(function (produto) {
      return {
        title: produto.nome,
        quantity: produto.quantidade,
        unit_price: produto.preco,
        currency_id: "BRL"
      };
    });

    const preference = new Preference(client);
    const resultado = await preference.create({
      body: {
        items: itens
      }
    });

    res.json({
      id: resultado.id,
      init_point: resultado.init_point || null
    });
  } catch (erro) {
    console.error("Erro do Mercado Pago:", erro);

    res.status(500).json({
      erro: "Não foi possível criar a preferência de pagamento.",
      detalhes: erro.message || String(erro)
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("");
  console.log(`Servidor iniciado. Abra: http://localhost:${PORT}`);
  console.log("");
});
