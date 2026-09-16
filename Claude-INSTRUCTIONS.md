# Instruções para edição — humano ou agente de IA

Este documento explica como este repositório é organizado, como rodar o
pipeline de dados, como editar o site e como o deploy funciona. Não é um
tutorial de conceitos gerais (Python, Git, Earth Engine) — é um mapa direto
de "onde mexer pra fazer o quê".

## Estrutura do repositório

```
├── site/                    # Site estático (HTML/CSS/JS puro, sem build)
│   ├── index.html           # Markup — é isto que o Vercel publica
│   ├── styles/styles.css    # Todo o CSS do site
│   ├── scripts/main.js      # Todo o JS do site (gráficos, tooltip, citações)
│   └── resources/           # Dados grandes demais pra ficar inline no JS
│       ├── hero-heatmap.json   # Grade HEAT (40x51 células x 25 anos) — hero + mapa de ilhas de calor
│       └── vegetation.json     # 1.773 pontos do scatter NDVI×LST
├── scripts/                 # Pipeline de dados, roda em ordem (01 a 11)
├── src/mapa_amazonia/       # Código compartilhado entre os scripts
│   ├── config.py            # Todo parâmetro do projeto mora aqui
│   ├── grade.py             # Construção da grade espacial (Earth Engine)
│   └── drive.py             # Download das exportações do Earth Engine
├── data/
│   ├── raw/                 # CSVs baixados do Earth Engine (não versionado)
│   └── processed/           # Parquet + JSON finais (versionado — o site lê daqui)
├── pyproject.toml           # Dependências (gerenciadas com uv)
└── README.md                # Visão geral do projeto + metodologia completa
```

O repositório contém duas coisas que não têm relação de build entre si: o
pipeline Python que gera os dados, e o site estático que os lê. O Vercel só
enxerga `site/` (ver seção "Deploy" abaixo).

## Rodando o pipeline de dados

