# Manaus Odeia Árvores

25 anos de dados de satélite (2001–2025) cruzando temperatura de superfície,
perda de vegetação e chuva em Manaus, célula a célula, numa grade de 1 km.

**Site:** [manausodeiaarvores.com.br](https://manausodeiaarvores.com.br)  
**Autor:** [brunotemum.site](https://brunotemum.site)

## O que tem aqui

Este repositório contém duas coisas, lado a lado:

- **`scripts/` + `src/`** — o pipeline Python que baixa e processa os dados
  de satélite (Google Earth Engine) e monta os arquivos finais.
- **`site/`** — o site estático que lê esses arquivos e apresenta os
  resultados. HTML/CSS/JS puro, sem build step.

Para rodar o pipeline, adaptar o projeto para outra cidade, editar o site ou
entender o deploy no Vercel, veja **[Claude-INSTRUCTIONS.md](Claude-INSTRUCTIONS.md)**.

## Dados

| Camada | Fonte | Resolução | Cadência |
|---|---|---|---|
| Temperatura de superfície (LST) | MODIS MOD11A2 | 1 km | 8 dias → agregado mensal |
| Vegetação (NDVI) | MODIS MOD13Q1 | 250 m | 16 dias → agregado mensal |
| Água (máscara do rio) | JRC Global Surface Water | 30 m | Ocorrência histórica 1984–2021 |
| Temperatura do ar | Open-Meteo (reanálise ERA5) | Ponto único | Diária, desde 1940 |
| Chuva (volume + dias de chuva) | CHIRPS v3 (PENTAD + DAILY_SAT) | ~5,5 km, cidade inteira | Mensal, 2001–2025 |
| Chuva — checagem cruzada | ERA5-Land (reanálise) | ~11 km, cidade inteira | Mensal, 1979–2025 |

Todas as fontes são gratuitas e de acesso público. Os dados processados
(Parquet por ano + GeoJSON da grade + JSONs de contexto) ficam em
`data/processed/` e são o que o site efetivamente lê.

<details>
<summary><strong>Metodologia completa</strong></summary>

### Recorte espacial e temporal

Grade regular de 2.040 células de 1 km cobrindo o bbox de Manaus — mancha
urbana, Rio Negro e a Reserva Adolpho Ducke (a maior mancha de floresta
contígua da grade, 489 km²). Incluir a floresta é proposital: é o contraste
cidade/mata que sustenta a análise.

Período: 2001–2025 (25 anos civis completos). O MODIS começa em 18/02/2000,
o que torna 2000 um ano incompleto para comparação anual; as coleções usadas
seguem até meados de 2026, fim da missão Terra/Aqua.

### Critérios de limpeza

Aplicados nesta ordem (`scripts/05_montar_tabelas.py`; números completos em
`data/processed/criterios_limpeza.json`):

1. **Faixa fisicamente plausível.** LST fora de [10, 60] °C ou NDVI fora de
   [-1, 1] vira nulo — faixa universal, não específica de Manaus. Afetou 58
   leituras de `lst_dia_c` e 30 de `lst_noite_c`, de 612.000.
2. **Inversão térmica implausível.** Manaus é equatorial (sol forte o ano
   todo); se a superfície aparece mais de 5 °C mais quente à noite do que de
   dia na mesma célula/mês, é resíduo de nuvem que passou pelo controle de
   qualidade do produto MODIS, não um evento real. Afetou 82 células-mês.
3. **Anomalia climatológica.** Um valor pode estar dentro da faixa plausível
   e ainda ser implausível *para aquela célula específica*, comparado à
   própria média histórica no mesmo mês do calendário (mínimo de 10 anos de
   histórico para o teste rodar). Afetou 430 leituras de `lst_dia_c` e 6 de
   `lst_noite_c`. Caso motivador: ~30 células bateram 38–42 °C em junho/2001,
   parecendo um evento de calor real — mas junho/2001 teve recorde de FRIO
   documentado em Manaus e 0% de leitura noturna válida na grade inteira
   naquele mês. O "pico" era artefato de poucos pixels de dia sobrando num
   mês excepcionalmente nublado.
4. **Deriva orbital do satélite Terra.** A partir de 2020 o Terra vem
   passando cada vez mais cedo sobre o equador (documentado pela NASA, fim
   de missão sem manobras de correção) — passagem mais cedo mede a
   superfície antes dela esquentar, o que produz um viés de frio crescente
   nos anos mais recentes. Confirmado com dado do próprio satélite (banda
   `Day_view_time` do MOD11A2: hora média de passagem estável em ~10,47h
   entre 2001–2020, caindo para 9,31h em 2025). Corrigido projetando cada
   medição para o horário de referência histórico, usando a curva horária
   real de temperatura do ar em Manaus (Open-Meteo) para calibrar a forma do
   ajuste e os dois horários conhecidos da própria LST (dia e noite) para
   calibrar a amplitude. Gera colunas novas (`lst_dia_c_corrigido`,
   `lst_noite_c_corrigido`) ao lado das originais, sem sobrescrevê-las — o
   site usa a versão corrigida por padrão, com opção de ver o dado bruto.

### Chuva: fonte, período de confiança e o que não misturar

CHIRPS v3 é a fonte oficial (volume via produto PENTAD, dias de chuva via
produto diário DAILY_SAT, limiar de 1mm/dia, padrão da Organização
Meteorológica Mundial), reduzida sobre o bbox inteiro — sem quebra por
célula ou zona, porque o pixel nativo (~5,5 km) é maior que boa parte da
mancha urbana. ERA5-Land entra só como checagem cruzada independente, e só
a partir de 1979: rodamos a série completa desde 1950 uma vez, achamos um
vale suspeito em 1961 (mais seco que a própria seca histórica de 1963 do
Rio Negro, o evento realmente documentado dessa década), e a literatura
confirma uma queda de qualidade na ERA5 antes da era de assimilação de
satélite (pré-1979), pior especificamente sobre floresta tropical.

Achados centrais (comparando a média da primeira metade da série com a
segunda, não só os anos das pontas, que são sensíveis a um único El Niño):
volume e dias de chuva caem nas duas fontes, mas a queda **não é uniforme
ao longo do ano** — concentra-se na estação seca (junho a outubro); a
estação chuvosa (dezembro a maio) segue praticamente estável. Um estudo de
2025 que comparou várias fontes pra tendência de chuva na bacia amazônica
inteira encontrou o oposto (leve alta), o que não é necessariamente
contradição: o padrão local de Manaus pode divergir do padrão da bacia como
um todo, e esse mesmo estudo aponta a ERA5 como a menos confiável das
fontes comparadas. Não usar o dado deste projeto para afirmar nada sobre
"a Amazônia" — só sobre Manaus.

### Limitações conhecidas

- **LST não é temperatura do ar.** É a temperatura da superfície captada por
  satélite — mais alta e mais variável que os 2 m medidos por uma estação
  meteorológica.
- **Completude noturna é baixa** (~37% das célula-mês têm leitura válida),
  contra a diurna; números baseados só na série noturna devem ser lidos com
  mais cautela.
- **A correlação NDVI×LST é fraca célula a célula** (R² = 5,7% na regressão
  simples) — mas o contraste entre o grupo de células que perderam
  vegetação e o que não perdeu é robusto (+38% mais aquecimento nas que
  desmataram). Usar o contraste de grupo, não a regressão pontual, como
  número de referência.
- **O efeito de proximidade à floresta** (cada km de distância custa ~0,4 °C
  em áreas igualmente urbanizadas) não tem nenhuma célula da grade a mais de
  6,7 km de algum fragmento de floresta — não é possível saber, com estes
  dados, se ou onde esse efeito satura além disso.
- **Coordenadas de bairros de referência são aproximadas** (centroides
  estimados, não malha oficial — o Brasil não tem malha padronizada de
  bairros no IBGE).

</details>
