# Central Universal de Missões DCX — Entrega integrada das três etapas

## Estado da implementação

As funcionalidades das Etapas 1, 2 e 3 foram **reunidas na mesma ramificação de desenvolvimento**, com interface do Keymaster e visualizações de jogador. Trata-se de uma proposta técnica para revisão, **não de um recurso já publicado em produção**: a publicação segura depende de reconciliar as regras reais do Firebase, fazer backup e executar testes ponta a ponta. As proteções de conteúdo privado estão no caminho `dcx/missionOps` com projeções individuais em `dcx/missionViews/$uid`; as regras ainda não foram aplicadas ao Firebase real.

### Etapa 1 — Central e preparações coletivas

- Central Universal no Keymaster, em `MISSÕES`, com Avaliações, Missões, seleção de equipes e controle de preparações. O Criador antigo continua recolhível.
- Solicitações de jogadores por `rooms/{sala}/requests/{uid}/missionActions`, validação da equipe no Keymaster e confirmação direta ou solicitada.
- Progresso das preparações por equipe, inicialmente no estado compartilhado `rooms/{sala}/state/missionControl`, sem sobrescrever o histórico de `Caindo em uma Fria`.
- Integração das preparações tradicionais D-1 e das preparações criadas pelo Story Studio. Status `done` e `preps` legados continuam reconhecidos.
- Missões novas começam sem equipe atribuída. Missões antigas não configuradas preservam a visibilidade histórica para evitar desaparecimento imediato.

### Etapa 2 — Equipes, sigilo e preparações dinâmicas

- Gestão de equipes como **ativas**, **observadoras** ou **concluídas**, com atualizações das informações autorizadas ao vivo. Uma equipe retirada da lista de participantes é mantida como observadora, sem poder realizar novas solicitações.
- Solicitações pendentes antes da retirada permanecem avaliáveis. Preparações devolvidas a observadoras ficam **suspensas** e suas observações permanecem legíveis. A reintegração volta a situação para **devolvida**, sem apagar o histórico.
- Preparações adicionais criadas e editadas durante a operação, com versões anteriores e confirmações por equipe separadas do conteúdo atual.
- Preparações **gerais** e **exclusivas**; para outras equipes, visibilidade em três níveis: nenhum, somente objetivo, objetivo e progresso. Observações internas não são projetadas.
- Arquivamento da missão inteira, ou conclusão de equipes separadamente. Dados antigos não são excluídos ao arquivar.
- Os registros privados ficam em `rooms/{sala}/dcx/missionOps`. A publicação dos campos autorizados é feita pela conta do Keymaster em `missionViews/$uid`, após verificação manual do vínculo entre UID e operador.

### Etapa 3 — Relatórios, comunicações e agentes multiequipe

- Desfecho individual por equipe (**Sucesso**, **Sucesso parcial**, **Fracasso**) e resultado geral opcional.
- Relatórios com texto interno e texto de divulgação, escolhidos pelo Keymaster. Resultado geral com divulgação por equipe e sobreposição personalizada.
- Alertas discretos e caixa de notificações operacionais com histórico, gravados em `missionNotices/$uid`; leitura individual em `missionNoticeReads/$uid`.
- Briefing de integração quando o Keymaster autoriza um vínculo entre sessão e operador.
- Participações adicionais em outras equipes, com acesso restrito à missão por padrão ou à equipe inteira, em modos **ativo**, **acompanhamento ao vivo somente leitura** ou **histórico congelado**.
- Transferências de equipe principal continuam na ferramenta de administração; os acessos adicionais e as exceções são configurados no painel de missões do Keymaster.

## Fluxo de utilização

1. Conectar o **Keymaster** à sala Firebase e abrir **MISSÕES**.
2. Em **Missões → Abrir controle**, designar as equipes da operação. O painel avançado aparece em seguida, com status das equipes, preparações personalizadas, sigilo, resultados e acessos.
3. Em **EQUIPES // STATUS**, verificar os operadores e sua equipe principal.
4. Na área de **Verificação de identidade do agente**, escolher um UID autenticado conhecido e associá-lo manualmente ao operador correto. Não confiar apenas no nome declarado pelo jogador.
5. Os jogadores vinculados recebem suas transmissões e preparações autorizadas no painel **Missões**, com solicitações e progresso coletivo.
6. O Keymaster avalia pedidos, confirma ou devolve, decide a visibilidade de preparações exclusivas e publica relatórios quando desejar.
7. Em caso de transferência, ajustar a equipe principal no cadastro do operador e, se necessário, criar uma participação adicional da equipe antiga em modo histórico ou acompanhamento. É possível revogar o vínculo UID→operador e as exceções separadamente.

