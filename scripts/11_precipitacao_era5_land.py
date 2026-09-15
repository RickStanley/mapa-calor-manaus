"""
Precipitação (ERA5-Land) mensal, 1979-2025 — checagem de longo prazo.

Não é uma nova camada pro site: é uma segunda opinião, independente do
CHIRPS (09_precipitacao_mensal.py), pra ver se o achado de lá (volume e
frequência caindo, 2001-2025) se repete numa fonte de metodologia
totalmente diferente (reanálise, não satélite óptico) e numa janela mais
longa (47 anos em vez de 25).

Por que ERA5-Land e não a API da Open-Meteo (que o script 01 já usa pra
temperatura): testamos comparar dois pontos (Reserva Ducke x Petrópolis)
pela Open-Meteo e achamos os valores de chuva IDÊNTICOS ano após ano até
2016, divergindo só a partir de 2017 — não é um sinal real, é a API
trocando de modelo (passa a incluir o ECMWF IFS, ~9km, só a partir de
2017). Usar essa fonte pra tendência de longo prazo correria o risco de
confundir uma troca de modelo com uma mudança de clima. O dataset
ERA5-Land direto do Earth Engine não tem esse problema: é um único modelo,
mesma metodologia do início ao fim (ECMWF descreve como "replay" do
componente de terra do ERA5).

Por que 1979 e não 1950 (o dataset cobre desde 1950): rodamos a série
inteira uma vez e achamos um vale suspeito em 1961 — mais seco que a
própria seca histórica de 1963 do Rio Negro, que é o evento realmente
documentado dessa década. Pesquisa depois disso achou dois problemas
confirmados: (1) a ERA5 tem uma descontinuidade de qualidade documentada
entre pré-1979 (sem assimilação de satélite) e pós-1979, pior
especificamente sobre floresta tropical; (2) o estudo mais recente que
compara tendência de chuva na Amazônia entre CHIRPS/ERA5/GPCC/vazão de rio
(Nature Sci. Reports, 2025) também corta em 1980 pelo mesmo motivo. Por
isso `DATA_INICIO_ERA5` em config.py está em 1979, não 1950 — o dado de
1950-1978 fica de fora da análise "oficial" do projeto, mesmo existindo no
Earth Engine.

Mesma lógica espacial de 09_precipitacao_mensal.py: reduceRegion sobre o
bbox inteiro (não a grade de 1km) — o pixel do ERA5-Land (~11km) é ainda
mais grosseiro que o do CHIRPS (~5,5km), reforça ainda mais por que não
faz sentido quebrar por célula/zona.
"""

import ee

from mapa_amazonia.config import (
    ANO_FIM,
    BANDA_CHUVA_ERA5,
    BBOX,
    COLECAO_CHUVA_ERA5,
    DATA_INICIO_ERA5,
    DIR_RAW,
    EE_PROJECT_ID,
    FATOR_M_PARA_MM,
    LIMIAR_DIA_CHUVA_MM,
    RESOLUCAO_ERA5_NATIVA_M,
)

NOME_ARQUIVO = "precipitacao_mensal_era5_1979_2025"


