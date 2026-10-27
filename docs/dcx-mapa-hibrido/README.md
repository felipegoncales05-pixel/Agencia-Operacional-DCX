# DCX — Pacote técnico do Mapa Híbrido

**Estado:** módulo preparatório adicionado na branch `main`, **não ativado nas páginas publicadas**. O mapa 2D DCXATLAS5 continua sendo o padrão, evitando uma regressão de FPS ou tela vazia.

## Objetivo

Criar uma base cartográfica geográfica real e mundial com **MapLibre GL JS + OpenFreeMap**, oferecendo visual **top-down cyberneon**, nomes reais *ocultos* e **rótulos de paródia** gerados pelos dados do projeto. Os dados compartilhados continuam no Firebase: `rooms/{room}/dcx/tacticalMap/points`.

A interface visual permanece em `dcx-atlas-hud.js` e `dcx-atlas-hud.css`, sem necessidade de recriar a UI ou os dados da campanha.

## Arquivos deste pacote

| Arquivo | Finalidade |
|---|---|
| `docs/dcx-mapa-hibrido/dcx-map-provider.js` | Adaptador MapLibre: mapa mundial, rótulos ficcionais, pontos e áreas de risco |
| `docs/dcx-mapa-hibrido/dcx-map-provider.css` | Estilo do mapa externo e inset do Havaí |
| `dcx-atlas-lexicon.js` (já existente) | Apelidos paródia e localidades |
| `dcx-tactical-map.js` (já existente) | Leitura/gravação Firebase e editor Keymaster |
| `dcx-cartography-engine.js` (já existente) | Mapa fictício offline para fallback |

## Visualização

**Simplificada**
- Fundo escuro, oceanos, estradas e contornos reais fornecidos pelo mapa-base;
- Países representados por rótulos paródia;
- Ícones de pontos e zonas de risco;
- Rótulos de cidades, ruas, bairros e distritos ocultos.

**Completa**
- Países e cidades parodiados em escala mundial;
- Distritos em zoom 9+, bairros em zoom 11+ e ruas em zoom 13+;
- Sobreposição de rótulos evitada pelo motor;
- Marcadores de missão, pontos e zonas de risco mantidos;
- Todos os nomes são elementos vetoriais separados dos dados-base.

**Exemplos:** Japão → Japaon; Tokyo → Tókyoh; Shibuya → Xibuya; Avenida Paulista → Avenida Paulysta.exe. A camada de rótulos original do provedor é desativada antes de renderizar o estilo.

**Limite honesto:** o arquivo `dcx-atlas-lexicon.js` contém nomes e coordenadas paródia curados para cidades principais e gera nomes/posições aproximados para as demais. Para cada rua real do planeta ter uma paródia correspondente, será necessário gerar um catálogo amplo a partir de dados GIS/vetoriais e revisar geocodificação. O pacote atual não faz essa promessa.

## Havaí

No **modo global**, um botão-inset **HAVAY // HAWAII** é projetado próximo dos Estados Unidos continentais. É uma representação cartográfica deslocada para fins narrativos. Ao clicar, o mapa navega para **21.3099, -157.8581**, isto é, a localização real do Havaí; os dados das ilhas não são modificados.

## Interface do Keymaster (preservar)

- **M1** no fundo do mapa: abrir o formulário existente no ponto clicado.
- **M1** em ponto existente: editar ponto, ou visualizar ponto de exemplo.
- **M2**: arrastar o mapa, sem criar marcação.
- **Roda**: zoom.
- Campos: nome, descrição, ícone, imagem HTTPS, tipo (interesse/importante/risco).
- Área de risco: 1–5 estrelas, quantidade, tipo (Feiticeiros/Humanos/Maldições/Não-registrados) e raio pequeno/médio/grande.
- Persistência: `rooms/{room}/dcx/tacticalMap/points`; jogadores só visualizam.

**Atenção Firebase:** as regras no repositório não substituem as regras publicadas. Antes de validar a sincronização, resolver qualquer `permission_denied` em `tacticalMap`. Não abrir escrita global para contornar o erro.

## Integração — modo experimental, não invasivo

