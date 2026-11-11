# Arquitectura inicial

## Estrutura lógica

- **Interface:** Next.js/React, em português, com formulários e tabelas profissionais.
- **Aplicação:** regras de negócio TypeScript isoladas da interface.
- **Persistência:** PostgreSQL através do Prisma.
- **Cálculo:** funções puras, determinísticas e testáveis em `src/lib/costing.ts`.
- **Auditoria:** registo de eventos relevantes com utilizador, empresa, entidade e dados antes/depois.
- **Exportação:** PDF e Excel numa fase própria, com modelos de relatório versionados.

## Limites de segurança obrigatórios

1. Cada consulta e mutação de negócio deve ser limitada à empresa activa do utilizador no servidor.
2. Não confiar em `companyId`, função ou permissões enviados apenas pelo browser.
3. Aplicar autorização no servidor em cada operação, não apenas esconder botões.
4. A aprovação de uma revisão deve congelar os valores aprovados; alterações posteriores criam nova revisão.
5. Registar alterações relevantes na auditoria, sem guardar palavras-passe, tokens ou segredos.
6. Validar todos os dados de entrada e usar tipos decimais adequados para persistência monetária.
7. Não considerar esta fundação pronta para produção antes de implementar autenticação, autorização, migrações testadas, cópias de segurança e testes de segurança.

## Regra inicial de preço

O motor separa custo directo, custo indirecto, encargos gerais, lucro, imposto parametrizado e preço final. A fórmula inicial é uma convenção explícita e deve ser validada com profissionais locais antes de ser usada em propostas reais.

`K = preço de venda / (custo directo + custo indirecto)`

O coeficiente K não deve ser confundido com margem sobre o preço de venda. A configuração de impostos deve contemplar tipo de operação, vigência temporal e validação contabilística; nenhuma taxa legal é presumida pelo motor.
