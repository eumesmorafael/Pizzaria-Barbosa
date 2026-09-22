const { catalogo } = require("./lib/pedidos");

exports.handler = async function () {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(catalogo)
  };
};