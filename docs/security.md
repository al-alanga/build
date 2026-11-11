# Segurança e isolamento multiempresa

## Estado

Este documento define os requisitos mínimos antes de disponibilizar operações com dados reais. A aplicação ainda não deve ser utilizada em produção.

## Regras obrigatórias

- Todas as operações de negócio exigem uma sessão autenticada válida.
- A empresa activa deve ser obtida e validada no servidor através das associações do utilizador.
- Nunca confiar em `companyId`, papel, utilizador ou estado de aprovação enviados pelo cliente.
- Toda a leitura e escrita deve ser limitada à empresa autorizada; os IDs recebidos devem ser consultados dentro desse âmbito.
- Aplicar permissões por acção com `src/lib/authorization.ts`.
- Validar entradas no servidor com esquemas de `src/lib/validation.ts`.
- Registar eventos críticos na auditoria, evitando segredos e dados desnecessários.
- Limitar tentativas de autenticação e proteger recuperação de palavra-passe.
- Usar palavras-passe com hash resistente, cookies de sessão seguros, CSRF apropriado e gestão de sessão revogável.
- Não expor stack traces, detalhes de conexão ou dados de outras empresas em respostas HTTP.
- Configurar backups, restauração testada, monitorização e política de retenção.

## Critérios de aceitação de segurança

1. Um utilizador da Empresa A não consegue listar, consultar, alterar ou apagar recursos da Empresa B, mesmo conhecendo os IDs.
2. Um membro sem permissão não consegue aprovar revisões alterando a chamada HTTP.
3. A empresa activa e a função são resolvidas no servidor em cada operação.
4. Testes de integração cobrem acesso permitido, acesso negado e tentativas de acesso cruzado.
5. Revisões aprovadas permanecem imutáveis; novas alterações geram uma nova revisão.
