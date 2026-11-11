# Roteiro de desenvolvimento

## Fase 0 — Fundação
- [x] Definir âmbito e princípios do produto.
- [x] Criar esquema inicial do domínio.
- [x] Criar motor de cálculo isolado.
- [x] Adicionar testes unitários iniciais.
- [x] Adicionar workflow de CI para validar schema, testes, lint e build automaticamente.
- [ ] Instalar dependências e confirmar resultados do CI (execução ainda não verificada).

## Fase 1 — Acesso e obras
- [x] Registo, login e logout com cookie de sessão assinado.
- [ ] Verificação de email, recuperação de conta e limitação de tentativas.
- [x] Definir matriz inicial de permissões por papel.
- [x] Criar esquemas de validação para dados de obra e itens EAP.
- [x] Criar empresa e associação OWNER no registo inicial.
- [x] Resolver papel actual no servidor e aplicar permissões às APIs de obras/EAP.
- [ ] Gestão de membros e troca de empresa activa.
- [x] API inicial de criação, listagem, consulta e actualização de obras.
- [x] API inicial de criação/listagem de itens EAP com validação do capítulo superior.
- [ ] Interface CRUD completa e edição da hierarquia EDT/EAP.
- [ ] Medições, revisões e histórico.
- [x] Registar criação/actualização de obras e criação de itens EAP.
- [ ] Completar auditoria de todas as operações críticas.

## Fase 2 — Recursos e orçamento
- [x] Registo/listagem inicial de fornecedores e preços introduzidos pela empresa.
- [x] Recursos com preços próprios, moeda e custos de importação/transporte/outros.
- [x] Primeira versão de composições de custo unitário com preço congelado por versão.
- [x] Motor isolado de cálculo de custo base, encargos gerais, lucro, imposto configurável e coeficiente K.
- [ ] Cotações com histórico, produtividade e custos horários completos.
- [ ] Integrar composições e motor de cálculo nas revisões de orçamento persistidas.
- [ ] Fluxo de aprovação imutável de revisões.

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
