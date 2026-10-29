# Sistema visual DCX

As aparências são independentes das dez paletas. O padrão continua sendo **DCX // Command Standard**; cada usuário pode escolher a própria aparência e cursor nas configurações do Player ou do Keymaster. Nenhuma preferência visual é publicada na sala.

## Comparação das quatro direções

| Critério | Command Standard | D. // Burn Nomad | Capri // Signal Bloom | Ghost // Black Ice |
| --- | --- | --- | --- | --- |
| Personalidade | Terminal institucional | Equipamento de campo robusto | Comunicação expressiva | Operação silenciosa |
| Formatos | Retângulos regulares | Barras, diagonais e cantos firmes | Cantos alternados e camadas | Retângulos discretos |
| Fontes | Fonte atual do terminal | Oxanium / sans-serif | Space Grotesk / sans-serif | Share Tech Mono / monospace |
| Painéis | Moldura atual | Borda lateral reforçada | Gradiente translúcido e moldura dupla | Hairline sem halo |
| Botões | Comportamento atual | Chanfrado visual, peso alto | Cantos alternados, resposta suave | Contorno limpo |
| Fundo | Grade atual | Faixa diagonal de sinalização | Pontos e luz difusa | Fundo uniforme e grade quase invisível |
| Ícones | Traço uniforme | Traço mais espesso | Traço com halo sutil | Traço leve, sem brilho |
| Cursor | Shard equilibrado | Fragmentos retos | Fragmento destacado | Shard compacto sem halo |
| Movimento | Transições breves | Entrada curta, sem tremor contínuo | Deslocamento discreto no hover | Sem movimento decorativo |
| Densidade | Controlada pela preferência existente | Painéis mais secos | Espaçamento mais aberto | Controles compactos, leitura preservada |
| Paletas sugeridas | Arc, DCX Verde, Night City | Burn, Sandstorm, Night City | Sakura, Void, Arc | Ghost Mono, Blackout, Royal |
| Acessibilidade | Texto e rótulos preservados | Sem recortar foco ou menus | Sem flashes ou tremores | Contraste de texto preservado |
| Complexidade | Baixa; base técnica | Média | Média | Baixa |

**Base técnica: Command Standard.** Preserva os fluxos e as dimensões principais; os demais perfis modificam tokens de forma, tipografia, contorno, espaçamento e efeitos. A configuração de densidade e as fontes explicitamente escolhidas no Font Studio têm prioridade sobre a sugestão da aparência.

## Aplicação por módulo

| Módulo | Command Standard | Burn Nomad | Signal Bloom | Black Ice |
| --- | --- | --- | --- | --- |
| Missões | Arquivo operacional | Quadro de objetivos com borda reforçada | Cartões com iluminação e cantos alternados | Lista de dossiês com linhas finas |
| Yumiya | Canal de assistência | Console de rádio de campo | Canal com moldura de sinal | Janela de comunicação discreta |
| Facções | Dossiês institucionais | Placas de identificação | Cartões em camadas | Arquivo de inteligência minimalista |
| Keymaster | Centro de comando | Estação de controle de combate | Painel de coordenação dinâmico | Console administrativo sóbrio |

## Ícones e insígnias

`DCX.Icons.icon(name)` retorna SVGs decorativos com `currentColor`, viewBox 24 × 24 e nome de registro validado. `data-dcx-icon="mission"` declara um local para hidratação. Ícones funcionais não substituem retratos, símbolos narrativos ou os emblemas de `DCX.TeamSymbols`. O observador atualiza somente elementos adicionados: mensagens e textos de usuários não são convertidos em ícones.

Os botões mantêm os textos; botões só com ícone conservam ou recebem nome acessível. A roda de atalhos combina os ícones com as letras de atalho existentes.

## Cursor Signal Shard

São seis desenhos: normal, interativo, precisão, carregamento, indisponível e arrastar. A haste possui um corte em espaço negativo que sugere D; os fragmentos na cauda formam X. O hotspot acompanha a ponta; a retícula usa o centro. O estado de texto usa o cursor nativo. Links e campos mantêm seus comportamentos e o usuário pode escolher **cursor do sistema**, **Signal Shard** ou **Signal Shard ampliado**.

Os arquivos vetoriais são gerados como URLs SVG a partir das variáveis reais da paleta, sem imagens externas ou um elemento que persiga o mouse. São usados somente com mouse e pointer fino, fora de forced-colors. O desenho de carregamento usa um anel segmentado estático, respeitando o suporte dos navegadores a cursores nativos. A ferramenta de mapa usa retícula, com mão de arrastar ao mover a câmera.

## Preferências e integração

- Configuração por terminal: `dcx-player-visual-v1` / `dcx-km-visual-v1`.
- Aparências: `command-standard`, `d-burn-nomad`, `capri-signal-bloom`, `ghost-black-ice`.
- `DCX.Appearance.setAppearance(id)`, `setCursor('signal'|'large'|'system')`, `reset()`.
- Restaurar paleta/densidade também restaura a aparência e o cursor, sem alterar as fontes narrativas.
- Funciona com `prefers-reduced-motion` e com a preferência de movimento existente; Ghost desliga os efeitos decorativos da aparência.
- Preferências ausentes, inválidas ou armazenamento indisponível retornam a Command Standard. O CSS atual continua funcional se um dos recursos visuais não carregar.
- Formas e efeitos usam somente variáveis da paleta; não há cor de marca fixa em nenhuma aparência.

## Verificação

O teste `tests/visual-system.cjs` usa Playwright em uma cópia local, bloqueia integrações externas e substitui Firebase apenas no contexto de teste. Verifica persistência, independência de aparência/paleta, os seis cursores, movimento reduzido, fontes explícitas, conteúdo dinâmico, botões de configuração e os 40 pares aparência/paleta. Não utiliza credenciais nem altera dados reais.

```sh
npm ci
npm run test:visual-preferences
npx playwright install chromium
npm run test:visual
npm run icons:export
```

O teste de preferências com JSDOM passou nas 80 combinações (40 em cada terminal), nos seis SVGs de cursor, em persistência, conteúdo dinâmico, integridade dos rótulos, isolamento das insígnias, parsing de CSS, restauração e tolerância a armazenamento indisponível. JavaScript de produção e scripts inline também passaram na verificação de sintaxe.

A revisão de renderização com Playwright ficou pendente: o Chromium do ambiente de execução falhou durante a inicialização/navegação, antes de abrir o aplicativo. Isso não comprova layout, contraste calculado, carregamento real de fontes ou integração Firebase em produção. O teste de navegador e os breakpoints estão incluídos para repetir essa revisão em um ambiente com Chromium funcional. Os testes de DOM não substituem essa revisão visual.