Pré-requisitos: Python 3.12+, [`uv`](https://docs.astral.sh/uv/), uma conta
Google Cloud com um projeto Earth Engine registrado (gratuito, categoria
noncommercial).

```bash
uv sync                          # instala as dependências
earthengine authenticate         # autentica sua conta (uma vez só)
```

Preencha `EE_PROJECT_ID` em `src/mapa_amazonia/config.py` com o ID do seu
projeto Earth Engine. Depois rode os scripts em ordem, de dentro de `scripts/`:

| Script | O que faz |
|---|---|
| `01_temperatura_ar.py` | Baixa a série histórica de temperatura do ar (Open-Meteo), 1940–hoje |
| `02_ee_primeiro_teste.py` | Checagem isolada: um número só, valida a conta do Earth Engine |
| `03_lst_mensal.py` | Exporta temperatura de superfície (LST) mensal por célula da grade |
| `04_ndvi_mensal.py` | Exporta NDVI (vegetação) mensal por célula da grade |
| `05_montar_tabelas.py` | Junta LST + NDVI, aplica os critérios de limpeza, salva Parquet por ano |
| `06_deriva_orbital.py` | Mede o horário real de passagem do satélite Terra por mês |
| `07_curva_horaria_ar.py` | Calcula a curva horária real de temperatura do ar (calibração) |
| `08_corrigir_deriva_orbital.py` | Aplica a correção de deriva orbital, gera `*_corrigido` |
| `09_precipitacao_mensal.py` | Exporta volume (CHIRPS v3 PENTAD) e dias de chuva (CHIRPS v3 DAILY_SAT) mensais, cidade inteira |
| `10_montar_chuva.py` | Limpa o CSV de chuva, salva `chuva_mensal.parquet` e agrega `chuva_anual.json` |
| `11_precipitacao_era5_land.py` | Checagem cruzada independente (ERA5-Land, 1979–2025) do achado de 09/10 |

Os scripts 03 e 04 exportam para o Google Drive de forma assíncrona (Earth
Engine não permite exportar tabelas grandes de forma síncrona) — baixe os
CSVs resultantes para `data/raw/` antes de rodar `05_montar_tabelas.py`.

Os scripts 09 e 11 são diferentes: como reduzem o bbox inteiro (não a grade
de 1 km — o pixel do CHIRPS/ERA5-Land é maior que boa parte da mancha
urbana, então não faz sentido fingir resolução célula a célula pra chuva),
o resultado é só uma centena de números, pequeno o bastante pra vir direto
num `.getInfo()` síncrono. Não usam `drive.py` nem passam por `data/raw/`
manualmente do mesmo jeito que 03/04 — o próprio script já escreve o CSV
final em `data/raw/`.

A metodologia completa de cada etapa de limpeza — o quê, o porquê, quantos
valores afetou — está documentada em `data/processed/criterios_limpeza.json`
e resumida no README (seção "Metodologia").

## Adaptando para outra cidade

O pipeline não tem nada hardcoded específico de Manaus dentro da lógica —
os parâmetros que mudam ficam todos em `src/mapa_amazonia/config.py`:

- `BBOX`: retângulo `[oeste, sul, leste, norte]` da área de análise.
- `PONTOS_REFERENCIA`: coordenadas usadas para validar o pipeline contra
  padrões já conhecidos (ex.: "essa área deveria dar mais quente que aquela").
- `ANO_INICIO` / `ANO_FIM`: recorte temporal.
- `RESOLUCAO_M`: tamanho da célula da grade, em metros.

Dois limiares foram calibrados olhando a distribuição real dos dados de
Manaus e podem precisar reavaliação em outra região:
`LIMIAR_OCCURRENCE_AGUA` (máscara de água) e `LIMIAR_Z_CLIMATOLOGICO`
(filtro de anomalia climatológica). Veja os comentários ao lado de cada um
em `config.py` para o raciocínio usado para chegar no valor.

`PRECIP_MM_MIN`/`PRECIP_MM_MAX` (faixa plausível de chuva) também foram
calibrados contra a normal climatológica de Manaus — revise numa cidade com
regime de chuva diferente. `DATA_INICIO_ERA5` (1979, não o início real do
dataset em 1950) é uma decisão específica de qualidade de dado documentada
no próprio comentário do config.py — vale ler antes de mudar.

A correção de deriva orbital (scripts 06–08) é específica do satélite Terra
(MOD11A2) e da janela 2020–2026 em que a deriva está documentada pela NASA —
revise se ainda se aplica antes de reusar em um projeto com período diferente.

## Editando o site

Sem build step (sem framework, sem bundler), mas desde 16/09/2026 **não é
mais um arquivo único**: `site/index.html` tem só o markup, `site/styles/
styles.css` tem todo o CSS e `site/scripts/main.js` tem todo o JS (gráficos,
tooltip compartilhado, sistema de citações). A maioria dos dados dos
gráficos (halo, hotspot, chuva, citações) ainda está embutida como literal
JS dentro de `main.js` — só os dois blocos grandes demais pra isso viraram
arquivo próprio em `site/resources/`:

- `hero-heatmap.json` — a grade `HEAT` (40×51 células × 25 anos), usada
  **tanto pelo hero (mapa que rola no topo) quanto pelo mapa interativo de
  "Ilhas de Calor"** (seção "Manaus em 2025, célula a célula") — os dois
  dependem do mesmo arquivo.
- `vegetation.json` — os 1.773 pontos do gráfico de dispersão (scatter).

Isso significa que **agora existe chamada de API em tempo de execução**
(`fetch` dos dois JSONs acima, em `main.js`), diferente de antes. As duas
buscas têm `try`/`catch`: se `hero-heatmap.json` falhar ao carregar, o hero
e o mapa de "Ilhas de Calor" ficam desativados nessa carga (guarda
`if(!HEAT) return`), mas o resto do site (halo, hotspot, chuva, scatter)
continua funcionando normalmente — não é mais um ponto único de falha pro
JS inteiro. Mesma lógica isolada pro scatter/`vegetation.json`.

**Consequência prática: abrir `site/index.html` direto no navegador
(protocolo `file://`, sem servidor) não funciona mais** — `fetch` de
arquivo local é bloqueado pelo navegador, então o hero e o mapa de ilhas de
calor não carregam (o `try/catch` evita que isso quebre o resto, mas essas
duas partes específicas ficam sempre vazias nesse modo). Sirva a pasta
`site/` com qualquer servidor estático antes de testar localmente, por
exemplo `python3 -m http.server` de dentro de `site/`.

Para atualizar os números depois de rodar o pipeline de novo: os dados que
alimentam o site vêm de `data/processed/` (os Parquet por ano, `grade.geojson`
e os JSONs de contexto). Não existe hoje um script automático que regenera
os arquivos do site a partir desses dados — a atualização é manual:
- Grade `HEAT` (hero + mapa de ilhas de calor) → editar `site/resources/hero-heatmap.json` diretamente.
- Pontos do scatter → editar `site/resources/vegetation.json` diretamente.
- Qualquer outro dado (halo, hotspot, chuva, citações, big numbers) → editar o literal correspondente dentro de `site/scripts/main.js`.

**Tooltip de gráfico (hover/toque):** todo gráfico de ponto ou barra que
precisa mostrar o valor exato (halo, hotspot, os dois de chuva — não o
scatter, que é denso demais) usa `ativarTooltip(elemento, getHtml)`, definida
junto dos outros helpers (`el`/`cssVar`/`aoEntrarNaTela`). Não usar `<title>`
do SVG pra isso: no mobile ele só aparece com toque-e-segure, e segurar num
elemento com texto perto aciona o menu de seleção/callout do navegador, uma
experiência ruim já corrigida uma vez neste projeto. `ativarTooltip` mostra
no hover do mouse e no toque simples (sem segurar) no celular, fechando só
ao tocar fora de qualquer ponto.

**Degradê de cor das seções (`--h0`...`--h9`):** não é mais uma progressão
linear de matiz — foi recalibrado pra cair rápido nas primeiras seções (sai
do verde puro já nas primeiras 3-4 seções) e achatar depois, porque a versão
linear original ficava "verde demais por tempo demais" antes de a página
parecer "quente". Ao inserir uma seção nova no meio da sequência, não
reproduza um espaçamento uniforme entre os stops — decida a matiz olhando
o que já veio antes dela na narrativa (mais pra perto de verde ou de
vermelho) e ajuste manualmente os stops seguintes pra manter a curva suave.

## Deploy (Vercel)

O site é 100% estático e não precisa de variável de ambiente nem de função
serverless. Ao criar o projeto no Vercel:

1. Conecte este repositório do GitHub.
2. Em **Project Settings → General → Root Directory**, aponte para `site/`.
3. Framework preset: **Other** (sem build command, sem output directory —
   é HTML estático puro).

O restante do repositório (`scripts/`, `src/`, `data/`) fica fora do que o
Vercel enxerga, porque o Root Directory restringe o build a `site/`. Não é
necessário nem recomendado manter dois repositórios separados: um repo só,
com Root Directory apontando para a pasta certa, resolve o fato de o repo
ter conteúdo (o pipeline Python) que não faz sentido nenhum pro Vercel.

Antes de tornar o repositório público, audite por segredo ou caminho local
exposto: nenhuma credencial do Earth Engine/Drive deve estar versionada
(`.gitignore` já cobre isso), e `EE_PROJECT_ID` em `config.py` é um ID de
projeto Google Cloud, não uma credencial — pode ficar público, mas revise
mesmo assim antes de publicar.
