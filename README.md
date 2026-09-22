# Pizzaria Barbosa

Sistema web de pedidos para uma pizzaria, com cardápio, carrinho, checkout, validação no servidor, Supabase e Mercado Pago.

## Publicar gratuitamente no Netlify

1. No Supabase, abra o SQL Editor e execute o conteúdo de [supabase/schema.sql](supabase/schema.sql).
2. No Netlify, clique em **Add new site > Import an existing project**.
3. Escolha o repositório `eumesmorafael/pizzaria-barbosa`.
4. Configure:

```text
Build command: deixe vazio
Publish directory: .
Functions directory: netlify/functions
```

5. Em **Site configuration > Environment variables**, adicione:

```env
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_de_teste
MERCADO_PAGO_PUBLIC_KEY=sua_public_key_de_teste
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

Use a `service_role_key` somente nas variáveis do Netlify. Nunca coloque essa chave no HTML ou JavaScript do navegador.

Depois do deploy, teste:

```text
https://SEU-SITE.netlify.app/teste
https://SEU-SITE.netlify.app/api/cardapio
```

O checkout continua usando `/api/pedidos`, `/config` e `/criar-preferencia`; o arquivo `netlify.toml` encaminha essas rotas para as Functions automaticamente.

## Desenvolvimento local

```bash
npm install
npm start
```

Acesse `http://localhost:3000`.

## Fluxo demonstrável

1. O cliente escolhe uma pizza no cardápio.
2. O carrinho é atualizado no navegador.
3. O checkout envia os dados para uma Netlify Function.
4. O servidor valida os itens e recalcula os preços usando o catálogo oficial.
5. O pedido é salvo no Supabase.
6. O Mercado Pago cria uma preferência de pagamento de teste.

## Problema resolvido

Pequenas pizzarias precisam receber pedidos com menos erros e centralizar dados de cliente, itens, valores e pagamento. A aplicação atende clientes que querem pedir pelo celular ou computador e oferece uma base para a pizzaria acompanhar os pedidos.

## Tecnologias

- HTML, CSS e JavaScript;
- Node.js e Express para desenvolvimento local;
- Netlify Functions para o back-end publicado;
- Supabase para persistência dos pedidos;
- Mercado Pago para pagamento de teste.
