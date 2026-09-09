# Navinha Arcade v2.2.2 — correções e otimização

## Correções aplicadas

- Corrigida a colisão direta com chefes: o chefe não desaparece nem deixa a fase travada.
- O botão de continuar pelo checkpoint agora responde a mouse e toque.
- As cinco naves usam seus sprites WebP, inclusive Espectro Violeta e Fênix Solar.
- Os perfis Baixo, Médio e Alto agora limitam tiros, tiros inimigos, hazards e partículas.
- O modo Automático usa média de FPS com histerese para evitar trocas constantes de qualidade.
- A sombra do HUD foi reposicionada para não encobrir textos e indicadores.
- Sons atrasados da fase são registrados e cancelados ao sair/reiniciar.
- Ao abandonar o loading, carregamentos pendentes são invalidados imediatamente.

## Carregamento e memória

- Core, interface, jogador, inimigos comuns, efeitos e power-ups permanecem compartilhados.
- Background, chefe e objetos ambientais são carregados somente para a fase atual.
- Recursos da fase anterior são liberados na troca, permitindo coleta pelo garbage collector.
- O manifest de fases foi consolidado e não contém mais definições duplicadas.
- As fases 2 e 3 usam arquivos de runtime estáveis, sem alterar seus números ou saves.
- O PixiJS/WebGL renderiza fundo e estrelas; gameplay e HUD mantêm o Canvas 2D compatível.
- Em qualidade Baixa, poeira usa desenho simples em vez de sprite e há menos partículas.

## PWA/offline

- Cache atualizado para `navinha-arcade-v2.2.2`.
- `js/pwa.js` incluído na instalação offline.
- O fallback para `index.html` ocorre somente em navegação, sem mascarar falhas de JS ou imagens.
- Arquivos podem continuar disponíveis offline sem manter todas as fases simultaneamente na memória.

## Testes executados

- Sintaxe de todos os scripts e fases.
- Layout 480 px e 1024 px.
- Menu → Fase 1 → Fase 2 → Fase 3.
- Reinício, pause, retorno ao menu, retry de erro e checkpoint.
- Colisão com chefe, sprites das cinco naves e limites do perfil Baixo.
- Uma única fase residente por vez e assets ambientais específicos por fase.
- PixiJS/WebGL híbrido, lista offline e integridade dos WebP.