## Modelo de dados

```text
rooms/{sala}/
  state/storyStudio               # Catálogo e módulos legados — já existentes
  state/missionControl            # Designações e progresso da Etapa 1
  requests/{uid}/missionActions   # Pedidos de avaliação — já existente
  dcx/missionOps                  # Edição, sigilo, versões, relatórios, grants, bindings, auditoria
  dcx/missionViews/{uid}          # Projeção autorizada para aquele UID
  dcx/missionNotices/{uid}        # Avisos individuais
  dcx/missionNoticeReads/{uid}    # Marcação de leitura pelo próprio UID
```

O fluxo protegido é Keymaster → dados privados → visão individual segura. O navegador do jogador **não tem autorização para escrever progresso nem relatórios**. A confirmação depende do Keymaster e das Firebase Rules.

## Segurança e limitações importantes

- **Não publicar diretamente o JSON versionado sem revisão!** O arquivo de regras do repositório pode estar desatualizado em relação ao Console Firebase. Mesclar somente as novas regras sob `dcx` com as regras **reais** vigentes, verificando o UID do Keymaster (há histórico de confusão entre o caractere `1` e a letra `l`).
- A visualização privada por UID protege os novos dados **apenas quando as regras de acesso estiverem corretamente publicadas e validadas**. A verificação manual de UID contra o operador é obrigatória para evitar associação incorreta.
- As missões, descrições e preparações armazenadas no **Story Studio legado** continuam dentro do estado geral legível por usuários autenticados da sala. Portanto, **nunca colocar segredos entre equipes ou relatórios internos no editor legado**; usar as preparações classificadas do painel avançado.
- Notificações e novas projeções são publicadas pelo navegador do Keymaster. Enquanto ele estiver desconectado, pedidos ainda são armazenados, porém a publicação de novas projeções/avisos pode aguardar a reconexão dele.
- A central usa o operador principal do cadastro e grants extras, mas a autenticação e o fluxo de acesso legado não foram completamente substituídos. Essa migração futura requer validação cuidadosa por usuário e equipe.
- Os testes escritos são de **lógica isolada e projeção de dados**, não testes E2E em Firebase real. Ainda não há evidência de execução em dispositivos físicos, nem validação da migração para uma sala existente.
- A publicação de relatórios, a confirmação e os grants precisam ser testados em sala de homologação antes de confiar neles numa sessão real.
- O histórico de marcações legadas é preservado; não houve importação automática destrutiva nem exportação do banco real.

## Checklist de homologação

- [ ] Exportar backup de dados e regras do Firebase real.
- [ ] Confirmar UID correto do Keymaster e comparar regras implantadas com o JSON versionado.
- [ ] Aplicar apenas a atualização de regras reconciliada e testar negações para conta de jogador.
- [ ] Conferir que um jogador não consegue ler `dcx/missionOps` nem `missionViews/{outroUid}`.
- [ ] Associar dois UIDs diferentes a dois operadores de equipes distintas; verificar ausência de vazamento.
- [ ] Confirmar solicitações da Alpha e validar que a Bravo não recebe conclusão indevida.
- [ ] Retirar a Alpha para observação, continuar transmitindo progresso autorizado, suspender uma devolução e reintegrá-la.
- [ ] Editar uma preparação já confirmada, verificar versão e histórico.
- [ ] Criar uma preparação exclusiva, revelar objetivo e depois progresso sem disponibilizar notas internas.
- [ ] Publicar resultado interno/público por equipe e relatório geral com personalização.
- [ ] Conferir alertas, caixa de notificações, leituras individuais e briefing ao entrar.
- [ ] Testar participante adicional com vínculo completo/restrito, histórico congelado, acompanhamento e revogação.
- [ ] Testar PC, telefone e reconexão com Keymaster offline.
- [ ] Executar `npm run test:missions:all` localmente no repositório antes do merge.

**Resultado:** todas as três etapas foram desenvolvidas em uma única proposta de alteração para avaliação. A entrega **não está automaticamente habilitada no site principal nem no Firebase real**.
