# Fórmulas de orçamento — ObraCerta

## Sequência de cálculo

As taxas são introduzidas como percentagens na interface e convertidas para decimais no motor (por exemplo, 10% = 0,10).

1. **Custo base** = custo directo + custo indirecto.
2. **Encargos gerais** = custo base × taxa de encargos gerais.
3. **Custo após encargos** = custo base + encargos gerais.
4. **Lucro previsto** = custo após encargos × taxa de lucro sobre o custo.
5. **Preço de venda antes de impostos** = custo após encargos + lucro previsto.
6. **Imposto** = preço antes de impostos × taxa configurada, quando essa base for aplicável.
7. **Preço de venda final** = preço antes de impostos + imposto calculado.
8. **Coeficiente K** = preço de venda antes de impostos ÷ custo directo.

O coeficiente K deste sistema é definido explicitamente como multiplicador do custo directo para obter o preço de venda antes de impostos. Se o custo directo for zero, K é devolvido como zero e deve ser tratado como não aplicável na apresentação.

## Exemplo ilustrativo

Para custo directo de 100.000 MZN, custo indirecto de 10.000 MZN, encargos gerais de 10%, lucro sobre o custo após encargos de 20% e taxa fiscal hipotética de 16%:

- Custo base: 110.000 MZN
- Encargos gerais: 11.000 MZN
- Custo após encargos: 121.000 MZN
- Lucro previsto: 24.200 MZN
- Preço antes de impostos: 145.200 MZN
- Imposto hipotético: 23.232 MZN
- Preço final: 168.432 MZN
- K: 1,452

**Este exemplo é apenas matemático.** A taxa fiscal e a respectiva base devem ser configuradas por tipo de operação e confirmadas face à legislação em vigor e ao contrato. Não assumir que todos os impostos incidem sempre sobre a mesma base.

## Margem vs. acréscimo (markup)

Uma taxa de lucro de 25% aplicada ao custo de 100 gera preço de 125. A margem sobre o preço é 25/125 = 20%, não 25%. A interface e os relatórios devem indicar sempre qual das duas métricas está a ser usada.

## Limites actuais

O motor de cálculo é uma função isolada e testável. A sua integração com revisões de orçamento, composição completa dos custos directos, parâmetros fiscais versionados e relatórios ainda é trabalho por concluir. Os valores monetários devem ser arredondados conforme regras definidas para apresentação; os cálculos contabilísticos finais devem ser validados antes de uso contratual.
