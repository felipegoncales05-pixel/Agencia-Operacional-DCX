# Central Universal de Missões — implementação por etapas

## Objetivo

Transformar o gerenciamento específico das preparações de **Caindo em uma Fria** numa Central Universal de Missões, sem eliminar o catálogo, o construtor, os módulos, as preparações clássicas e os registros existentes. Progresso e confirmações pertencem à **equipe**, e qualquer integrante autorizado pode solicitar avaliação. O Keymaster pode confirmar diretamente.

## Etapa 1 — Fundação (implementação inicial nesta ramificação)

A nova interface em **Keymaster → MISSÕES** tem três áreas: Avaliações, Missões e Arquivo (esta última aparece como espaço reservado para a Etapa 2). O Criador de Missões e a caixa antiga de decisões continuam acessíveis num painel recolhível abaixo da Central.

Cada operação tem designações de equipes administradas pelo Keymaster e preparações com progresso independente por equipe. O Keymaster pode confirmar diretamente uma preparação ou aprovar a solicitação enviada por um jogador. Os pedidos continuam passando pelo caminho existente `rooms/{sala}/requests/{uid}/missionActions`; o Keymaster resolve a equipe real a partir da identidade registrada, **não** do campo `teamId` fornecido pelo navegador do jogador.

Os registros novos ficam em `rooms/{sala}/state/missionControl`, sob `assignments` e `progress`. Essa escolha reutiliza as permissões do estado da sala na Etapa 1 e não executa migração destrutiva. Preparações que estavam marcadas `done` no catálogo e preparações D‑1 marcadas no estado antigo continuam confirmadas na leitura por compatibilidade. Confirmações novas ficam associadas à equipe e não reescrevem os sinalizadores globais legados.

O painel D‑1 original aceita pedidos de confirmação por equipe, e a Central exibe essas preparações junto às personalizadas. A antiga caixa de seleção global do Keymaster continua disponível, mas agora está identificada como **legada e global**. Não usá-la para novas confirmações coletivas.

**Compatibilidade durante a transição:** operações **preexistentes** sem designação explícita mantêm a visibilidade anterior da sala, para não desaparecerem de repente para jogadores atuais. **Novas missões começam sem equipes designadas e permanecem ocultas dos jogadores até o Keymaster selecionar os participantes na Central**. Ao salvar a lista, a interface passa a mostrar a operação apenas às equipes escolhidas. Equipes devem existir e o operador deve estar associado a uma delas pelo painel administrativo.

### Limites conhecidos desta primeira entrega

- **Controle de visibilidade ainda não é sigilo de segurança.** O catálogo de `storyStudio` e o estado `missionControl` permanecem no estado público da sala, legível por qualquer usuário autenticado segundo as regras do projeto. A filtragem de missões no navegador organiza a interface, mas **não protege conteúdo secreto**. Não cadastrar informações confidenciais por equipe até a implementação das regras segregadas da Etapa 2.
- O Firebase em produção **não foi atualizado** por esta entrega; é necessário verificar as regras reais no Console. O arquivo de regras versionado pode estar desatualizado. Confirmar também o UID real da conta administradora antes de qualquer publicação de regras.
- Pedidos legados anteriores ao novo campo `teamId`, ou pedidos feitos antes de uma transferência de equipe, não são aprovados automaticamente: o Keymaster deve conferir a equipe original, confirmar diretamente na Central e então dispensar a solicitação antiga.
- Pedidos dos jogadores são individuais no caminho antigo, e uma equipe pode enviar solicitações redundantes por integrantes diferentes. A Central reconhece e limpa as solicitações conhecidas ao confirmar, mas o bloqueio **atômico** de um pedido ativo por equipe só estará completo quando existir um caminho protegido específico no banco.
- Não há novas notificações individuais, relatórios, missões arquivadas, retirada/reintegração, sigilo, nem histórico completo de auditoria nesta etapa.
- Estados legados `preps` de Caindo em uma Fria e `storyStudio.operations[].preparations[].done` são mantidos por compatibilidade. Uma migração definitiva exige backup e validação por sala e por equipe antes de remover os campos antigos.
- Validação atual: verificações sintáticas do JavaScript e testes simulados de isolamento por equipe e pedido autorizado. **Não houve teste ponta a ponta com contas reais, Firebase ou diferentes navegadores.**

## Etapa 2 — Gestão operacional e permissões

1. Migrar o controle operacional para uma estrutura no Firebase com leitura por equipe e área privada do Keymaster, além de regras validadas por autenticação/associação.
2. Designação e retirada de equipes a qualquer momento; participação ativa, observadora ou concluída; reintegração sem perda de progresso. Equipes observadoras consultam atualizações autorizadas ao vivo, mas não podem interagir.
3. Encerrar operações globalmente ou por equipe; preservar solicitações pendentes; suspender correções devolvidas a equipes observadoras.
4. Criar e editar preparações durante missões com histórico de versões, manutenção das confirmações e reabertura explícita.
5. Preparações gerais ou exclusivas; sigilo por equipe com níveis nenhum, somente objetivo e objetivo + progresso; sem exposição de comentários internos.
6. Solicitação ativa única por missão/equipe/preparação, transações de banco, trilha de auditoria e validação no servidor. Migrar o legado com exportação prévia e rollback testado.

## Etapa 3 — Relatórios, comunicações e vínculos avançados

1. Desfechos independentes por equipe (Sucesso, Sucesso parcial ou Fracasso), mais desfecho geral opcional.
2. Relatório interno confidencial, versão pública padrão, versão personalizada por equipe, destinatários selecionados e publicação explícita.
3. Alertas discretos ao vivo e caixa de notificações com leitura individual, respeitando as permissões.
4. Briefing de integração de novos membros; equipe principal, participações adicionais restritas por padrão, transferências e preservação histórica de permissões.
5. Revisão de UX no celular e no computador; testes de autorização, sincronização e performance.

## Uso e verificação sugeridos

1. Fazer backup do Firebase da sala antes de habilitar a Central.
2. No terminal do Keymaster, entrar em **MISSÕES → Missões → Abrir controle** e salvar as equipes designadas para uma operação.
3. Cadastrar o operador em **EQUIPES // STATUS**, escolhendo sua equipe principal.
4. Em dois terminais de jogador de equipes distintas, consultar a mesma missão. Validar o isolamento das marcações e a navegação.
5. Solicitar a conclusão de uma preparação no módulo da missão (ou no D‑1 de Caindo em uma Fria), aprová-la em **Avaliações** e confirmar que somente a equipe responsável muda de estado.
6. Confirmar outra preparação diretamente na lista da missão e validar que o campo `done` legado não foi sobrescrito.
7. No repositório, executar `npm run test:missions`. Essa suíte cobre comportamento básico, mas não substitui testes reais de acesso e banco.

A Etapa 1 foi construída de forma incremental e reversível no GitHub, sem alterar a base de dados existente automaticamente.
