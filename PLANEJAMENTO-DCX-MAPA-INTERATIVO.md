# DCX // MAPA TÁTICO INTERATIVO — ideia para a próxima sessão

**Registro:** 26/10/2026  
**Status:** ideia salva para planejamento; funcionalidade **não implementada**.  
**Projeto:** Crônicas do Tempo — Caindo-em-uma-Fria

## Pedido do Keymaster
Criar no site uma **aba de mapa** baseada em **Maps (Google Maps como referência inicial)**, com visual **cybertecnológico / cyberpunk** e ferramentas interativas. O jogador deve conseguir explorar e interagir com o mapa, em vez de ver apenas uma imagem estática.

## Direção visual desejada
- Interface futurista de terminal DCX, inspirada em hologramas e mapas táticos.
- Mapa com zoom, navegação, camadas e marcadores interativos.
- Elementos visuais como coordenadas, grade, painéis de informação, regiões e destaques neon.
- Design responsivo, utilizável em computador e celular.

## Possibilidades para desenhar juntos — **ainda não aprovadas**
- **Keymaster:** adicionar/editar marcadores, áreas de interesse, eventos e localizações de missão.
- **Jogadores:** clicar em pontos, abrir descrições, consultar objetivos e explorar os locais liberados.
- Camadas de missões, equipes, NPCs, regiões e zonas de risco; opcionais.
- Atualizações ao vivo pelo Firebase, diferenciando informações públicas e exclusivas do Keymaster.
- Estados de descoberta / área oculta conforme a narrativa, apenas se desejado.

## Perguntas de arquitetura a resolver antes de desenvolver
1. O mundo do RPG usa **lugares reais do Google Maps** ou um **mapa fictício desenhado pelo Keymaster**, ou ambos?
2. O que os jogadores poderão editar: só visualizar e marcar locais pessoais, ou criar pontos compartilhados?
3. Quais locais, missões e equipes devem aparecer, e para quem?
4. Serviço de mapas: Google Maps JavaScript API (credenciais, cota e cobrança), outra biblioteca/tiles licenciados ou mapas fictícios personalizados.
5. Como integrar o painel com a navegação atual do Player e com as abas do Keymaster sem alterar a funcionalidade de Soundtrack, Handouts, Yumiya e Credenciais?

**Nota importante:** não incluir chaves de API privadas no GitHub. Definir limites de uso, política de exibição e regras específicas do Firebase antes de publicar uma versão sincronizada.

## Próxima etapa
Na próxima conversa, retomar este arquivo e formular em conjunto o design da aba de mapa e as permissões. **Não começar a implementar sem alinhar o tipo de mapa e as interações desejadas.**
