"""
Precipitação (CHIRPS v3) mensal, 2001-2025 — volume e dias de chuva.

Constrói uma série mensal, cidade inteira (bbox de Manaus, o mesmo de
03_lst_mensal.py/04_ndvi_mensal.py): volume total de chuva (mm/mês) e número
de dias de chuva no mês (>= LIMIAR_DIA_CHUVA_MM, padrão OMM), para os 300
meses entre janeiro de 2001 e dezembro de 2025.

Duas diferenças deliberadas em relação a 03/04:

1. Duas coleções, não uma (ver config.py, seção 9): PENTAD (nativo, menos
   derivado) pro volume; DAILY_SAT (derivado via IMERG) só pra frequência,
   porque "dias de chuva" não existe em produto pentadal. Volume e
   frequência têm confiabilidade diferente — documentado de novo em
   10_montar_chuva.py.

2. reduceRegion, não reduceRegions: o pixel nativo do CHIRPS (~5.566 m) é
   maior que boa parte do bbox de Manaus, então rodar contra a grade de
   1 km (como LST/NDVI fazem) só replicaria o mesmo valor de pixel em
   dezenas de células vizinhas — falsa precisão, sem uso real (o projeto
   decidiu não quebrar chuva por zona/célula). Cada mês vira um único
   número por variável. O payload final (300 meses x 2 variáveis) é
   pequeno o bastante pra vir direto num único `.getInfo()`, sem precisar
   de Export.table.toDrive nem do polling de task que 03/04 usam.
"""

import ee

from mapa_amazonia.config import (
    ANO_FIM,
    ANO_INICIO,
    BBOX,
    COLECAO_CHUVA_FREQUENCIA,
    COLECAO_CHUVA_VOLUME,
    DIR_RAW,
    EE_PROJECT_ID,
    LIMIAR_DIA_CHUVA_MM,
    RESOLUCAO_CHUVA_NATIVA_M,
)

NOME_ARQUIVO = "precipitacao_mensal_2001_2025"


def volume_do_mes(data_inicio: ee.Date, regiao: ee.Geometry) -> ee.Number:
    """
    Soma os pentads da coleção PENTAD que caem dentro do mês. O CHIRPS
    define pentads por calendário — reseta a cada mês, 6 por mês, o último
    com 3 a 6 dias dependendo do tamanho do mês — então filtrar por mês
    civil já pega exatamente os pentads certos, sem sobra nem
    sobreposição de borda entre meses.
    """
    data_fim = data_inicio.advance(1, "month")
    colecao_do_mes = (
        ee.ImageCollection(COLECAO_CHUVA_VOLUME)
        .filterDate(data_inicio, data_fim)
        .filterBounds(regiao)
    )
    total_mm = colecao_do_mes.sum()
    media = total_mm.reduceRegion(
        reducer=ee.Reducer.mean(), geometry=regiao, scale=RESOLUCAO_CHUVA_NATIVA_M
    )
    return ee.Number(media.get("precipitation"))


def frequencia_do_mes(data_inicio: ee.Date, regiao: ee.Geometry) -> ee.Number:
    """
    Cada imagem diária da coleção DAILY_SAT vira 1 (choveu >=
    LIMIAR_DIA_CHUVA_MM) ou 0 (não choveu); somar as ~30 imagens do mês dá
    a contagem de dias de chuva. Reduz essa contagem (não a chuva em si)
    pro bbox — queremos "quantos dias", não "quantos mm".
    """
    data_fim = data_inicio.advance(1, "month")
    colecao_do_mes = (
        ee.ImageCollection(COLECAO_CHUVA_FREQUENCIA)
        .filterDate(data_inicio, data_fim)
        .filterBounds(regiao)
    )
    choveu = colecao_do_mes.map(
        lambda imagem: imagem.select("precipitation").gte(LIMIAR_DIA_CHUVA_MM)
    )
    dias_de_chuva = choveu.sum()
    media = dias_de_chuva.reduceRegion(
        reducer=ee.Reducer.mean(), geometry=regiao, scale=RESOLUCAO_CHUVA_NATIVA_M
    )
    return ee.Number(media.get("precipitation"))


def registro_do_mes(data_inicio: ee.Date, regiao: ee.Geometry) -> ee.Dictionary:
    return ee.Dictionary(
        {
            "ano": data_inicio.get("year"),
            "mes": data_inicio.get("month"),
            "precip_mm": volume_do_mes(data_inicio, regiao),
            "dias_chuva": frequencia_do_mes(data_inicio, regiao),
        }
    )


def construir_serie_completa(regiao: ee.Geometry) -> ee.List:
    """
    Mesma construção server-side de 03/04 (`ee.List.sequence` + `.advance()`,
    sem loop Python) — só que aqui o resultado final é uma lista de
    dicionários simples (um por mês), não uma FeatureCollection espacial,
    porque não há célula nenhuma pra distinguir.
    """
    n_meses = (ANO_FIM - ANO_INICIO + 1) * 12
    data_inicial = ee.Date.fromYMD(ANO_INICIO, 1, 1)
    lista_datas = ee.List.sequence(0, n_meses - 1).map(
        lambda i: data_inicial.advance(i, "month")
    )
    return lista_datas.map(lambda data: registro_do_mes(ee.Date(data), regiao))


def validar(regiao: ee.Geometry) -> None:
    """
    Checagem de sanidade antes de gastar cota rodando os 300 meses: compara
    um mês tipicamente chuvoso e um tipicamente seco contra a normal
    climatológica INMET 1991-2020 de Manaus (abril ~331 mm o mais chuvoso,
    agosto ~56 mm o mais seco — ponto único da estação 82331, não o mesmo
    recorte do bbox, mas deve bater a ORDEM de grandeza e a sazonalidade).
    Também confere um ano de El Niño forte (2015) — deve aparecer nitidamente
    mais seco que a média.
    """
    abril_2020 = registro_do_mes(ee.Date("2020-04-01"), regiao).getInfo()
    agosto_2020 = registro_do_mes(ee.Date("2020-08-01"), regiao).getInfo()
    print(
        f"Validação — abril/2020 (deveria ser bem chuvoso, normal INMET ~331mm): "
        f"{abril_2020['precip_mm']:.1f} mm, {abril_2020['dias_chuva']:.1f} dias de chuva"
    )
    print(
        f"Validação — agosto/2020 (deveria ser o mais seco, normal INMET ~56mm): "
        f"{agosto_2020['precip_mm']:.1f} mm, {agosto_2020['dias_chuva']:.1f} dias de chuva"
    )
    if abril_2020["precip_mm"] <= agosto_2020["precip_mm"]:
        raise ValueError(
            "Abril saiu mais seco que agosto — sazonalidade invertida, "
            "provavelmente erro de coleção/data antes de gastar cota."
        )

    agosto_2015 = registro_do_mes(ee.Date("2015-08-01"), regiao).getInfo()
    print(
        f"Validação — agosto/2015 (El Niño forte, deveria ser mais seco que a média): "
        f"{agosto_2015['precip_mm']:.1f} mm"
    )


def main() -> None:
    ee.Initialize(project=EE_PROJECT_ID)

    regiao = ee.Geometry.Rectangle(BBOX)

    print("Rodando validação de sanidade (3 meses) antes da série completa...")
    validar(regiao)

    print("Validação ok. Calculando os 300 meses (pode levar alguns minutos)...")
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
