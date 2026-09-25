# Navinha Arcade v2.2.4 — integração inicial de sprites animados

## O que foi colocado no game
- Nave do jogador **Interceptora** agora usa spritesheet animado (idle, disparo e dano).
- Inimigo comum **Patrulheiro Rubro** agora usa spritesheet animado.
- Chefe da **Fase 1 — Sentinela Zero** agora usa spritesheet animado com estados de idle, carga/ataque e dano.
- **Sobreviventes** do sistema de resgate agora usam spritesheet animado.
- **Explosões** grandes agora usam spritesheet animado por progresso do efeito, em vez de um frame estático único.

## Observações
- Mantive fallback automático: se algum spritesheet falhar ao carregar, o jogo continua com os desenhos existentes ou sem travar.
- Nesta etapa a integração foi focada nas artes recém-criadas; os demais chefes e inimigos continuam usando os sprites/imagens já existentes.
- A sequência de destruição da nave do jogador e do inimigo comum ainda não foi ligada como estado separado de gameplay; as explosões continuam sendo tratadas pelo sistema global de partículas/explosão.
