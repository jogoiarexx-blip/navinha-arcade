# Navinha Arcade v2.1

## O que mudou

- PixiJS 7.4.3 incluído localmente e renderizando fundos, estrelas, jogador, inimigos, chefes, tiros, power-ups e partículas por pools WebGL.
- Fallback integral para Canvas 2D quando WebGL/PixiJS não estiver disponível.
- Modos Automático, Baixo, Médio e Alto com resolução, FPS visual, partículas, decoração, glows e limites de objetos distintos.
- Background e chefe exclusivos para todas as 10 fases; sprites compartilhados para os 7 tipos de inimigos.
- Checkpoint entre fases com botão **Continuar Fase N** e atalho C.
- PWA instalável/offline com Service Worker; os arquivos podem ficar no cache do aparelho sem permanecer carregados na memória.
- Botão de pausa para celular, tratamento de `touchcancel` e preferência de dificuldade persistente.
- Correção da bomba, que agora soma abates/pontos/progresso; correção do desbloqueio precoce de dificuldade.
- Proteção contra carregamentos concorrentes, cache do áudio de explosão e escrita de conquistas de abate agrupada.
- Limpeza dos recursos da Fase 10 após o final da história.

## Memória

CORE e assets globais pequenos permanecem ativos. Somente o script, background e chefe da fase atual entram no cache de nível. Ao trocar de fase, imagens são desconectadas, script removido, arrays de combate limpos, áudio/timers da fase encerrados e a definição anterior removida.

## Testes automatizados

- Sintaxe de todos os scripts.
- Layout lógico 480 px e 1024 px.
- Menu → Fases 1 a 10, verificando um único script de fase ativo.
- Assets exclusivos de cada fase e descarregamento do anterior.
- Retry, pause, menu, erro, duas tentativas e botão tentar novamente.
- Bomba, progressão de dificuldade e checkpoint.
- Inicialização e renderização PixiJS/WebGL em ambiente simulado.

Teste em hardware real ainda é recomendado para calibrar o modo Automático em modelos específicos de notebook/celular.
