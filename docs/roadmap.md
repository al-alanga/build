# Roteiro de desenvolvimento

## Fase 0 — Fundação
- [x] Definir âmbito e princípios do produto.
- [x] Criar esquema inicial do domínio.
- [x] Criar motor de cálculo isolado.
- [x] Adicionar testes unitários iniciais.
- [ ] Instalar dependências e executar testes/build em ambiente real.

## Fase 1 — Acesso e obras
- [ ] Autenticação segura e recuperação de conta.
- [ ] Empresas, membros, papéis e permissões no servidor.
- [ ] CRUD de obras e hierarquia EDT/EAP.
- [ ] Medições, revisões e histórico.
- [ ] Auditoria de operações críticas.

## Fase 2 — Recursos e orçamento
- [ ] Fornecedores, cotações e preços introduzidos pela empresa.
- [ ] Recursos, produtividade e custos horários.
- [ ] Composições de custo unitário versionadas.
- [ ] Custos directos/indirectos e parâmetros de cálculo.
- [ ] Simulação e aprovação imutável de revisões.

## Fase 3 — Adaptação operacional a Moçambique
- [ ] MZN como moeda base e moedas alternativas quando necessário.
- [ ] Parâmetros fiscais configuráveis com vigência e tipo de operação.
- [ ] Encargos laborais/seguros configuráveis e validados localmente.
- [ ] Custos de importação, despacho, transporte e logística.
- [ ] Exportação profissional PDF/Excel.

## Fase 4 — Execução e controlo
- [ ] Quantidades executadas e autos de medição.
- [ ] Compras, compromissos e custos reais.
- [ ] Trabalhos a mais/menos e revisões contratuais.
- [ ] Fluxo de caixa e análise de desvios.

## Fase 5 — Evolução
- [ ] Análise ABC e dashboards.
- [ ] Integrações e importação/exportação avançada.
- [ ] Melhorias de funcionamento em conectividade limitada.
- [ ] Dados de referência externos apenas se houver necessidade validada.

## Critérios mínimos antes de produção
- Testes unitários, integração e autorização multiempresa.
- Revisão de segurança e dependências.
- Migrações e estratégia de backup/restauro testadas.
- Verificação de cálculos por especialista de orçamentação e contabilista local.
- Relatórios testados em PDF/Excel com dados reais anonimizados.
