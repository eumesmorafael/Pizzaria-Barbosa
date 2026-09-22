const { MercadoPagoConfig, Preference } = require("mercadopago");
const { validarPedido } = require("./lib/pedidos");

exports.handler = async function (event) {
  try {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      return { statusCode: 500, body: JSON.stringify({ erro: "Access Token do Mercado Pago não configurado." }) };
    }

    const resumo = validarPedido(JSON.parse(event.body || "{}"));
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });
    const preference = new Preference(client);
    const resultado = await preference.create({
      body: {
        items: resumo.itens.map((produto) => ({ title: produto.nome, quantity: produto.quantidade, unit_price: produto.preco, currency_id: "BRL" }))
      }
    });

    return { statusCode: 200, body: JSON.stringify({ id: resultado.id, init_point: resultado.init_point || null }) };
  } catch (erro) {
    return { statusCode: 400, body: JSON.stringify({ erro: erro.message || "Não foi possível criar a preferência de pagamento." }) };
  }
};