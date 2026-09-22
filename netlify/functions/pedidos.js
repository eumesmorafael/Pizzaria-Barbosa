const { criarPedido, salvarPedido, buscarPedido } = require("./lib/pedidos");

exports.handler = async function (event) {
  try {
    if (event.httpMethod === "GET") {
      const id = event.path.split("/").filter(Boolean).pop();
      const pedido = await buscarPedido(id);
      return pedido
        ? { statusCode: 200, body: JSON.stringify(pedido) }
        : { statusCode: 404, body: JSON.stringify({ erro: "Pedido não encontrado." }) };
    }

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ erro: "Método não permitido." }) };
    }

    const pedido = criarPedido(JSON.parse(event.body || "{}"));
    await salvarPedido(pedido);
    return { statusCode: 201, body: JSON.stringify({ pedido }) };
  } catch (erro) {
    return { statusCode: 400, body: JSON.stringify({ erro: erro.message || "Não foi possível processar o pedido." }) };
  }
};