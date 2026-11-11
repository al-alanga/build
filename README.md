# ObraCerta — Orçamentação e Controlo de Obras

Sistema profissional de orçamentação e controlo financeiro de obras, concebido para empresas de construção em Moçambique.

## Objetivo da versão 1.0

- Gestão de empresas, utilizadores e permissões.
- Obras e Estrutura de Decomposição do Trabalho (EDT/EAP).
- Quantidades e medições com histórico de revisões.
- Recursos, mão de obra, equipamentos e fornecedores.
- Composições de custos unitários (CCU).
- Custos directos e indirectos, coeficiente K e preço de venda.
- Análise ABC, relatórios profissionais e registo de auditoria.

A plataforma educacional é um produto separado e não faz parte deste repositório.

## Princípios do produto

1. **Rastreabilidade:** cada total deve poder ser explicado a partir das quantidades, preços e coeficientes que o originaram.
2. **Histórico:** revisões aprovadas não devem ser alteradas silenciosamente.
3. **Preços próprios:** cada empresa regista os preços dos seus fornecedores e cotações. Não existe catálogo de preços de mercado na versão 1.0.
4. **Contexto moçambicano:** MZN como moeda base inicial; impostos e encargos serão parâmetros configuráveis, nunca percentagens legais fixas embutidas no código.
5. **Separação de responsabilidades:** orçamento, aprovação e auditoria devem ter permissões distintas.
6. **Evolução incremental:** começar pelo motor de custos e orçamento antes de tentar construir um ERP completo.

## Stack inicial proposta

- Next.js + TypeScript
- PostgreSQL + Prisma
- Testes unitários para regras de cálculo
- Interface em português

Esta stack é a base inicial e poderá ser ajustada antes de funcionalidades críticas, caso surjam requisitos técnicos incompatíveis.

## Estado actual

Fundação e primeiro fluxo de acesso implementados: registo de conta/empresa, início e fim de sessão, sessão assinada, permissões iniciais e APIs protegidas para obras e itens EAP. A aplicação ainda não está pronta para produção; faltam controlos contra abuso, recuperação/verificação de conta, migrações aplicadas, testes de integração e validação de implantação.

## Desenvolvimento local

Requer Node.js LTS e PostgreSQL.

```bash
npm install
cp .env.example .env
# configure DATABASE_URL e SESSION_SECRET no .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Interface inicial

- Painel: `/`
- Simulador de orçamento: `/simulador` (valores temporários, não persistidos)
- Acesso / registo: `/acesso`
- Recursos e fornecedores: `/recursos`
- Obras e EAP: `/obras` (página de âmbito; API inicial protegida disponível)
- API de obras: `GET/POST /api/projects`; `GET/PATCH /api/projects/:projectId`
- API EAP: `GET/POST /api/projects/:projectId/items`
- API de fornecedores: `GET/POST /api/suppliers`
- API de recursos: `GET/POST /api/resources`
- API de composições: `GET/POST /api/projects/:projectId/items/:itemId/compositions`
- API de sessão: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Verificação básica da aplicação: `/api/health`

## Documentação

- [Segurança e isolamento multiempresa](docs/security.md)
- [Arquitectura](docs/architecture.md)
- [Modelo de domínio](docs/domain-model.md)
- [Roteiro de desenvolvimento](docs/roadmap.md)
- [Fórmulas do orçamento e coeficiente K](docs/budget-formulas.md)
