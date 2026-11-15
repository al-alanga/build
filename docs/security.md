# Segurança e isolamento multiempresa

## Controlos presentes no código

- Palavra-passe guardada como hash bcrypt, nunca em texto simples.
- Sessão assinada com JWT HS256, cookie HttpOnly, SameSite=Lax e Secure em produção.
- Segredo de sessão obrigatório com pelo menos 32 caracteres.
- Associação e papel actual são reconsultados na base de dados em cada pedido autenticado.
- APIs de obras e EAP exigem sessão e verificam permissões no servidor.
- Consultas de obras e itens EAP são limitadas à empresa autenticada.
- Criação e actualização de obras e criação de itens EAP geram registos de auditoria.
- Validação de dados com Zod e verificações de origem nas operações de escrita da API.
- Testes unitários de matriz de permissões cobrem todos os papéis e permissões conhecidas.

## Regras obrigatórias para todos os módulos

1. Todas as operações de negócio exigem sessão autenticada válida.
2. A empresa activa e o papel devem ser obtidos e validados no servidor através das associações do utilizador.
3. Nunca confiar em `companyId`, papel, utilizador ou estado de aprovação enviados pelo cliente.
4. Toda a leitura e escrita deve ser limitada à empresa autorizada; os IDs recebidos devem ser consultados dentro desse âmbito.
5. Aplicar permissões por acção com `src/lib/authorization.ts`.
6. Validar entradas no servidor com esquemas Zod e rejeitar dados malformados, não finitos ou fora dos limites.
7. Registar eventos críticos na auditoria, evitando segredos e dados desnecessários.
8. Não expor stack traces, detalhes de conexão ou dados de outras empresas em respostas HTTP.
9. Escritas autenticadas por cookie devem verificar a origem; avaliar também protecção CSRF explícita e política para pedidos sem cabeçalho Origin.
10. Revisões aprovadas devem ser imutáveis; novas alterações exigem uma nova revisão.

## Plano de testes de segurança antes da produção

### Testes unitários — automatizados na CI
- Cada papel tem exactamente o conjunto de permissões documentado.
- Aprovação de orçamento é exclusiva de OWNER e ADMIN.
- ENGINEER e VIEWER não podem gerir membros ou aprovar orçamentos.
- A função `assertPermission` lança erro estável quando a permissão é negada.

### Testes de integração — ainda necessários
- Empresa A não consegue listar, consultar, alterar ou apagar recursos da Empresa B, mesmo conhecendo os IDs.
- IDs de obra, EAP, revisão, recurso, fornecedor e medição cruzados devolvem resposta sem fuga de dados.
- Utilizador sem permissão recebe 403; sessão ausente/inválida recebe 401.
- Origem externa é recusada em todas as operações de escrita.
- Duas aprovações concorrentes não excedem a quantidade aprovada nem deixam mais de uma revisão activa.
- Tentativas de login repetidas são limitadas com armazenamento partilhado adequado a serverless.
- Migrações, backup e restauro são exercitados num ambiente isolado.

## Riscos ainda abertos antes da produção

- Limitação distribuída de tentativas por IP/conta no registo e login.
- Verificação de email, recuperação segura de palavra-passe e revogação global de sessões.
- Política de retenção, gestão de consentimentos e política de privacidade.
- Monitorização de eventos de autenticação e alertas de abuso.
- Testes de integração e penetração, revisão de dependências e configuração segura do alojamento.
- Backups e testes documentados de restauro.
- Rever todas as rotas de escrita para confirmar validação de origem e autorização por operação.

> A existência de testes unitários não equivale a um teste de penetração ou de isolamento real com PostgreSQL. Não disponibilizar publicamente antes de fechar os riscos acima.
