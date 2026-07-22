# Expendly API

API NestJS para organização financeira pessoal, com PostgreSQL, TypeORM, autenticação JWT e isolamento integral por usuário.

## Execução

Requisitos: Node.js 22+, npm 10+ e Docker com Compose.

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run migration:run
npm run seed
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger em desenvolvimento: `http://localhost:3000/api/docs`
- Health: `GET http://localhost:3000/api/v1/health`

O banco é configurado por `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`. `DATABASE_URL` é opcional e, quando definida, tem precedência. CORS usa `CORS_ORIGIN`, aceitando origens separadas por vírgula.

## Autenticação

### Registro

`POST /api/v1/auth/register`

```json
{ "nome": "Ana", "email": "ana@example.com", "senha": "SenhaForte123!" }
```

Retorna o usuário, sem senha e sem tokens:

```json
{ "id": "uuid", "nome": "Ana", "email": "ana@example.com", "createdAt": "...", "updatedAt": "..." }
```

### Login e refresh

`POST /api/v1/auth/login` com `{ "email": "...", "senha": "..." }`.

`POST /api/v1/auth/refresh` com `{ "refreshToken": "..." }`.

Ambos retornam:

```json
{ "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }
```

`POST /api/v1/auth/logout` é privado, exige Bearer access token e recebe `{ "refreshToken": "..." }`. O refresh token precisa pertencer ao usuário autenticado. Refresh tokens nunca são persistidos em texto puro: apenas hash bcrypt, expiração, revogação e `jti` são armazenados. Cada refresh efetua rotação transacional.

## Endpoints

Todos, exceto registro, login, refresh e health, exigem `Authorization: Bearer <accessToken>`.

| Recurso | Endpoints |
| --- | --- |
| Usuário | `GET /users/me`, `PATCH /users/me` com somente `nome` e/ou `email` |
| Categorias | `POST/GET /categories`, `GET/PATCH/DELETE /categories/:id` |
| Receitas | `POST/GET /income`, `GET/PATCH/DELETE /income/:id` |
| Cartões | `POST/GET /credit-cards`, `GET/PATCH/DELETE /credit-cards/:id` |
| Contas fixas | `POST/GET /fixed-bills`, `GET/PATCH/DELETE /fixed-bills/:id` |
| Open Finance | `POST/GET /open-finance/items`, `GET/DELETE /open-finance/items/:id`, `POST /open-finance/connect-token` |
| Transações | `GET /transactions`, `GET/PATCH /transactions/:id` |

`POST /open-finance/connect-token` retorna `501` com mensagem clara até um adaptador real implementar `OpenFinanceProvider`. Só pode existir uma conexão diferente de `DESCONECTADO` por usuário. DELETE de item apenas muda o status para `DESCONECTADO` e preserva suas transações.

Não existem endpoints públicos para criar ou excluir transações. Elas são importadas pelo provider ou inseridas internamente pelo seed.

## Contratos financeiros

Categoria recebe `{ "nome": " alimentação " }` e armazena `ALIMENTAÇÃO`. O nome é único por usuário. Excluir categoria vinculada retorna `409` com `error: "CATEGORY_HAS_LINKED_TRANSACTIONS"`.

Receita:

```json
{
  "tipo": "SALARIO",
  "nome": "Salário",
  "valor": "5000.00",
  "recorrencia": "MENSAL",
  "dataRecebimento": "2026-07-05"
}
```

Enums: `tipo` é `SALARIO` ou `EXTRA`; `recorrencia` é `UNICA` ou `MENSAL`. A listagem aceita `tipo`, `recorrencia`, `dataInicio`, `dataFim`, `page` e `limit`.

Cartão recebe `nome`, `diaFechamento`, `diaVencimento`, e opcionalmente `tipo: "CREDITO"` e `ativo`. A listagem filtra por `ativo` e `tipo`. Excluir cartão vinculado retorna `409` com `error: "CREDIT_CARD_HAS_LINKED_TRANSACTIONS"`.

Conta fixa recebe `nome`, `valor`, `diaVencimento` e opcionalmente `ativo`. A listagem filtra por `ativo`.

Valores monetários de entrada são strings decimais positivas com até duas casas, como `"120.50"`. O PostgreSQL usa `numeric(14,2)` e a API os transforma consistentemente em números.

## Transações

Filtros: `categoriaId`, `creditCardId`, `status`, `dataInicio`, `dataFim`, `page` e `limit`.

O PATCH aceita exclusivamente:

```json
{ "categoriaId": "uuid-ou-null", "descricao": "Mercado ou null", "creditCardId": "uuid-ou-null" }
```

Todos os campos são opcionais e aceitam `null`. Descrição é trimada; string vazia vira `null`. O status é recalculado para `QUALIFICADA` somente quando categoria válida, cartão válido e descrição não vazia estão presentes; caso contrário é `PENDENTE`. Categoria e cartão precisam pertencer ao usuário autenticado. Propriedades como `nomeOriginal`, `valor`, `data`, `status` e `bankConnectionId` são rejeitadas.

Transações não possuem `userId`. O isolamento é feito obrigatoriamente por join com `bankConnection.userId`. Recursos de outro usuário retornam 404.

## Paginação e erros

Listagens paginadas usam defaults `page=1`, `limit=20`, máximo 100:

```json
{ "data": [], "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 } }
```

Erros seguem:

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": ["campo inválido"],
  "timestamp": "2026-07-21T00:00:00.000Z",
  "path": "/api/v1/recurso"
}
```

## Banco, seed e qualidade

`synchronize` é `false` na aplicação e no DataSource. A migração inicial define exatamente os enums, índices, checks e FKs usados pelas entidades.

```bash
npm run migration:run
npm run migration:revert
npm run migration:generate
npm run migration:create
npm run seed
npm run format
npm run lint
npm run build
npm test
```

O seed de desenvolvimento cria usuário, categoria, cartão, receita, conta fixa, conexão e transação e recusa execução em produção. Credenciais padrão: `demo@expendly.local` / `ChangeMe123!`; altere com `SEED_USER_EMAIL` e `SEED_USER_PASSWORD`.

O e2e requer PostgreSQL separado ou o Compose, `.env` válido e migração aplicada. Para isolamento completo, use um banco dedicado, por exemplo `POSTGRES_DB=expendly_test`, e execute a migração nele antes do teste:

```bash
npm run test:e2e
```

Logs Pino são estruturados e removem senha, refresh token e autorização. Eventos de autenticação, atualização e CRUD registram apenas identificadores não sensíveis.
