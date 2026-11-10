# F1Hub v2 Builder (plugin do Figma)

Termina de construir o arquivo **F1Hub — v2 Editorial Rework (Hi-Fi Wireframe)**:
https://www.figma.com/design/cQnOljNCdb8djCTcmurjMO

As seções 01–04 (Creative Direction, Visual References, Wireframe Foundations, Typography & Grid), os tokens, os estilos e as imagens já estão no arquivo. A construção remota parou ali porque o Figma MCP do plano Starter atingiu o limite de chamadas. Este plugin usa a mesma Plugin API, roda localmente sem esse limite e cria:

| Seção | Página |
|---|---|
| 05 — UI Components (27 componentes, ~130 variantes) | B |
| 06 — Layout Patterns (9 padrões) | B |
| 07 — Desktop Screens (Home, Equipes, Equipe Ferrari, Produto, Login, Cadastro) | C |
| 08 — Mobile Screens (as 6 telas em 390 px + Home em tablet 768 px) | C |
| 09 — Design Documentation | A |

## Como rodar (Figma desktop)

1. Abra o arquivo v2 no **Figma desktop**. Plugins de desenvolvimento não rodam no navegador.
2. Menu **Plugins → Development → Import plugin from manifest…** e escolha `design/figma-plugin-v2/manifest.json`.
3. Menu **Plugins → Development → F1Hub v2 Builder**.
4. Aguarde a mensagem final "F1Hub v2 pronto". Leva de 1 a 3 minutos.

O plugin é idempotente: se uma seção já existir, ela é pulada. Se uma etapa falhar, os nós criados nela são removidos e a mensagem mostra o erro. Depois de corrigir, basta rodar de novo.

> Rode **somente no arquivo v2**: o plugin usa as variáveis, os estilos e os hashes das imagens que existem nele.

## Teste feito

O plugin foi executado de ponta a ponta contra uma simulação da Plugin API em Node, com regras estritas de Auto Layout, variantes e propriedades. Não deu erro e gerou 137 componentes, 21 conjuntos de variantes e 404 instâncias. Essa simulação não substitui o Figma real: se aparecer algum erro na execução, ele é exibido na notificação final.
