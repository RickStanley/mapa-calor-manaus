"""
Monta as tabelas finais de precipitação: limpa e agrega o CSV cru de
09_precipitacao_mensal.py.

Diferente de 05_montar_tabelas.py (LST+NDVI), este script não faz nenhum
join por célula — a extração de chuva já é cidade inteira (um valor por
mês, não por célula da grade; ver docstring de 09_precipitacao_mensal.py),
então não há nada pra juntar. O trabalho aqui é só: validar faixas
plausíveis, salvar o mensal limpo, e agregar em uma série anual curada
pro site.
"""

import json

import numpy as np
import pandas as pd

from mapa_amazonia.config import (
    ANO_FIM,
    ANO_INICIO,
    DIAS_CHUVA_MAX,
    DIAS_CHUVA_MIN,
    DIR_PROCESSED,
    DIR_RAW,
    PRECIP_MM_MAX,
    PRECIP_MM_MIN,
)

COLUNAS_CHUVA = ["precip_mm", "dias_chuva"]


def carregar() -> pd.DataFrame:
    tabela = pd.read_csv(DIR_RAW / "precipitacao_mensal_2001_2025.csv")

    n_meses_esperado = (ANO_FIM - ANO_INICIO + 1) * 12
    assert len(tabela) == n_meses_esperado, (
        f"{len(tabela)} linhas, esperava {n_meses_esperado} meses "
        f"({ANO_INICIO}-{ANO_FIM})."
    )
    assert not tabela.duplicated(subset=["ano", "mes"]).any(), (
        "ano + mes deveria ser uma chave única — há duplicata."
    )
    return tabela


def aplicar_faixas_plausiveis(tabela: pd.DataFrame) -> pd.DataFrame:
    """
    Mesma filosofia de 05_montar_tabelas.py: valor fora da faixa plausível
    (config.py, calibrada contra a normal climatológica INMET de Manaus)
    vira nulo, não é descartado nem "consertado".
    """
    faixas = {
        "precip_mm": (PRECIP_MM_MIN, PRECIP_MM_MAX),
        "dias_chuva": (DIAS_CHUVA_MIN, DIAS_CHUVA_MAX),
    }
    for coluna, (minimo, maximo) in faixas.items():
        fora_da_faixa = ~tabela[coluna].between(minimo, maximo) & tabela[coluna].notna()
        n_fora = int(fora_da_faixa.sum())
        if n_fora:
            print(f"  {coluna}: {n_fora} valor(es) fora de [{minimo}, {maximo}] -> virando nulo")
        tabela.loc[fora_da_faixa, coluna] = np.nan
    return tabela


def checagens_de_sanidade(tabela: pd.DataFrame) -> None:
    for coluna, (minimo, maximo) in {
        "precip_mm": (PRECIP_MM_MIN, PRECIP_MM_MAX),
        "dias_chuva": (DIAS_CHUVA_MIN, DIAS_CHUVA_MAX),
    }.items():
        valores = tabela[coluna].dropna()
        assert valores.between(minimo, maximo).all(), (
            f"{coluna} ainda tem valor fora de [{minimo}, {maximo}] depois da limpeza."
        )
        n_nulos = int(tabela[coluna].isna().sum())
        print(f"  {coluna}: {n_nulos} nulo(s) de {len(tabela)}")


def salvar_mensal(tabela: pd.DataFrame) -> None:
    DIR_PROCESSED.mkdir(parents=True, exist_ok=True)
    caminho = DIR_PROCESSED / "chuva_mensal.parquet"
    tabela[["ano", "mes"] + COLUNAS_CHUVA].to_parquet(caminho, index=False)
    print(f"chuva_mensal.parquet salvo em {caminho} ({len(tabela)} linhas).")


def agregar_anual(tabela: pd.DataFrame) -> pd.DataFrame:
    """
    Soma (não média) por ano: precip_mm mensal já é um total do mês, então
    a soma dos 12 meses é o total anual; dias_chuva mensal já é uma
    contagem, então a soma dos 12 meses é a contagem anual. Um ano com mês
    nulo (não deveria acontecer com CHIRPS, mas por precaução) usa
    `min_count=12` pra virar nulo em vez de subestimar silenciosamente.
    """
    anual = (
        tabela.groupby("ano")[COLUNAS_CHUVA]
        .agg(lambda serie: serie.sum(min_count=12))
        .reset_index()
    )
    assert not anual[COLUNAS_CHUVA].isna().any().any(), (
        "Ano com menos de 12 meses válidos -> soma virou nula. Investigar "
        "antes de seguir (não deveria acontecer com CHIRPS v3)."
    )
    return anual


def salvar_anual_json(anual: pd.DataFrame) -> None:
    serie = [
        {
            "ano": int(linha.ano),
            "precip_mm": round(float(linha.precip_mm), 1),
            "dias_chuva": round(float(linha.dias_chuva), 1),
        }
        for linha in anual.itertuples()
    ]
    conteudo = {
        "_sobre": (
            "Série anual de precipitação (CHIRPS v3), volume total e dias de "
            "chuva, cidade inteira (bbox de Manaus, o mesmo do resto do "
            "projeto — inclui a mancha urbana e a floresta ao redor, sem "
            "quebra por zona/célula). Volume vem do produto PENTAD (nativo, "
            "menos derivado); dias de chuva vem da partição diária DAILY_SAT "
            "(derivada via satélite IMERG). Gerado por 09_precipitacao_mensal.py "
            "+ 10_montar_chuva.py."
        ),
        "caveat_metodologico": (
            "CHIRPS é conhecido por subestimar chuva extrema na Amazônia "
            "central — tratar picos/vales muito acentuados com cautela. A "
            "contagem de dias de chuva vem de uma partição diária derivada "
            "do volume pentadal via satélite IMERG, então tem mais incerteza "
            "que o volume pentadal em si: usar como indicativo de tendência, "
            "não como valor absoluto de precisão diária. Resolução nativa do "
            "CHIRPS (~5,5km) é maior que boa parte do bbox de Manaus — por "
            "isso a série é cidade inteira, sem quebra por zona ou célula "
            "de 1km (ver docstring de 09_precipitacao_mensal.py)."
        ),
        "serie_anual": serie,
    }
    caminho = DIR_PROCESSED / "chuva_anual.json"
    with open(caminho, "w", encoding="utf-8") as arquivo:
        json.dump(conteudo, arquivo, ensure_ascii=False, indent=2)
    print(f"chuva_anual.json salvo em {caminho} ({len(serie)} anos).")


def main() -> None:
    print("Lendo CSV cru de precipitação...")
    tabela = carregar()

    print("Aplicando faixas plausíveis (config.py)...")
    tabela = aplicar_faixas_plausiveis(tabela)

    print("Checagens de sanidade...")
    checagens_de_sanidade(tabela)

    print("Salvando mensal limpo...")
    salvar_mensal(tabela)

    print("Agregando série anual...")
    anual = agregar_anual(tabela)
    salvar_anual_json(anual)

    print("Concluído.")


if __name__ == "__main__":
    main()