1. Em uma branch de teste, carregar `dcx-map-provider.css` e `dcx-map-provider.js` **antes de `dcx-tactical-map.js`**, junto aos scripts atuais do léxico.
2. Inserir um seletor explícito `2D DCX / GEO REAL (BETA)` que salva a preferência **localmente**.
3. Ao iniciar o modo GEO REAL, salvar centro/zoom do mapa 2D e montar um **contêiner dedicado** `dcxMapHybrid`.
4. Invocar `window.DCX.HybridMapAdapter.create({container, center, zoom, host, onClick, onSelect, onMouseMove, onCameraChange})`.
5. Conectar `setPoints(allPoints())` ao listener de sincronização já existente. Nunca duplicar listeners Firebase.
6. Ao mudar o modo, chamar `destroy()` e restaurar o motor Canvas original. Se a criação ou carregamento falhar, **manter/reabrir o 2D** e exibir erro na barra de status.
7. Encaminhar os botões Simplificado/Completo para `setLabelMode(mode)`. A preferência pode continuar em `dcx-atlas-label-mode`.
8. Respeitar eventos de troca de aba, `ResizeObserver`, tela cheia e `prefers-reduced-motion`; nunca criar mapas GPU duplicados.

**Não ativar diretamente em produção** sem testar carga de tiles, acesso remoto, CSS e marcações do Keymaster. Há dependência de CDN e de provedor externo de tiles.

## Contrato da API de mapas

```js
const adapter = await DCX.HybridMapAdapter.create({
  container, center: {lat:35.6762,lng:139.6503}, zoom:12,
  host: isKeymaster,
  onClick: geo => openEditor(null, geo),
  onSelect: point => isKeymaster ? openEditor(point) : selectPoint(point.id),
  onMouseMove: updateCoordinates,
  onCameraChange: updateCameraHud
});
adapter.setPoints(allPoints());
adapter.setLabelMode('complete'); // ou 'simple'
adapter.goCity('tokyo');
adapter.global();
adapter.destroy();
```

O adaptador oferece ainda `zoom`, `center`, `setZoom`, `setCenter`, `flyTo`, `resize` e `getStatus`, de acordo com a API do motor 2D.

## Geografia, hospedagem e licenças

- MapLibre GL JS é open source; verificar licença e manter avisos pertinentes.
- OpenFreeMap fornece um mapa vetorial real, sujeito à disponibilidade e aos termos do serviço.
- Preservar a atribuição ao OpenStreetMap e a outros provedores conforme os termos aplicáveis. Não eliminar o controle de atribuição.
- Dados de fronteiras do mapa-base são **geografia contemporânea**, não a geopolítica fictícia do RPG. Para a União Soviética como país unificado é necessário adicionar uma camada de fronteira própria e, idealmente, ocultar/neutralizar fronteiras internas das 15 repúblicas; o pacote por ora implementa a **nomenclatura fictícia**, não o redesenho geopolítico completo.
- Implementação somente com URLs HTTPS; não inserir conteúdo HTML vindo do Firebase diretamente em popup.
- Nenhuma chave paga do Google Maps é usada. Não usar a chave de Firebase como chave Google Maps.

## Testes de aceitação antes da ativação

- [ ] Abre em Tóquio com geografia real e visual top-down (sem inclinação).
- [ ] Mostra Japaon, Tókyoh e Xibuya; não exibe rótulos originais nas camadas do mapa.
- [ ] Simplificado oculta ruas/bairros/distritos/cidades e mantém países e marcadores.
- [ ] Completo revela o nível de rótulos de acordo com o zoom.
- [ ] Visão global navega pelos continentes e representa Havay próximo dos EUA.
- [ ] Clicar no inset Havaí centraliza as coordenadas reais das ilhas.
- [ ] M1/M2 e zoom não conflitam com a HUD.
- [ ] Criar/editar/remover marcadores só com permissão de Keymaster.
- [ ] Jogador autenticado visualiza atualizações em tempo real.
- [ ] Alterar abas, redimensionar e abrir em tela cheia não torna o mapa preto.
- [ ] Teste em celular de baixa capacidade; fallback 2D em falha de CDN/GPU.
- [ ] P95 de FPS/latência de interação aceitável durante deslocamento e zoom, sem redraw desnecessário.
- [ ] Atribuições cartográficas visíveis.

## Reversão

O 2D continua disponível e deve permanecer como padrão. Para reverter a experiência beta, desligar a seleção do modo híbrido e chamar `destroy()` no adaptador, deixando `dcx-cartography-engine.js` assumir novamente. **Não são necessárias migrações dos dados Firebase.**
