# Configurar Supabase para testar o ObraCerta

O ObraCerta usa PostgreSQL através do Prisma. O projecto Supabase de testes já configurado é `build` (ref: `rihpdhgryyzgknbfyyql`, região `eu-west-1`). A autenticação da aplicação continua a ser a autenticação própria do ObraCerta; não foi substituída por Supabase Auth.

## Estado actual do projecto de teste

- 12 tabelas criadas a partir do esquema Prisma, incluindo empresas, utilizadores, obras, itens de trabalho, fornecedores, recursos, orçamentos, auditoria e medições.
- Duas migrações aplicadas no Supabase.
- RLS activado nas 12 tabelas.
- Permissões de tabela revogadas para os papéis API `anon` e `authenticated`; a aplicação deve aceder à base de dados no servidor através de Prisma, nunca directamente do browser.
- A base de dados está vazia, pronta para dados de teste.

Este é um ambiente de teste. Não introduza dados pessoais ou financeiros reais.

## 1. Obter as URLs de ligação

No Supabase, abra o projecto `build` → **Connect** ou **Project Settings → Database → Connection string**.

1. Copie a ligação **Session pooler** (porta 5432) e use-a como `DATABASE_URL`.
2. Copie a ligação directa (porta 5432) como `DIRECT_URL`, se a rede suportar IPv6. Caso contrário, use a ligação Session pooler também para `DIRECT_URL`.
3. Substitua os valores de exemplo do ficheiro `.env.example`; não altere nem publique as URLs com credenciais reais.

Exemplo de formato (não é uma credencial funcional):

```dotenv
DATABASE_URL="postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:DB_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?schema=public"
SESSION_SECRET="um-segredo-aleatorio-com-pelo-menos-32-caracteres"
```

A palavra-passe da base de dados só pode ser obtida/alterada por alguém com acesso ao painel Supabase. Não a partilhe no chat, GitHub ou browser.

## 2. Testar localmente

Na pasta do repositório, crie `.env` a partir de `.env.example` e preencha as três variáveis com os valores reais. Depois:

```bash
npm install
npx prisma generate
npm run dev
```

Abra `http://localhost:3000/api/health`. Uma ligação correcta deve devolver `database: "connected"`; uma falha de ligação devolve HTTP 503 sem expor detalhes da base de dados.

Em seguida, teste `/acesso`, o registo e login, criação de empresa/obra, recursos e orçamento. Use apenas contas e dados fictícios.

## 3. Testar no deploy (por exemplo, Vercel)

No painel do serviço de deploy, abra as variáveis de ambiente do projecto e adicione `DATABASE_URL`, `DIRECT_URL` e `SESSION_SECRET` para o ambiente de Preview/Teste. Faça um novo deploy e abra `/api/health` no domínio desse deploy.

- Nunca use a chave `service_role` no browser.
- Nunca coloque segredos em variáveis com prefixo `NEXT_PUBLIC_`.
- Não configure produção com estas credenciais de teste.

## 4. Migrações — importante

A estrutura foi criada directamente no Supabase através do conector. O histórico de migrações do Supabase não equivale automaticamente ao histórico interno `_prisma_migrations` do Prisma. Por isso, **não execute `npx prisma migrate deploy` contra esta base de dados antes de alinhar/baselinar o histórico do Prisma**; caso contrário, a migração inicial pode tentar criar tabelas que já existem.

Para os primeiros testes funcionais, use a estrutura actual e não execute novas migrações. Antes de evoluir o esquema, prepare e teste o processo de baselining/migrações do Prisma numa base de dados descartável.

## 5. Segurança

RLS está activado em todas as tabelas públicas e os papéis API `anon` e `authenticated` não têm permissões directas nas tabelas. O acesso previsto para estes testes é feito no servidor através da ligação PostgreSQL usada pelo Prisma. As políticas RLS específicas por empresa/utilizador ainda não foram implementadas; por isso, este ambiente serve para testes controlados, não para produção nem para exposição pública.

