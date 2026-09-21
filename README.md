# Aula de Integração com Mercado Pago

## Objetivo da aula

Nesta atividade vamos conectar um site de vendas a um serviço de pagamento.

Cada aluno terá seu próprio:

```text
Front-end
+
Back-end Node.js

+

Integração com Mercado Pago
```

O professor fornecerá duas credenciais de TESTE:

```text
Public Key
Access Token
```

Use somente as credenciais de teste fornecidas pelo professor.


# 1. Estrutura do projeto

Ao final, nossa pasta terá:

```text
aula_mercado_pago_alunos
│
├── public
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── server.js
├── package.json
├── .env
└── .env.example
```


# 2. Abrir o CMD

Nesta aula vamos utilizar o CMD.

Não use o PowerShell.

Em alguns computadores o PowerShell pode bloquear o npm e apresentar:

```text
npm.ps1 não pode ser carregado
```

Para evitar isso:

```text
Menu Iniciar
↓
Digite: cmd
↓
Enter
```


# 3. Entrar na pasta do projeto

No CMD, entre na pasta.

Exemplo:

```cmd
cd "C:\Users\Aluno\Documents\aula_mercado_pago_alunos"
```

Se o caminho possuir espaços, mantenha as aspas.


# 4. Verificar Node e npm

Digite:

```cmd
node -v
```

Depois:

```cmd
npm -v
```

Se aparecerem números de versão, podemos continuar.

Exemplo:

```text
v24.0.0
```


# 5. Criar o projeto Node

Se o `package.json` já existir no material entregue pelo professor, você pode pular este comando.

Caso esteja criando do zero:

```cmd
npm init -y
```


# 6. Instalar as bibliotecas

Execute:

```cmd
npm install express mercadopago dotenv
```

Vamos utilizar:

```text
express
mercadopago
dotenv
```

### Express

Cria nosso servidor.

### mercadopago

Biblioteca usada para conversar com a API do Mercado Pago.

### dotenv

Permite guardar as credenciais no arquivo `.env`.


# 7. Criar o arquivo .env

Existe um arquivo chamado:

```text
.env.example
```

Faça uma cópia e renomeie para:

```text
.env
```

O conteúdo será:

```env
MERCADO_PAGO_ACCESS_TOKEN=COLE_AQUI_O_ACCESS_TOKEN_DE_TESTE
MERCADO_PAGO_PUBLIC_KEY=COLE_AQUI_A_PUBLIC_KEY_DE_TESTE
PORT=3000
```

O professor fornecerá as chaves.

Atenção:

```text
.env
```

não pode virar:

```text
.env.txt
```


# 8. Entender as duas chaves

## Public Key

É utilizada no front-end para iniciar o Mercado Pago.

## Access Token

É utilizado no back-end para criar a preferência de pagamento.

Nesta aula estamos usando credenciais de TESTE.

Nunca coloque o Access Token diretamente no:

```text
index.html
```

ou:

```text
script.js
```

Ele ficará no `.env`.


# 9. Criar o servidor

Abra:

```text
server.js
```

Observe:

```javascript
const express = require("express");

const path = require("path");

require("dotenv").config();
```

Depois importamos:

```javascript
const {
    MercadoPagoConfig,
    Preference
} = require("mercadopago");
```


# 10. Ler o Access Token

O servidor busca:

```javascript
process.env.MERCADO_PAGO_ACCESS_TOKEN
```

e cria o cliente:

```javascript
const client =
    new MercadoPagoConfig({
        accessToken:
            accessToken
    });
```


# 11. Servir o front-end

Nosso projeto usa:

```javascript
app.use(
    express.static(
        path.join(__dirname, "public")
    )
);
```

Isso faz com que o Node também abra:

```text
index.html
style.css
script.js
```

Por isso NÃO vamos abrir o HTML por duplo clique.

Também não precisamos de Live Server.


# 12. Testar o servidor

No CMD:
t
```cmd
node server.js
```

Deve aparecer:

```text
Servidor iniciado. Abra: http://localhost:3000
```

Abra:

```text
http://localhost:3000/teste
```

Deve aparecer:

```json
{
  "mensagem": "Servidor funcionando corretamente."
}
```


# 13. Abrir o projeto

Agora abra:

```text
h   
```

Importante:

Não abra assim:

```text
file:///...
```

Não use duplo clique no `index.html`.

Use:

```text
http://localhost:3000
```


# 14. Entender o carrinho

Cada produto terá:

```javascript
{
    nome:
        "Pizza Calabresa",

    preco:
        39.90,

    quantidade:
        1
}
```

Quando adicionamos outro produto igual:

```javascript
produtoExistente.quantidade++;
```


# 15. Por que quantidade é obrigatória?

O Mercado Pago precisa receber:

