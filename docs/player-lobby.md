# Lobby dos operadores

A página `index.html` abre na recepção **Crônicas do Tempo / Agência Operacional DCX**. O jogador confirma sala e nome; a Key aparece quando a sala exige convite. Identidade e convite salvos são reaproveitados, mas não causam entrada automática.

## Fluxo

1. O lobby consulta as condições públicas da sala, usando o aplicativo Firebase anônimo de Player já existente.
2. **Acessar central** revalida sala, bloqueio do operador e convite. Salas fechadas aceitam apenas convites salvos ainda válidos.
3. A conexão existente de `OPHPlayer` preserva o identificador do operador, publica a identidade e inicializa os módulos.
4. Só então o lobby é ocultado, a central perde `hidden`/`inert` e a mensagem de boas-vindas existente aparece.
5. O botão **Lobby** na barra da central permite voltar ou trocar de sala. A consulta de outra sala não altera a sala ativa, os heartbeats ou as inscrições existentes.

O código de sala no link é respeitado e levado também ao atalho do Keymaster. Paleta, aparência e cursor continuam independentes; o horário do rodapé usa Brasília. O status de rede indica somente a conectividade do navegador e não simula uma validação de servidor.

## Limites de acesso

O lobby é uma interface de entrada; não substitui regras Firebase nem concede acesso administrativo. Nenhuma regra, credencial, permissão ou configuração do Keymaster foi alterada. Consultas malsucedidas mantêm a central oculta e permitem tentar novamente. O modo local só é oferecido quando o Firebase está explicitamente desativado na configuração existente.

Os campos mantêm os IDs de acesso existentes, enquanto `player-lobby.js` e `player-lobby.css` isolam o novo layout e o estado do formulário. O aplicativo fica oculto desde o HTML inicial. Controles de fundo e atalhos internos não devem capturar a navegação do lobby. Rótulos, estado anunciado, teclado, foco após entrada e ausência de movimento decorativo fazem parte da implementação.

## Verificação

```sh
npm ci
npm run test:lobby
npm run test:visual-preferences
npx playwright install chromium
npm run test:visual
```

O teste de lobby usa JSDOM, os módulos reais de Player e um backend em memória: nenhuma conta ou dado de produção é acessado. Cobre sala aberta, nome obrigatório, Key ausente/inválida/revogada, convite salvo, sala fechada, operador bloqueado, falha de rede/conexão, repetição de clique, respostas atrasadas, preservação do ID, reentrada, link de sala, modo local e isolamento da consulta em relação à presença ativa.

Os testes de DOM e o parsing CSS não comprovam renderização. A suíte Playwright inclui capturas de lobby no desktop/mobile e o novo passo de entrada antes de testar as configurações. A revisão visual real segue separada no Roadmap Visual enquanto não houver um Chromium funcional no ambiente.
