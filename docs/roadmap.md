# Roteiro de desenvolvimento

## Fase 0 — Fundação
- [x] Definir âmbito e princípios do produto.
- [x] Criar esquema inicial do domínio.
- [x] Criar motor de cálculo isolado.
- [x] Adicionar testes unitários iniciais.
- [x] Adicionar workflow de CI para validar schema, testes, lint e build automaticamente.
- [ ] Confirmar resultados completos de CI em cada lote.

## Fase 1 — Acesso e obras
- [x] Registo, login e logout com cookie de sessão assinado.
- [ ] Verificação de email, recuperação de conta e limitação de tentativas.
- [x] Matriz de permissões por papel com cobertura unitária para todos os papéis e permissões.
- [x] Esquemas de validação para dados de obra e itens EAP.
- [x] Criação de empresa e associação OWNER no registo inicial.
- [x] Resolver papel actual no servidor e aplicar permissões às APIs de obras/EAP.
- [ ] Gestão de membros e troca de empresa activa.
- [x] API inicial de criação, listagem, consulta e actualização de obras.
- [x] API inicial de criação/listagem de itens EAP com validação do capítulo superior.
- [ ] Interface CRUD completa e edição da hierarquia EDT/EAP.
- [x] Registo inicial de medições de execução com quantidade, período, preço unitário congelado e histórico.
- [ ] Autos de medição exportáveis e edição controlada.
- [ ] Histórico completo de revisões das quantidades orçamentadas.
- [ ] Completar auditoria de todas as operações críticas.

## Fase 2 — Recursos e orçamento
- [x] Registo/listagem inicial de fornecedores e preços introduzidos pela empresa.
- [x] Recursos com preços próprios, moeda e custos de importação/transporte/outros.
- [x] Composições de custo unitário com preço congelado por versão.
- [x] Motor de cálculo de custo base, encargos gerais, lucro, imposto configurável e coeficiente K.
- [ ] Cotações com histórico, produtividade e custos horários completos.
- [ ] Integrar e validar cálculo e persistência de todas as revisões.
- [ ] Confirmar imutabilidade da revisão aprovada em todos os endpoints.

## Fase 3 — Segurança e isolamento multiempresa
- [x] Matriz de permissões testada para cada papel e cada permissão.
- [x] Documentar plano de testes de isolamento multiempresa e critérios de aceitação.
- [ ] Testes de integração de acesso cruzado com PostgreSQL.
- [ ] Rate limiting partilhado para autenticação.
- [ ] Recuperação segura de conta e verificação de email.
- [ ] Auditoria completa das operações críticas.
- [ ] Revisão de origem/CSRF em todas as rotas de escrita.

## Fase 4 — Adaptação operacional a Moçambique
- [ ] MZN como moeda base e moedas alternativas quando necessário.
- [ ] Parâmetros fiscais configuráveis com vigência e tipo de operação.
- [ ] Encargos laborais/seguros configuráveis e validados localmente.
- [ ] Custos de importação, despacho, transporte e logística.
- [ ] Exportação profissional PDF/Excel.

## Fase 5 — Execução e controlo
- [x] Registo de quantidades executadas e comparação inicial entre orçamento e execução aprovada.
- [ ] Aprovação de medições validada por testes de integração concorrentes.
- [ ] Autos de medição formais, trabalhos a mais/menos e revisões contratuais.
- [ ] Compras, compromissos e custos reais.
- [ ] Fluxo de caixa e análise de desvios.

## Fase 6 — Preparação para produção
- [ ] Testes unitários, integração, autorização e isolamento multiempresa.
- [ ] Revisão de segurança e dependências.
- [ ] Migrações e estratégia de backup/restauro testadas.
- [ ] Verificação de cálculos por especialista de orçamentação e contabilista local.
- [ ] Relatórios PDF/Excel testados com dados reais anonimizados.
- [ ] Monitorização, alertas e procedimentos de recuperação documentados.
