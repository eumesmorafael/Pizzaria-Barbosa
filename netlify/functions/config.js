exports.handler = async function () {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || null })
  };
};