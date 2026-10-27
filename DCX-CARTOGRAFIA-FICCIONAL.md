# DCX // Central Cartográfica Ficcional — DCXMAP2

## Objetivo
A aba MAPA é uma cartografia **fictícia**, inspirada visualmente em mapas de satélite cyberpunk do universo *Crônicas do Tempo*. O mapa principal é top-down, desenhado via Canvas 2D e funciona sem Google Maps, MapLibre, Leaflet, API paga ou arquivos de tiles.

## Componentes
- `dcx-cartography-engine.js`: motor local de cidade e visão global, vias e quarteirões estilizados, anéis e avenidas neon, pings e círculos de risco
- `dcx-atlas-hud.js` e `dcx-atlas-hud.css`: HUD com navegação GLOBAL / TOKYO / OUTRAS CIDADES, painéis separados de distritos, nomes de ruas fictícias e pontos interativos
- `dcx-tactical-map.js`: integração com os dados e operações já existentes, incluindo autenticação e Firebase
- `dcx-map-ergonomics.js`: modo tela cheia, controles adicionais e layout ajustável
- `index.html` e `keymaster.html`: carregam os módulos nas duas versões da interface

## Navegação
- Abrir a aba MAPA
- Mover o mapa com botão esquerdo (jogador); no Keymaster, botão direito movimenta e esquerdo cria um ping
- Roda do mouse ou controles `+`/`−` para zoom
- Botão GLOBAL para o mundo fictício, clique numa cidade ou use a lista de CIDADES para entrar nela
- Começa por padrão em TOKYO quando não há outro centro configurado para a sala
- A lista RUAS e a lista DISTRITOS são **rótulos HTML separados** da imagem do mapa, não textos desenhados sobre as estradas

## Keymaster / Firebase
A camada de dados continua no caminho `rooms/{room}/dcx/tacticalMap`, com `points`, `center` e `zoom`. Pontos de interesse, importantes e zonas de risco continuam com os campos já existentes: título, descrição, ícone, link de imagem, categoria, estrelas, quantidade/tipo de ameaças e raio. **As regras do Firebase já precisam permitir leitura aos jogadores e escrita ao Keymaster.** Esta atualização visual não publica regras automaticamente.

## Geografia e limitações
- Este é **um mapa narrativo fictício**, não um mapa geográfico de navegação real. O estilo de estradas e os continentes são desenhos procedurais/simplificados, não trajetos GIS cartograficamente precisos.
- Cidades reais (Tokyo, Osaka, São Paulo, Londres etc.) têm nomes e coordenadas aproximadas; as ruas são fictícias.
- Na linha do tempo do RPG, a União Soviética é exibida como potência contínua na visão global; os contornos são indicativos.
- Os locais de exemplo de Tóquio vêm no código e os personalizados permanecem no Firebase.
- A imagem-conceito produzida anteriormente foi usada como **referência artística**, não como textura estática navegável.
- Não há downloads constantes de tiles ou renderização WebGL; o canvas só é redesenhado em mudanças de viewport, zoom, pontos e navegação.

## Como testar
1. Publicar a branch `main` no GitHub Pages e atualizar forçadamente no navegador (`Ctrl + Shift + R`)
2. Abrir MAPA no jogador, navegar por Tokyo, clicar em um ponto, conferir descrições e entrar em GLOBAL
3. No Keymaster, criar um ping no mapa e verificar sua aparição para um jogador autenticado na mesma sala
4. Testar zoom, movimento, tela inteira e desempenho em uma tela menor
5. Caso os pontos sincronizados não apareçam, conferir as regras ativas de `dcx/tacticalMap` no Firebase

## Restrições
Não carregar conteúdo HTML arbitrário do Keymaster como código. Links de imagens continuam validados para `https:`. Nenhuma chave de API foi embutida.
