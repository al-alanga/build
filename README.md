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

Fundação inicial: documentação de produto, modelo de dados e motor de cálculo de custos. A aplicação ainda não está pronta para produção. Autenticação, persistência, testes de integração, autorização e implantação devem ser concluídos antes de uso com dados reais.

## Desenvolvimento local

Requer Node.js LTS e PostgreSQL.

```bash
npm install
cp .env.example .env
# configure DATABASE_URL no .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Interface inicial

- Painel: `/`
- Simulador de orçamento: `/simulador` (valores temporários, não persistidos)
- Entrada do módulo de obras: `/obras` (ainda sem cadastro persistente)
- Verificação básica da aplicação: `/api/health`

## Documentação

- [Segurança e isolamento multiempresa](docs/security.md)
- [Arquitectura](docs/architecture.md)
- [Modelo de domínio](docs/domain-model.md)
- [Roteiro de desenvolvimento](docs/roadmap.md)