```javascript
{
    title:
        "Pizza Calabresa",

    quantity:
        1,

    unit_price:
        39.90,

    currency_id:
        "BRL"
}
```

A propriedade:

```text
quantity
```

é obrigatória.

Se ela não for enviada, pode aparecer:

```text
quantity needed
```

Por isso nosso servidor possui:

```javascript
quantity:
    Number(produto.quantidade) || 1
```

Mesmo que a quantidade não chegue corretamente, ele usa:

```text
1
```

como valor padrão.


# 16. Criar a preferência de pagamento

O front-end envia o carrinho para:

```text
/criar-preferencia
```

O servidor transforma os produtos e usa:

```javascript
const preference =
    new Preference(client);
```

Depois:

```javascript
const resultado =
    await preference.create({
        body: {
            items:
                itens
        }
    });
```


# 17. O que é uma preferência?

A preferência representa o pedido que será enviado ao Mercado Pago.

Ela possui os itens e os valores daquele pagamento.

Depois de criada, recebemos:

```javascript
resultado.id
```

Esse valor é chamado de:

```text
Preference ID
```


# 18. Public Key no front-end

O `script.js` chama:

```javascript
fetch("/config")
```

O servidor devolve somente a:

```text
Public Key
```

Depois usamos:

```javascript
mercadoPago =
    new MercadoPago(
        config.publicKey
    );
```


# 19. Enviar o carrinho

Ao clicar em:

```text
Finalizar pedido
```

executamos:

```javascript
finalizarPagamento()
```

Dentro dela:

```javascript
fetch(
    "/criar-preferencia",
    {
        method:
            "POST",

        headers: {
            "Content-Type":
                "application/json"
        },

        body:
            JSON.stringify({
                produtos:
                    carrinho
            })
    }
)
```

Aqui o front-end está conversando com o back-end.


# 20. Criar o botão do Mercado Pago

Quando o servidor devolver o `Preference ID`, fazemos:

```javascript
const bricksBuilder =
    mercadoPago.bricks();
```

Depois:

```javascript
await bricksBuilder.create(
    "wallet",
    "walletBrick_container",
    {
        initialization: {
            preferenceId:
                dados.id
        }
    }
);
```

O botão aparecerá dentro de:

```html
<div
    id="walletBrick_container"
>
</div>
```


# 21. Teste completo

Faça:

```text
1. Adicione uma pizza
2. Adicione um refrigerante
3. Aumente a quantidade
4. Confira o total
5. Clique em Finalizar pedido
6. Aguarde "Pagamento criado"
7. Confira se apareceu o botão do Mercado Pago
8. Clique no botão
```


# 22. Erros importantes

## Erro 1

```text
npm.ps1 não pode ser carregado
```

Você abriu PowerShell.

Use:

```text
CMD
```


## Erro 2

```text
quantity needed
```

Confira se cada produto possui:

```javascript
quantidade:
    1
```

O servidor já possui a proteção:

```javascript
Number(produto.quantidade) || 1
```


## Erro 3

```text
auto_return invalid
```

Nesta primeira aula NÃO utilizaremos:

```javascript
auto_return
```

nem:

```javascript
back_urls
```

Essa configuração foi retirada propositalmente.

Nosso objetivo nesta aula é:

```text
Carrinho
↓
Criar preferência
↓
Abrir Checkout
```


## Erro 4

```text
Erro ao conectar ao servidor
```

Primeiro confira:

```text
http://localhost:3000/teste
```

Se não abrir, verifique o CMD.

O servidor precisa estar rodando:

```cmd
node server.js
```


## Erro 5

O botão não apareceu

Abra:

```text
F12
↓
Console
```

Depois confira o CMD onde o servidor está rodando.

Quando funcionar, o CMD deve mostrar:

```text
Itens enviados ao Mercado Pago
```

e depois:

```text
Preferência criada
```


# 23. Como parar o servidor

No CMD:

```text
Ctrl + C
```

Para iniciar novamente:

```cmd
node server.js
```


# 24. Fluxo final da aplicação

```text
USUÁRIO
↓
Adiciona produtos

CARRINHO
↓
nome
preço
quantidade

FRONT-END
↓
fetch()

NODE.JS
↓
Access Token

MERCADO PAGO
↓
Preference ID

FRONT-END
↓
Wallet Brick

CHECKOUT
```


# 25. Desafios para quem terminar

Depois que o pagamento estiver funcionando, adicione:

1. Campo nome do cliente.
2. Campo telefone.
3. Endereço.
4. Campo de observações.
5. Taxa de entrega.
6. Opção "Retirar no local".
7. Exibir quantidade total de itens.
8. Cupom de desconto.
9. Botão "Limpar carrinho".
10. Tela de confirmação antes de criar a preferência.

Não altere o código do pagamento enquanto estiver fazendo os desafios.
