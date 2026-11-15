# Configurar Supabase para testar o ObraCerta

O ObraCerta usa PostgreSQL através do Prisma. O Supabase fornece a base de dados PostgreSQL; a autenticação da aplicação continua a ser a autenticação própria do ObraCerta (não activar nem substituir por Supabase Auth nesta configuração).

## 1. Criar o projecto

1. Crie um projecto em https://supabase.com/dashboard.
2. Guarde a palavra-passe da base de dados num gestor de segredos.
3. Em **Project Settings → Database → Connection string**, obtenha:
   - `DATABASE_URL`: preferencialmente o Session Pooler (porta 5432) para o servidor da aplicação;
   - `DIRECT_URL`: ligação directa para executar migrações. Se a rede não suportar IPv6, use o Session Pooler.
4. Copie os valores para o ambiente local `.env` (a partir de `.env.example`) e para os Environment Variables do serviço onde a aplicação está publicada.

Não coloque as URLs reais, a palavra-passe ou `SESSION_SECRET` no GitHub nem em código client-side. Use apenas variáveis de ambiente de servidor.

## 2. Validar a ligação

Depois de configurar as variáveis, execute:

```bash
npm install
npx prisma generate
npm run dev
```

Abra `/api/health`. Uma ligação válida responde com `database: "connected"`; uma ligação indisponível responde com HTTP 503 sem expor detalhes sensíveis.

## 3. Atenção às migrações existentes

O repositório tem actualmente a migração de medições de execução, mas não contém uma migração inicial que crie todas as tabelas do esquema. Por isso, **não execute ainda `npx prisma migrate deploy` numa base de dados Supabase vazia**: a migração de medições depende das tabelas `Project` e `WorkItem` já existirem.

Para uma base de dados de teste nova, reveja primeiro o esquema e gere uma migração inicial completa, depois teste-a numa base vazia antes de aplicar migrações subsequentes. `prisma db push` pode ser usado apenas como atalho temporário num projecto descartável de desenvolvimento; não o use como estratégia de migração de produção.

## 4. Preparar o primeiro teste

- Use um projecto Supabase dedicado a testes, sem dados reais.
- Crie um `SESSION_SECRET` aleatório com pelo menos 32 caracteres.
- Registe uma conta de teste na página `/acesso`.
- Verifique criação de empresa, login, criação de obra, recursos e orçamento.
- Não exponha a chave `service_role` no browser. Esta configuração não precisa dessa chave.

## Limite desta alteração

Esta documentação e a verificação de saúde da base de dados preparam a aplicação para Supabase. Não criam um projecto Supabase nem configuram segredos de deploy automaticamente; isso exige acesso à conta Supabase e ao ambiente de publicação.