def registro_do_mes(data_inicio: ee.Date, regiao: ee.Geometry) -> ee.Dictionary:
    """
    Uma coleção só (diferente de 09_precipitacao_mensal.py, que precisa de
    duas): ERA5-Land já entrega um total diário homogêneo, então a mesma
    coleção serve pro volume (soma dos dias do mês) e pra frequência
    (contagem de dias >= LIMIAR_DIA_CHUVA_MM). `.multiply(FATOR_M_PARA_MM)`
    converte de metros pra mm antes de comparar com o limiar ou somar —
    fazer isso depois inverteria a ordem certa das operações.
    """
    data_fim = data_inicio.advance(1, "month")
    colecao_do_mes = (
        ee.ImageCollection(COLECAO_CHUVA_ERA5)
        .filterDate(data_inicio, data_fim)
        .filterBounds(regiao)
        .select(BANDA_CHUVA_ERA5)
        .map(lambda imagem: imagem.multiply(FATOR_M_PARA_MM))
    )

    volume_mm = colecao_do_mes.sum()
    dias_de_chuva = colecao_do_mes.map(lambda imagem: imagem.gte(LIMIAR_DIA_CHUVA_MM)).sum()

    media_volume = volume_mm.reduceRegion(
        reducer=ee.Reducer.mean(), geometry=regiao, scale=RESOLUCAO_ERA5_NATIVA_M
    )
    media_dias = dias_de_chuva.reduceRegion(
        reducer=ee.Reducer.mean(), geometry=regiao, scale=RESOLUCAO_ERA5_NATIVA_M
    )

    return ee.Dictionary(
        {
            "ano": data_inicio.get("year"),
            "mes": data_inicio.get("month"),
            "precip_mm": ee.Number(media_volume.get(BANDA_CHUVA_ERA5)),
            "dias_chuva": ee.Number(media_dias.get(BANDA_CHUVA_ERA5)),
        }
    )


def construir_serie_completa(regiao: ee.Geometry) -> ee.List:
    data_inicial = ee.Date(DATA_INICIO_ERA5)
    data_final_exclusiva = ee.Date.fromYMD(ANO_FIM + 1, 1, 1)
    n_meses = data_final_exclusiva.difference(data_inicial, "month").round()
    lista_datas = ee.List.sequence(0, ee.Number(n_meses).subtract(1)).map(
        lambda i: data_inicial.advance(i, "month")
    )
    return lista_datas.map(lambda data: registro_do_mes(ee.Date(data), regiao))


def validar(regiao: ee.Geometry) -> None:
    """
    Duas checagens antes de rodar os ~564 meses:

    1. Sazonalidade básica (mesmo teste de 09_precipitacao_mensal.py):
       abril deveria ficar bem acima de agosto.
    2. Comparação direta com o CHIRPS num mês de sobreposição (abril/2020):
       as duas fontes não precisam bater exatamente (metodologias
       diferentes — reanálise vs satélite+estação), mas devem ficar na
       mesma ordem de grandeza. CHIRPS deu 313,3 mm nesse mês (calculado
       antes, em 09_precipitacao_mensal.py).
    """
    abril_2020 = registro_do_mes(ee.Date("2020-04-01"), regiao).getInfo()
    agosto_2020 = registro_do_mes(ee.Date("2020-08-01"), regiao).getInfo()
    print(
        f"Validação — abril/2020: {abril_2020['precip_mm']:.1f} mm "
        f"(CHIRPS deu 313.3 mm nesse mês — mesma ordem de grandeza esperada), "
        f"{abril_2020['dias_chuva']:.1f} dias de chuva"
    )
    print(
        f"Validação — agosto/2020: {agosto_2020['precip_mm']:.1f} mm "
        f"(CHIRPS deu 31.2 mm), {agosto_2020['dias_chuva']:.1f} dias de chuva"
    )
    if abril_2020["precip_mm"] <= agosto_2020["precip_mm"]:
        raise ValueError("Abril saiu mais seco que agosto — sazonalidade invertida.")


def main() -> None:
    ee.Initialize(project=EE_PROJECT_ID)

    regiao = ee.Geometry.Rectangle(BBOX)

    print("Rodando validação de sanidade antes da série completa...")
    validar(regiao)

    print("Validação ok. Calculando ~564 meses (1979-2025)...")
    serie = construir_serie_completa(regiao).getInfo()

    caminho_saida = DIR_RAW / f"{NOME_ARQUIVO}.csv"
    DIR_RAW.mkdir(parents=True, exist_ok=True)
    with open(caminho_saida, "w", encoding="utf-8") as arquivo:
        arquivo.write("ano,mes,precip_mm,dias_chuva\n")
        for registro in serie:
            arquivo.write(
                f"{registro['ano']},{registro['mes']},"
                f"{registro['precip_mm']},{registro['dias_chuva']}\n"
            )

    print(f"Concluído: {len(serie)} meses salvos em {caminho_saida}")


if __name__ == "__main__":
    main()
