# Roteiro de desenvolvimento

## Fase 0 — Fundação
- [x] Definir âmbito e princípios do produto.
- [x] Criar esquema inicial do domínio.
- [x] Criar motor de cálculo isolado.
- [x] Adicionar testes unitários iniciais.
- [x] Adicionar workflow de CI para validar schema, testes, lint e build automaticamente.
- [ ] Instalar dependências e confirmar resultados do CI (execução local ainda não verificada).

## Fase 1 — Acesso, obras e aprovações
- [x] Registo, login e logout com cookie de sessão assinado.
- [ ] Verificação de email, recuperação de conta e limitação distribuída de tentativas.
- [x] Definir matriz inicial de permissões por papel.
- [x] Criar esquemas de validação para dados de obra e itens EAP.
- [x] Criar empresa e associação OWNER no registo inicial.
- [x] Resolver papel actual no servidor e aplicar permissões às APIs de obras/EAP.
- [ ] Gestão de membros e troca de empresa activa.
- [x] API inicial de criação, listagem, consulta e actualização de obras.
- [x] API inicial de criação/listagem de itens EAP com validação do capítulo superior.
- [ ] Interface CRUD completa e edição da hierarquia EDT/EAP.
- [x] Registo inicial de medições de execução com preço unitário congelado e histórico.
- [x] API de transição de revisão de orçamento: submeter, aprovar e rejeitar com permissões no servidor.
- [x] Bloqueio de transições inválidas e registo de auditoria das decisões de revisão.
- [x] Submissão/aprovação/rejeição de medições com permissões, auditoria e controlo de quantidade acumulada aprovada.
- [ ] Edição controlada e autos de medição exportáveis.
- [ ] Histórico completo de revisões das quantidades orçamentadas.
- [ ] Completar auditoria de todas as operações críticas.

## Fase 2 — Recursos e orçamento
- [x] Registo/listagem inicial de fornecedores e preços introduzidos pela empresa.
- [x] Recursos com preços próprios, moeda e custos de importação/transporte/outros.
- [x] Primeira versão de composições de custo unitário com preço congelado por versão.
- [x] Motor isolado de cálculo de custo base, encargos gerais, lucro, imposto configurável e coeficiente K.
- [ ] Cotações com histórico, produtividade e custos horários completos.
- [ ] Integrar composições e motor de cálculo nas revisões de orçamento persistidas.
- [x] Fluxo de submissão, aprovação/rejeição e substituição de revisão aprovada anterior.
- [ ] Garantir que todas as saídas e a interface reflectem o estado de aprovação.

## Fase 3 — Adaptação operacional a Moçambique
- [ ] MZN como moeda base e moedas alternativas quando necessário.
- [ ] Parâmetros fiscais configuráveis com vigência e tipo de operação.
- [ ] Encargos laborais/seguros configuráveis e validados localmente.
- [ ] Custos de importação, despacho, transporte e logística.
- [ ] Exportação profissional PDF/Excel; CSV existente deve ser validado com dados reais anonimizados.

## Fase 4 — Execução e controlo
- [x] Registo de quantidades executadas e comparação inicial entre orçamento e execução aprovada.
- [x] Fluxo inicial de aprovação/rejeição de medições e controlo de quantidade orçamentada.
- [ ] Autos de medição formais, trabalhos a mais/menos e revisões contratuais.
- [ ] Compras, compromissos e custos reais.
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
- Revisões aprovadas imutáveis, com transições auditadas e permissões de aprovação separadas.
