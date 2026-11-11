# Segurança e isolamento multiempresa

## Implementado na fundação

- Palavra-passe guardada como hash bcrypt, nunca em texto simples.
- Sessão assinada com JWT HS256, cookie HttpOnly, SameSite=Lax e Secure em produção.
- Segredo de sessão obrigatório com pelo menos 32 caracteres.
- Associação e papel actual são reconsultados na base de dados em cada pedido autenticado.
- APIs de obras e EAP exigem sessão e verificam permissões no servidor.
- Consultas de obras e itens EAP são limitadas à empresa autenticada.
- Criação e actualização de obras e criação de itens EAP geram registos de auditoria.
- Validação de dados com Zod e verificações de origem nas operações de escrita da API.

## Controlos ainda necessários antes de produção

- Limitação de tentativas por IP/conta no registo e login, idealmente com armazenamento partilhado.
- Verificação de email, recuperação segura de palavra-passe e revogação global de sessões.
- Política de retenção, gestão de consentimentos e política de privacidade.
- Protecção operacional contra abuso automatizado e monitorização de eventos de autenticação.
- Testes de integração e penetração, revisão de dependências e configuração segura do alojamento.
- Backups e testes documentados de restauro.

## Regras obrigatórias para todos os módulos

- Todas as operações de negócio exigem sessão autenticada válida.
- A empresa activa deve ser obtida e validada no servidor através das associações do utilizador.
- Nunca confiar em `companyId`, papel, utilizador ou estado de aprovação enviados pelo cliente.
- Toda a leitura e escrita deve ser limitada à empresa autorizada; os IDs recebidos devem ser consultados dentro desse âmbito.
- Aplicar permissões por acção com `src/lib/authorization.ts`.
- Validar entradas no servidor com esquemas de `src/lib/validation.ts`.
- Registar eventos críticos na auditoria, evitando segredos e dados desnecessários.
- Não expor stack traces, detalhes de conexão ou dados de outras empresas em respostas HTTP.
- Configurar backups, restauração testada, monitorização e política de retenção.

## Critérios de aceitação de segurança

1. Um utilizador da Empresa A não consegue listar, consultar, alterar ou apagar recursos da Empresa B, mesmo conhecendo os IDs.
2. Um membro sem permissão não consegue aprovar revisões alterando a chamada HTTP.
3. A empresa activa e a função são resolvidas no servidor em cada operação.
4. Testes de integração cobrem acesso permitido, acesso negado e tentativas de acesso cruzado.
5. Revisões aprovadas permanecem imutáveis; novas alterações geram uma nova revisão.

> Esta implementação é uma base de desenvolvimento. Não disponibilizar publicamente antes de configurar a base de dados e o segredo de sessão, limitar abuso, testar a segurança e concluir os controlos listados acima.
