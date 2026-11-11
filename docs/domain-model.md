# Modelo de domínio inicial

- **Empresa:** unidade de isolamento de dados, com moeda base e NU​​IT opcional.
- **Utilizador/Membership:** uma pessoa pode pertencer a várias empresas, com papel por empresa.
- **Obra:** projecto de construção com código único por empresa, cliente, localização, moeda e estado.
- **Item de obra:** elemento hierárquico da EDT/EAP, que pode representar capítulo, actividade ou serviço.
- **Fornecedor:** entidade gerida pela própria empresa.
- **Recurso:** material, mão de obra, equipamento, subempreitada ou outro recurso; preço próprio, fornecedor opcional e custos de transporte/importação.
- **Composição:** versão de uma composição de custo unitário associada a um serviço.
- **Linha de composição:** coeficiente técnico e preço unitário registado na composição. O preço guardado permite rastrear o cálculo histórico.
- **Revisão de orçamento:** conjunto de totais e parâmetros para uma versão do orçamento, com estado de aprovação.
- **Auditoria:** evento associado à empresa, actor e entidade alterada.

## Regras a completar

- A validação de ciclos na hierarquia de itens deve ocorrer na camada de aplicação.
- Aprovações devem usar transacções e impedir edição da revisão aprovada.
- As relações e índices precisam de testes de migração antes de dados reais.
- O esquema inicial é um ponto de partida, não um modelo final certificado.
