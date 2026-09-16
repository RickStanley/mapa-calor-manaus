// TODO(stanley): mover para HTML estático (sem popups)
  // ================= citacoes: marcador clicavel + overlay com a fonte =================
  // Um registro so de fontes, reaproveitado por marcadores .cite espalhados
  // pelo site inteiro (data-cite="id"). Delegacao de evento unica no
  // documento -- nao precisa de listener por marcador.
  (function(){
    const CITACOES = {
      'temp-maxima': {
        tipo: 'Dado', titulo: 'Temperatura máxima média',
        corpo: 'Percentil 90 da temperatura de superfície diurna mensal (não a média simples do bbox, que dilui o efeito da mancha urbana), corrigida da deriva orbital do satélite Terra, regressão linear 2001–2025. Produto MODIS MOD11A2, via Google Earth Engine.',
      },
      'amplitude-termica': {
        tipo: 'Dado', titulo: 'Amplitude térmica: Reserva Adolpho Ducke × Petrópolis',
        corpo: 'Média histórica (2001–2025) de temperatura de superfície diurna na célula mais próxima de cada ponto, produto MODIS MOD11A2. O padrão reproduz o que o estudo da UEA (2002–2012) já havia documentado sobre ilhas de calor em bairros como Petrópolis.',
      },
      'halo-floresta': {
        tipo: 'Dado', titulo: 'Custo por km de distância até a floresta',
        corpo: 'Regressão de temperatura contra distância até o fragmento de floresta mais próximo, controlando o NDVI da própria célula, restrita às 214 células já urbanizadas — isola o efeito de proximidade do efeito trivial de "perto da mata também é mais verde".',
      },
      'hotspot-cidade-nova': {
        tipo: 'Dado', titulo: 'Hotspot de Cidade Nova',
        corpo: 'Regressão linear (NDVI e LST por ano) nas ~10 células vizinhas com a combinação mais extrema de queda de vegetação e alta de temperatura simultâneas, 2001–2025, produtos MODIS MOD11A2/MOD13Q1.',
      },
      'mapa-2025': {
        tipo: 'Dado', titulo: 'Mapa de Manaus, célula a célula',
        corpo: 'Temperatura de superfície diurna, média de 2025, grade de 1 km (2.040 células). Produto MODIS MOD11A2 via Google Earth Engine, corrigido da deriva orbital do satélite Terra.',
      },
      '57km2': {
        tipo: 'Dado', titulo: '57 km² de área verde convertida',
        corpo: 'Classificação de cada célula da grade por NDVI médio (limiar 0,5) em "verde" ou "urbano", comparando a janela 2001–05 com 2021–25. 1.585 km² eram verdes no início da série; 57 km² viraram urbanos até o fim dela.',
      },
      'correlacao-grupo': {
        tipo: 'Dado', titulo: 'Quem perdeu vegetação esquentou mais',
        corpo: 'Contraste entre as 767 células que perderam NDVI e as 1.006 que mantiveram ou ganharam, 2001–05 vs. 2021–25 (n=1.773 células com dado suficiente nas duas janelas): as que desmataram esquentaram, em média, 38% mais.',
      },
      'tendencia-bbox': {
        tipo: 'Dado', titulo: 'Ritmo de aquecimento: cidade vs. floresta ao redor',
        corpo: 'Temperatura diurna média por grupo de células (urbanizadas vs. verdes), 2001–05 vs. 2021–25. O ritmo de aquecimento das duas é parecido (0,041–0,047°C/ano), sinal de que parte da subida é clima regional, não só efeito local da cidade.',
      },
      'palmeiras-acritica': {
        tipo: 'Matéria', titulo: 'Palmeiras "são condenadas" pela má gestão em Manaus',
        corpo: 'Das 120 palmeiras imperiais plantadas na Av. Djalma Batista em 2004, 98 ficaram atrofiadas e 6 morreram — todas removidas em 2010. Reportagem sobre o manejo malsucedido do plantio.',
        link: 'https://www.acritica.com/palmeiras-s-o-condenadas-pela-ma-gest-o-em-manaus-1.130988', linkTexto: 'Ler na A Crítica',
      },
      'pbs-15c': {
        tipo: 'Matéria', titulo: 'Aquecimento vai superar 1,5°C, diz relatório da ONU',
        corpo: 'A ONU já admite que o planeta vai superar o limite de 1,5°C do Acordo de Paris "nos próximos anos" — a estratégia virou reduzir o tempo e a severidade da ultrapassagem, não mais evitá-la por completo.',
        link: 'https://www.pbs.org/newshour/science/global-warming-will-exceed-1-5-degree-limit-un-says-in-report-that-maps-path-back-below-danger-zone', linkTexto: 'Ler na PBS NewsHour',
      },
      'manaus-estrada-floresta': {
        tipo: 'Estudo', titulo: 'Expansão urbana segue a malha viária',
        corpo: 'Modelagem do risco de desmatamento na Região Metropolitana de Manaus encontrou o maior risco onde floresta disponível se sobrepõe a uma malha viária em expansão, longe do núcleo urbano já consolidado.',
        link: 'https://www.sciencedirect.com/science/article/abs/pii/S0301479721023410', linkTexto: 'Ler o estudo',
      },
      'nyc-copa': {
        tipo: 'Política pública', titulo: 'Meta de cobertura de copa de Nova York',
        corpo: 'Nova York mira 30% de cobertura de copa até 2030, priorizando plantio nos bairros historicamente mais expostos a ilhas de calor — meta de equidade, não só de cobertura total.',
        link: 'https://comptroller.nyc.gov/reports/new-york-citys-living-infrastructure-funding-and-managing-nycs-urban-forest-and-tree-canopy/', linkTexto: 'Ler o relatório',
      },
      'melbourne-copa': {
        tipo: 'Política pública', titulo: 'Estratégia de floresta urbana de Melbourne',
        corpo: 'Meta de dobrar a cobertura de copa pública de 22% para 40% até 2040, com pelo menos 3.000 árvores plantadas por ano — meta numérica dentro do próprio plano de crescimento da cidade.',
        link: 'https://www.melbourne.vic.gov.au/urban-forest-strategy', linkTexto: 'Ler a estratégia',
      },
      'perth-densificacao': {
        tipo: 'Estudo', titulo: 'Densificação x cobertura de copa em Perth',
        corpo: 'Modelagem de sistemas (Collaborative Conceptual Modelling) encontrou que, nas políticas atuais, a pressão por densidade habitacional está vencendo a meta de arborização — mais densidade, menos copa, mais calor.',
        link: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6068507/', linkTexto: 'Ler o estudo',
      },
      'calor-saude': {
        tipo: 'Estudo', titulo: 'Ilha de calor e internações cardiovasculares',
        corpo: 'Estudo da EPA com idosos em áreas metropolitanas dos EUA (2000–2017): risco de internação por doença cardiovascular durante calor extremo foi de 2,4% em áreas de ilha de calor intensa, contra 1,0% em áreas mais frias da mesma cidade.',
        link: 'https://cfpub.epa.gov/si/si_public_record_Report.cfm?dirEntryId=358808&Lab=CPHEA', linkTexto: 'Ler o estudo (EPA)',
      },
      'calor-recursos': {
        tipo: 'Dado', titulo: 'Recorde de energia e apagão em Manaus',
        corpo: 'A Região Metropolitana de Manaus bateu recorde de consumo de energia (1.731,91 MW) em 20/08/2024, dia de 36°C com sensação térmica de 45°C. Separadamente, um apagão em março/2025 (falha numa linha de transmissão do Sistema Interligado Nacional) deixou estações de tratamento de água paradas, mostrando como o abastecimento depende do fornecimento elétrico.',
        link: 'https://www.acritica.com/geral/em-meio-a-onda-de-calor-regi-o-metropolitana-de-manaus-bate-recorde-de-consumo-de-energia-eletrica-1.349168', linkTexto: 'Ler na A Crítica',
      },
      'calor-financas': {
        tipo: 'Dado', titulo: 'A energia mais cara do Brasil',
        corpo: 'kWh a R$1,07 no Amazonas contra média nacional de R$0,87 (dados ANEEL) — a hidrelétrica de Balbina (250 MW) não supre a demanda de Manaus, que precisa comprar energia mais cara de fora. Segundo a Eletrobras/Procel, o ar-condicionado pode chegar a 40% do consumo residencial de energia no verão.',
        link: 'https://cieam.com.br/noticias/amazonas-tem-a-tarifa-de-energia-mais-cara-do-pais', linkTexto: 'Ler no CIEAM',
      },
      'calor-ambiente': {
        tipo: 'Estudo', titulo: 'Desmatamento, chuva e renda agrícola na Amazônia',
        corpo: 'Análise de 1982–2018 encontrou queda de 6% a 30% na chuva sazonal em sete estados produtores de soja associada ao desmatamento na Amazônia — com impacto direto na safra e na renda agrícola na própria região.',
        link: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8110785/', linkTexto: 'Ler o estudo (PNAS)',
      },
      'chuva-volume': {
        tipo: 'Dado', titulo: 'Volume de chuva: 2001–12 vs. 2013–25',
        corpo: 'CHIRPS v3 (produto PENTAD, nativo), reduzido sobre o bbox inteiro de Manaus, que inclui a cidade e a floresta ao redor, sem quebra por zona (o pixel de 5,5km é maior que boa parte da malha urbana). Comparação por média de metade da série contra a outra metade, não só os anos das pontas, já que uma janela curta é sensível demais a um único ano de El Niño ou La Niña. Confirmado por uma segunda fonte independente, a reanálise ERA5-Land (1979–2025): mesma direção, queda um pouco maior.',
      },
      'chuva-dias': {
        tipo: 'Dado', titulo: 'Dias de chuva por ano: 2001–12 vs. 2013–25',
        corpo: 'CHIRPS v3 (produto diário, derivado via satélite IMERG, portanto mais incerto que o volume), limiar de 1mm/dia (padrão da Organização Meteorológica Mundial), mesmo recorte e mesma técnica do número de volume. A queda se concentra na estação seca, entre junho e outubro; dezembro a maio quase não mudou. Confirmado por uma segunda fonte independente (ERA5-Land): mesma direção, queda maior.',
      },
      'chuva-julho': {
        tipo: 'Dado', titulo: 'Julho: o mês mais afetado',
        corpo: 'CHIRPS v3, mesmo recorte e mesma técnica do resto dos números de chuva do site: 14,2 dias de chuva em julho na média de 2001 a 2012, contra 11,5 dias na média de 2013 a 2025, queda de 19%. Numa segunda fonte independente (reanálise ERA5-Land, 1979–2025), julho também aparece entre os meses mais afetados, com dias de chuva caindo de 24,2 para 17,3 (29%) e volume de 150,2mm para 90,9mm (40%).',
      },
      'chuva-estacao-seca': {
        tipo: 'Dado', titulo: 'Estação seca (junho a outubro): 2001–12 vs. 2013–25',
        corpo: 'Soma dos dias de chuva de junho a outubro, CHIRPS v3, mesmo bbox e mesma técnica do resto dos números de chuva do site: 72,6 dias na média de 2001 a 2012, contra 62,3 dias na média de 2013 a 2025. Numa segunda fonte independente (ERA5-Land), a queda no mesmo período de 5 meses chega a 25% nos dias de chuva e cerca de 28% no volume.',
      },
      'chuva-torre-petropolis': {
        tipo: 'Estudo', titulo: 'Impacto da urbanização no balanço de energia em Manaus',
        corpo: 'Torre de medição instalada no bairro Petrópolis (2022) comparou o balanço de energia da área urbana com o de floresta primária (Reserva Ducke). Na estação seca, a floresta destina cerca de 75% da energia disponível pra evapotranspiração, e a área urbana, só cerca de 37%. O resto vira calor sensível, que aquece o ar diretamente em vez de virar vapor d\'água. É o mecanismo físico local por trás da ligação entre perda de vegetação e menos chuva.',
        link: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12540988/', linkTexto: 'Ler o estudo (Scientific Reports)',
      },
    };

    const overlay = document.getElementById('cite-overlay');
    if(!overlay) return;
    const tipoEl = document.getElementById('cite-tipo');
    const tituloEl = document.getElementById('cite-title');
    const corpoEl = document.getElementById('cite-corpo');
    const linkEl = document.getElementById('cite-link');

    function abrir(id){
      const c = CITACOES[id];
      if(!c) return;
      tipoEl.textContent = c.tipo;
      tituloEl.textContent = c.titulo;
      corpoEl.textContent = c.corpo;
      if(c.link){ linkEl.href = c.link; linkEl.textContent = c.linkTexto || 'Ver fonte'; linkEl.hidden = false; }
      else { linkEl.hidden = true; }
      overlay.classList.add('visivel');
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('aberto')));
      document.body.style.overflow = 'hidden';
    }
    function fechar(){
      overlay.classList.remove('aberto');
      document.body.style.overflow = '';
      setTimeout(() => { overlay.classList.remove('visivel'); }, 200);
    }

    document.addEventListener('click', (e) => {
      const gatilho = e.target.closest('.cite');
      if(gatilho){ abrir(gatilho.dataset.cite); return; }
      if(e.target.closest('.cite-close') || e.target.classList.contains('cite-overlay-backdrop')){ fechar(); }
    });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && overlay.classList.contains('aberto')) fechar(); });
  })();


(async function(){
  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs){ const e = document.createElementNS(NS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  // ================= animacao de entrada dos graficos (dispara uma vez, nao e' controlada pela rolagem) =================
  function aoEntrarNaTela(elemento, callback){
    if(!('IntersectionObserver' in window)){ callback(); return; }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if(entrada.isIntersecting){ callback(); obs.unobserve(entrada.target); }
      });
    }, { threshold: 0.3 });
    obs.observe(elemento);
  }
  // Card inteiro (svg incluso) entra com fade + leve deslize -- classe
  // .revelado, ver CSS. As linhas do grafico, alem disso, "desenham" via
  // stroke-dashoffset (a transicao dessa propriedade ja esta declarada
  // globalmente em CSS, .chart-card svg path -- so precisamos zerar o
  // dashoffset aqui). Trocado de uma versao anterior que fazia tudo via
  // JS inline: mais simples de garantir que funciona.
  function prepararLinhas(paths){
    paths.forEach(p => {
      const comprimento = p.getTotalLength();
      p.style.strokeDasharray = comprimento;
      p.style.strokeDashoffset = comprimento;
    });
  }
  function revelarCartao(cartao, paths){
    aoEntrarNaTela(cartao, () => {
      cartao.classList.add('revelado');
      requestAnimationFrame(() => { paths.forEach(p => { p.style.strokeDashoffset = '0'; }); });
    });
  }

  // ================= tooltip compartilhado (mouse + toque) =================
  // Usado por todo grafico de ponto/barra do site (halo, hotspot, chuva),
  // exceto o scatter. Um so elemento de tooltip pra pagina inteira -- so um
  // fica visivel de cada vez, entao nao precisa de um por grafico.
  //
  // Mouse: hover mostra e segue o cursor, sair esconde -- sem clique.
  // Toque: tocar num ponto MOSTRA E FIXA o tooltip aberto (sem precisar
  // segurar o dedo -- segurar e' o que aciona o menu de selecao de texto
  // do proprio navegador, a causa da experiencia ruim que motivou esta
  // reescrita). So fecha tocando fora de qualquer ponto -- inclusive
  // dentro do mesmo grafico, fora das barras/circulos. Tocar em outro
  // ponto troca o conteudo direto, sem precisar fechar antes.
  const graficoTooltip = document.getElementById('grafico-tooltip');
  function mostrarTooltip(x, y, html){
    if(!graficoTooltip) return;
    graficoTooltip.innerHTML = html;
    graficoTooltip.style.left = x+'px';
    graficoTooltip.style.top = (y-10)+'px';
    graficoTooltip.classList.add('mostrar');
  }
  function esconderTooltip(){ graficoTooltip?.classList.remove('mostrar'); }
  document.addEventListener('pointerdown', (e) => {
    if(!e.target.closest('.pt-dado')) esconderTooltip();
  });
  // elemento: o circulo/barra que recebe os eventos. getHtml: funcao que
  // devolve o conteudo do tooltip (chamada a cada interacao, nao uma vez
  // so, pra poder computar o texto na hora se precisar).
  function ativarTooltip(elemento, getHtml){
    elemento.classList.add('pt-dado');
    elemento.addEventListener('pointerenter', (ev) => {
      if(ev.pointerType === 'mouse') mostrarTooltip(ev.clientX, ev.clientY, getHtml());
    });
    elemento.addEventListener('pointermove', (ev) => {
      if(ev.pointerType === 'mouse') mostrarTooltip(ev.clientX, ev.clientY, getHtml());
    });
    elemento.addEventListener('pointerleave', (ev) => {
      if(ev.pointerType === 'mouse') esconderTooltip();
    });
    elemento.addEventListener('pointerdown', (ev) => {
      if(ev.pointerType !== 'mouse'){
        ev.preventDefault(); // impede o menu de selecao/callout do toque longo
        ev.stopPropagation(); // impede o listener do documento (acima) de fechar na mesma hora
      }
      mostrarTooltip(ev.clientX, ev.clientY, getHtml());
    });
  }

  // ================= HERO: mapa de calor em canvas, dirigido pelo scroll =================
  // HEAT alimenta tanto o hero quanto o mapa interativo de ilhas de calor
  // mais abaixo -- por isso o try/catch aqui, não em cada um dos dois: se
  // essa busca falhar (rede instável, ou abrir index.html direto via
  // file:// em vez de servidor local, que bloqueia fetch de arquivo),
  // HEAT vira null e cada um dos dois blocos que dependem dele sai cedo
  // (guarda `if(!HEAT) return`), sem travar o resto do script (halo,
  // hotspot, chuva, scatter continuam funcionando normalmente).
  let HEAT = null;
  try {
    const heatMapResponse = await fetch("/resources/hero-heatmap.json");
    if(!heatMapResponse.ok) throw new Error(`HTTP ${heatMapResponse.status}`);
    HEAT = await heatMapResponse.json();
  } catch(erro){
    console.error('Não consegui carregar hero-heatmap.json -- hero e mapa de ilhas de calor ficam desativados nesta carga:', erro);
  }

    (function(){
    const wrap = document.getElementById('hero-scroll');
    const canvas = document.getElementById('hero-canvas');
    const yearEl = document.getElementById('hero-year');
    const tempEl = document.getElementById('hero-temp-num');
    const barEl = document.getElementById('hero-progress-bar');
    if(!wrap || !canvas || !HEAT) return;

    const ctx = canvas.getContext('2d');
    const NROW = HEAT.nrow, NCOL = HEAT.ncol;
    const media = HEAT.media_referencia;
    const coldHalf = media - 24.31;
    const hotHalf = 39.01 - media;
    const ANO_INI = 2001, ANO_FIM = 2025;

    // Extremos calibrados pra bater exatamente com as cores do mapa de
    // ilhas de calor: verde do ponto mais frio (hsl(142 55% 22%)) e
    // vermelho do bloco 35C+ (hsl(2 95% 58%), REALCE). Meio do intervalo
    // continua mudo/escuro -- so os extremos ficam vividos.
    // PASSO quantiza a celula em degraus (evita gradiente 100% continuo).
    // POTENCIA < 1 encurta o caminho ate o vivido: com abs^POTENCIA, valores
    // medios ja saltam perto do teto de saturacao, em vez de so os extremos.
    const PASSO = 0.5;
    const POTENCIA = 0.55;
    function corCelula(vRaw){
      const v = Math.round(vRaw / PASSO) * PASSO;
      const t = v <= media ? -(media - v) / coldHalf : (v - media) / hotHalf;
      const tc = Math.max(-1, Math.min(1, t));
      const abs = Math.pow(Math.abs(tc), POTENCIA);
      const hue = tc < 0 ? 142 : 2;
      const lightAlvo = tc < 0 ? 22 : 58;
      const satAlvo = tc < 0 ? 55 : 95;
      const light = 15 + abs * (lightAlvo - 15);
      const sat = 12 + abs * (satAlvo - 12);
      return `hsl(${hue} ${sat.toFixed(0)}% ${light.toFixed(0)}%)`;
    }

    // Temperatura maxima na superficie: reta de incremento SEMPRE positivo
    // (percentil 90 -- nao a media do bbox inteiro, que e' dominada pela
    // floresta ao redor e sub-representa a mancha urbana quente -- da
    // maxima mensal, corrigida da deriva orbital, regressao linear
    // 2001-2025). Coeficientes calculados fora, em checar_temp_maxima.py.
    const SLOPE_MAX = 0.056205;
    const INTERCEPT_MAX = -79.83109;
    function tempMaximaDaCidade(anoFloat){
      return INTERCEPT_MAX + SLOPE_MAX * anoFloat;
    }

    let cw = 0, ch = 0, dpr = 1, offX = 0, offY = 0;
    // A grade e 51x40 (formato paisagem, 1.28:1). Em telas retrato
    // (mobile), preencher largura E altura sem cortar nada estica cada
    // celula em ~2.6x mais alta que larga -- a mancha de calor fica
    // achatada/deformada. Limita a distorcao da celula (RATIO_MAX) e
    // deixa sobrar so um corte nas bordas leste/oeste, centralizado, em
    // vez de esticar tudo pra caber.
    const RATIO_MAX = 1.6;
    function ajustarTamanho(){
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const fullCw = canvas.width / NCOL;
      const fullCh = canvas.height / NROW;
      if(fullCh / fullCw > RATIO_MAX){
        ch = fullCh; cw = ch / RATIO_MAX;
      } else if(fullCw / fullCh > RATIO_MAX){
        cw = fullCw; ch = cw / RATIO_MAX;
      } else {
        cw = fullCw; ch = fullCh;
      }
      offX = (canvas.width - cw*NCOL) / 2;
      offY = (canvas.height - ch*NROW) / 2;
    }

    function desenhar(matriz){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for(let r=0; r<NROW; r++){
        for(let c=0; c<NCOL; c++){
          const v = matriz[r*NCOL + c];
          ctx.fillStyle = corCelula(v);
          ctx.fillRect(Math.floor(offX + c*cw), Math.floor(offY + r*ch), Math.ceil(cw)+1, Math.ceil(ch)+1);
        }
      }
    }

    let ultimoAnoInt = null;
    function atualizar(){
      const rect = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - window.innerHeight;
      const rolado = -rect.top;
      let p = total > 0 ? rolado / total : 0;
      p = Math.max(0, Math.min(1, p));

      const anoFloat = ANO_INI + p * (ANO_FIM - ANO_INI);
      const anoBase = Math.min(ANO_FIM - 1, Math.floor(anoFloat));
      const frac = anoFloat - anoBase;
      const matA = HEAT.anos[anoBase], matB = HEAT.anos[anoBase + 1];

      const n = matA.length;
      const matriz = new Array(n);
      for(let i=0;i<n;i++){ matriz[i] = matA[i] + (matB[i]-matA[i])*frac; }
      desenhar(matriz);

      const tempInterp = tempMaximaDaCidade(anoFloat);
      const anoExibido = Math.round(anoFloat) > anoBase && frac >= 0.5 ? anoBase+1 : anoBase;
      if(anoExibido !== ultimoAnoInt){ yearEl.textContent = anoExibido; ultimoAnoInt = anoExibido; }
      tempEl.textContent = tempInterp.toFixed(1).replace('.', ',');
      barEl.style.width = (p*100).toFixed(1) + '%';
    }

    let pendente = false;
    function agendar(){
      if(pendente) return;
      pendente = true;
      requestAnimationFrame(() => { atualizar(); pendente = false; });
    }

    ajustarTamanho();
    atualizar();
    window.addEventListener('scroll', agendar, {passive:true});
    window.addEventListener('resize', () => { ajustarTamanho(); atualizar(); });
  })();

  // ================= chart-halo =================
  (function(){
    const svg = document.getElementById('chart-halo');
    if(!svg) return;
    const haloData = [
      {"dist_km": 0.5, "lst": 28.841}, {"dist_km": 1.0, "lst": 29.016},
      {"dist_km": 2.0, "lst": 29.356}, {"dist_km": 3.0, "lst": 30.046},
      {"dist_km": 4.0, "lst": 31.330}, {"dist_km": 5.6, "lst": 31.513}
    ];
    const W=700,H=280, pad={l:40,r:14,t:14,b:32};
    const xs = haloData.map(d=>d.dist_km), ys = haloData.map(d=>d.lst);
    const x0=0, x1=Math.ceil(Math.max(...xs));
    const y0=Math.floor(Math.min(...ys)*2)/2 - .3, y1=Math.ceil(Math.max(...ys)*2)/2 + .3;
    const X = v => pad.l + (v-x0)/(x1-x0)*(W-pad.l-pad.r);
    const Y = v => H-pad.b - (v-y0)/(y1-y0)*(H-pad.t-pad.b);
    for(let i=0;i<=4;i++){
      const val = y0 + (y1-y0)*i/4, gy = Y(val);
      svg.appendChild(el('line',{x1:pad.l,x2:W-pad.r,y1:gy,y2:gy,class:'gridline'}));
      const t = el('text',{x:pad.l-8,y:gy+3,'text-anchor':'end',class:'axis'}); t.textContent=val.toFixed(1)+'°'; svg.appendChild(t);
    }
    [0,1,2,3,4,5,6].forEach(v=>{ if(v>x1) return; const t=el('text',{x:X(v),y:H-10,'text-anchor':'middle',class:'axis'}); t.textContent=v+' km'; svg.appendChild(t); });
    let area = `M ${X(x0)} ${Y(y0)} `; haloData.forEach(p=>{ area += `L ${X(p.dist_km)} ${Y(p.lst)} `; }); area += `L ${X(x1)} ${Y(y0)} Z`;
    const areaPath = el('path',{d:area, fill:cssVar('--chart-red'), opacity:.08});
    svg.appendChild(areaPath);
    let d = haloData.map((p,i)=> (i===0?'M':'L') + X(p.dist_km) + ' ' + Y(p.lst)).join(' ');
    const linePath = el('path',{d, fill:'none', stroke:cssVar('--chart-red'), 'stroke-width':2.6, 'stroke-linecap':'round','stroke-linejoin':'round'});
    svg.appendChild(linePath);
    haloData.forEach(p=>{
      const c=el('circle',{cx:X(p.dist_km),cy:Y(p.lst),r:4,fill:cssVar('--chart-red')});
      svg.appendChild(c);
      // alvo de toque maior que o ponto visivel (r=4), invisivel, so pra facilitar tocar no celular
      const alvo=el('circle',{cx:X(p.dist_km),cy:Y(p.lst),r:14,fill:'transparent',style:'cursor:pointer'});
      svg.appendChild(alvo);
      ativarTooltip(alvo, () => `<b>~${p.dist_km} km</b>${p.lst.toFixed(2)}°C`);
    });
    prepararLinhas([linePath]);
    revelarCartao(svg.closest('.chart-card') || svg, [linePath]);
  })();

  // ================= chart-hotspot =================
  (function(){
    const svg = document.getElementById('chart-hotspot');
    if(!svg) return;
    const hotspotData = [{"ano": 2001, "lst_pct": -2.04, "ndvi_pct": 5.68}, {"ano": 2002, "lst_pct": 1.04, "ndvi_pct": 3.26}, {"ano": 2003, "lst_pct": 0.08, "ndvi_pct": -0.49}, {"ano": 2004, "lst_pct": -0.76, "ndvi_pct": -4.5}, {"ano": 2005, "lst_pct": 1.68, "ndvi_pct": -3.94}, {"ano": 2006, "lst_pct": 0.07, "ndvi_pct": -6.6}, {"ano": 2007, "lst_pct": 1.26, "ndvi_pct": -6.82}, {"ano": 2008, "lst_pct": 0.03, "ndvi_pct": -7.33}, {"ano": 2009, "lst_pct": 4.5, "ndvi_pct": -15.01}, {"ano": 2010, "lst_pct": 3.24, "ndvi_pct": -16.1}, {"ano": 2011, "lst_pct": 3.13, "ndvi_pct": -18.45}, {"ano": 2012, "lst_pct": 2.33, "ndvi_pct": -25.32}, {"ano": 2013, "lst_pct": 2.28, "ndvi_pct": -26.22}, {"ano": 2014, "lst_pct": 4.86, "ndvi_pct": -25.57}, {"ano": 2015, "lst_pct": 10.35, "ndvi_pct": -30.32}, {"ano": 2016, "lst_pct": 8.94, "ndvi_pct": -31.02}, {"ano": 2017, "lst_pct": 8.07, "ndvi_pct": -31.11}, {"ano": 2018, "lst_pct": 9.14, "ndvi_pct": -34.19}, {"ano": 2019, "lst_pct": 8.55, "ndvi_pct": -33.85}, {"ano": 2020, "lst_pct": 11.89, "ndvi_pct": -36.22}, {"ano": 2021, "lst_pct": 8.12, "ndvi_pct": -33.27}, {"ano": 2022, "lst_pct": 7.81, "ndvi_pct": -33.83}, {"ano": 2023, "lst_pct": 13.2, "ndvi_pct": -38.45}, {"ano": 2024, "lst_pct": 11.94, "ndvi_pct": -37.08}, {"ano": 2025, "lst_pct": 6.02, "ndvi_pct": -34.01}];
    // Eixo duplo: cada serie usa a propria escala (min/max dela). Escala
    // log ficou de fora de proposito: NDVI cruza zero (vira negativo), log
    // de valor negativo nao existe -- e mesmo se desse, o intervalo aqui
    // (1 a 40) e' estreito demais pra log comprimir/expandir de um jeito
    // que ajude.
    // Eixo duplo tem o risco classico de leitura: se os dois zeros nao
    // ficam na mesma altura, uma serie perto do proprio zero pode parecer
    // visualmente alinhada com um numero bem diferente na OUTRA escala.
    // Mitigado de duas formas: cada eixo na cor da propria serie, e os dois
    // domínios são simétricos em torno de zero (-max..+max, cada um com o
    // proprio max) -- isso garante que os dois 0% caem exatamente na
    // mesma altura (a grade do meio), ao custo de sobrar espaço vazio no
    // lado que cada serie usa menos.
    const W=700, H=320, pad={l:50,r:50,t:22,b:34};
    const xs = hotspotData.map(d=>d.ano);
    const x0=Math.min(...xs), x1=Math.max(...xs);
    const X = v => pad.l + (v-x0)/(x1-x0)*(W-pad.l-pad.r);

    const corVerde = cssVar('--chart-green'), corVermelho = cssVar('--chart-red');

    const ndviVals = hotspotData.map(d=>d.ndvi_pct);
    const nMax = Math.ceil(Math.max(...ndviVals.map(Math.abs))/5)*5;
    const nY0 = -nMax, nY1 = nMax;
    const Yn = v => H-pad.b - (v-nY0)/(nY1-nY0)*(H-pad.t-pad.b);

    const lstVals = hotspotData.map(d=>d.lst_pct);
    const lMax = Math.ceil(Math.max(...lstVals.map(Math.abs))/5)*5;
    const lY0 = -lMax, lY1 = lMax;
    const Yl = v => H-pad.b - (v-lY0)/(lY1-lY0)*(H-pad.t-pad.b);

    for(let i=0;i<=4;i++){
      const gy = pad.t + (H-pad.t-pad.b)*i/4;
      const linha = el('line',{x1:pad.l,x2:W-pad.r,y1:gy,y2:gy,class:'gridline'});
      if(i===2){ linha.setAttribute('stroke', cssVar('--ink-mute')); linha.setAttribute('stroke-width','1.3'); } // grade do meio = 0% dos dois eixos, alinhados de proposito
      svg.appendChild(linha);
      const valN = nY1 - (nY1-nY0)*i/4;
      const tN = el('text',{x:pad.l-8,y:gy+3,'text-anchor':'end',class:'axis'});
      tN.setAttribute('fill', corVerde); tN.textContent=(valN>0?'+':'')+valN.toFixed(0)+'%'; svg.appendChild(tN);
      const valL = lY1 - (lY1-lY0)*i/4;
      const tL = el('text',{x:W-pad.r+8,y:gy+3,'text-anchor':'start',class:'axis'});
      tL.setAttribute('fill', corVermelho); tL.textContent=(valL>0?'+':'')+valL.toFixed(0)+'%'; svg.appendChild(tL);
    }
    hotspotData.forEach(d=>{ if(d.ano%5===0){ const t=el('text',{x:X(d.ano),y:H-10,'text-anchor':'middle',class:'axis'}); t.textContent=d.ano; svg.appendChild(t); } });

    // bolinha da cor da linha antes de cada legenda, pra ficar claro qual
    // eixo/cor corresponde a qual série sem precisar decorar "verde=NDVI".
    svg.appendChild(el('circle',{cx:pad.l+4, cy:9.5, r:3.5, fill:corVerde}));
    const rotN = el('text',{x:pad.l+12,y:13,'text-anchor':'start',class:'axis'});
    rotN.setAttribute('fill', corVerde); rotN.style.fontWeight='600'; rotN.textContent='Vegetação (NDVI)';
    svg.appendChild(rotN);

    const rotL = el('text',{x:W-pad.r-12,y:13,'text-anchor':'end',class:'axis'});
    rotL.setAttribute('fill', corVermelho); rotL.style.fontWeight='600'; rotL.textContent='Temperatura (LST Diurna)';
    svg.appendChild(rotL);
    const bboxL = rotL.getBBox();
    svg.appendChild(el('circle',{cx:bboxL.x-8, cy:9.5, r:3.5, fill:corVermelho}));

    function serie(key, Yfn, cor){
      const d = hotspotData.map((p,i)=>(i===0?'M':'L')+X(p.ano)+' '+Yfn(p[key])).join(' ');
      const linha = el('path',{d, fill:'none', stroke:cor, 'stroke-width':2.6, 'stroke-linecap':'round','stroke-linejoin':'round'});
      svg.appendChild(linha);
      hotspotData.forEach(p=>{
        const c = el('circle',{cx:X(p.ano), cy:Yfn(p[key]), r:2.8, fill:cor});
        svg.appendChild(c);
        // alvo de toque maior que o ponto visivel, invisivel
        const alvo = el('circle',{cx:X(p.ano), cy:Yfn(p[key]), r:12, fill:'transparent', style:'cursor:pointer'});
        svg.appendChild(alvo);
        ativarTooltip(alvo, () => `<b>${p.ano}</b>${p[key]>0?'+':''}${p[key].toFixed(1)}%`);
      });
      return linha;
    }
    const linhaNdvi = serie('ndvi_pct', Yn, corVerde);
    const linhaLst = serie('lst_pct', Yl, corVermelho);

    prepararLinhas([linhaNdvi, linhaLst]);
    revelarCartao(svg.closest('.chart-card') || svg, [linhaNdvi, linhaLst]);
  })();

  // ================= chart-chuva-volume / chart-chuva-dias (barra divergente) =================
  // Mesma técnica pros dois gráficos: uma barra por mês, pra cima ou pra
  // baixo do zero conforme a variação entre metade inicial (2001-12) e
  // metade final (2013-25) da série CHIRPS. Cor não é fixa: quanto maior a
  // queda, mais perto do vermelho (--chart-red, o mesmo "quente" usado no
  // resto do site pra temperatura); queda pequena ou aumento fica perto do
  // amarelo (--chart-yellow) -- deliberadamente sem verde aqui, pra não
  // sugerir "bom" onde não tem sinal de melhora, só de menos piora.
  (function(){
    const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    // ano/mes só documentativos aqui -- o que importa é a média de cada
    // mês do calendário nas 12 (volume) ou 13 (dias) observações de cada
    // metade da série, já calculada em 10_montar_chuva.py.
    const VOLUME_MES = [
      {mes:1,inicio:273,fim:254},{mes:2,inicio:295,fim:265},{mes:3,inicio:300,fim:319},
      {mes:4,inicio:307,fim:268},{mes:5,inicio:238,fim:219},{mes:6,inicio:125,fim:124},
      {mes:7,inicio:76,fim:78},{mes:8,inicio:59,fim:55},{mes:9,inicio:77,fim:83},
      {mes:10,inicio:132,fim:116},{mes:11,inicio:179,fim:171},{mes:12,inicio:258,fim:237},
    ];
    const DIAS_MES = [
      {mes:1,inicio:24.6,fim:21.5},{mes:2,inicio:23.6,fim:21.9},{mes:3,inicio:27.0,fim:24.4},
      {mes:4,inicio:25.9,fim:24.3},{mes:5,inicio:24.5,fim:23.4},{mes:6,inicio:17.8,fim:14.7},
      {mes:7,inicio:14.2,fim:11.5},{mes:8,inicio:10.5,fim:9.5},{mes:9,inicio:14.2,fim:12.0},
      {mes:10,inicio:15.9,fim:14.7},{mes:11,inicio:17.1,fim:17.1},{mes:12,inicio:22.5,fim:21.3},
    ];

    function misturarCores(hexA, hexB, t){
      t = Math.max(0, Math.min(1, t));
      const a = [1,3,5].map(i => parseInt(hexA.slice(i,i+2),16));
      const b = [1,3,5].map(i => parseInt(hexB.slice(i,i+2),16));
      const m = a.map((va,i) => Math.round(va + (b[i]-va)*t));
      return `rgb(${m[0]},${m[1]},${m[2]})`;
    }

    function desenharBarraDivergente(idSvg, dados, unidade){
      const svg = document.getElementById(idSvg);
      if(!svg) return;

      const pctChange = dados.map(d => 100*(d.fim-d.inicio)/d.inicio);
      const maiorQueda = Math.max(1, ...pctChange.map(v => -v)); // maior queda observada (positivo)
      const corAmarelo = cssVar('--chart-yellow'), corVermelho = cssVar('--chart-red');

      const W=700, H=280, pad={l:44,r:20,t:20,b:34};
      const maxAbs = Math.max(...pctChange.map(Math.abs)) * 1.15;
      const plotH = H-pad.t-pad.b;
      const Y = v => pad.t + plotH/2 - v/maxAbs*(plotH/2);
      const zeroY = Y(0);
      const groupW = (W-pad.l-pad.r)/dados.length;
      const barW = groupW*0.6;

      for(let i=0;i<=4;i++){
        const v = maxAbs - maxAbs*2*i/4;
        const gy = Y(v);
        const linha = el('line',{x1:pad.l,x2:W-pad.r,y1:gy,y2:gy,class:'gridline'});
        if(Math.abs(v)<0.01){ linha.setAttribute('stroke', cssVar('--ink-mute')); linha.setAttribute('stroke-width','1.3'); }
        svg.appendChild(linha);
        const t = el('text',{x:pad.l-8,y:gy+3,'text-anchor':'end',class:'axis'});
        t.textContent=(v>0?'+':'')+Math.round(v)+'%'; svg.appendChild(t);
      }

      const barras = [];
      dados.forEach((d,i) => {
        const cx = pad.l + i*groupW + groupW/2;
        const pct = pctChange[i];
        const cor = misturarCores(corAmarelo, corVermelho, Math.max(0,-pct)/maiorQueda);
        const bar = el('rect', {
          class:'bar-diverge', x:cx-barW/2, y:zeroY, width:barW, height:0,
          fill:cor, rx:2, style:'cursor:pointer',
          'aria-label': `${MESES[d.mes-1]}: ${pct>=0?'+':''}${pct.toFixed(0)}%`,
        });
        svg.appendChild(bar);
        ativarTooltip(bar, () => `<b>${MESES[d.mes-1]}</b>${pct>=0?'+':''}${pct.toFixed(0)}% (${d.inicio}${unidade} → ${d.fim}${unidade})`);
        barras.push({ el:bar, yFinal: Y(pct), hFinal: Math.abs(Y(pct)-zeroY) });

        const rot = el('text',{x:cx,y:H-10,'text-anchor':'middle',class:'axis'});
        rot.textContent = MESES[d.mes-1]; svg.appendChild(rot);
      });

      aoEntrarNaTela(svg.closest('.chart-card') || svg, () => {
        svg.closest('.chart-card')?.classList.add('revelado');
        requestAnimationFrame(() => {
          barras.forEach(b => {
            const y = Math.min(b.yFinal, zeroY);
            b.el.setAttribute('y', y);
            b.el.setAttribute('height', b.hFinal);
          });
        });
      });
    }

    desenharBarraDivergente('chart-chuva-volume', VOLUME_MES, 'mm');
    desenharBarraDivergente('chart-chuva-dias', DIAS_MES, ' dias');
  })();

  // ================= chart-heatmap =================
  (function(){
    const wrap = document.getElementById('heatmap-wrap');
    const canvas = document.getElementById('chart-heatmap');
    if(!wrap || !canvas || !HEAT) return;
    const ctx = canvas.getContext('2d');
    const labelsLayer = document.getElementById('heatmap-labels');

    const NROW = HEAT.nrow, NCOL = HEAT.ncol;
    // Escala em blocos de 0,5°C (não gradiente contínuo, e não a mesma
    // escala do hero): verde vívido até 31,5°C, vermelho gradual até
    // 35°C, e um único bloco bem mais saturado pra tudo >= 35°C, pra
    // fazer os pontos mais quentes da cidade saltarem aos olhos.
    const COLD_ANCORA = 24.31, CORTE = 31.5, REALCE = 35, PASSO = 0.5;
    function corCelula(v){
      if(v >= REALCE) return 'hsl(2 95% 58%)';
      if(v < CORTE){
        const nBlocos = Math.ceil((CORTE - COLD_ANCORA) / PASSO);
        const i = Math.max(0, Math.floor((v - COLD_ANCORA) / PASSO));
        const t = Math.min(1, i / (nBlocos - 1));
        // Invertido de propósito: verde mais CLARO = mais frio (t baixo),
        // verde mais ESCURO = mais quente (t alto, perto do corte pro
        // vermelho) — mais saturado também, pra reforçar a leitura.
        return `hsl(142 ${(55 + t*18).toFixed(0)}% ${(42 - t*20).toFixed(0)}%)`;
      }
      const nBlocos = Math.ceil((REALCE - CORTE) / PASSO);
      const i = Math.floor((v - CORTE) / PASSO);
      const t = Math.min(1, i / (nBlocos - 1));
      return `hsl(8 ${(45 + t*35).toFixed(0)}% ${(30 + t*20).toFixed(0)}%)`;
    }

    // Posição (fração 0-1, esquerda->direita / topo->baixo) dos 63 bairros
    // oficiais de Manaus (lei 1.401/2010, lista completa) + Reserva Adolpho
    // Ducke, geocodificados via OpenStreetMap/Nominatim (busca "BAIRRO,
    // Manaus, Amazonas, Brazil", um a um) e convertidos pra fração da grade
    // cruzando com data/processed/grade.geojson. Mesma verificação de
    // orientação da versão anterior (linha 0 = extremo NORTE, coluna 0 =
    // extremo OESTE) -- batida contra numeros_chave.json com exatidão.
    //
    // "p" é prioridade (0 = sempre tenta mostrar primeiro, 3 = só preenche
    // se sobrar espaço): não é um corte fixo de zoom, é usado pelo sistema
    // de colisão abaixo, que mede o texto de verdade e só desenha o que
    // não esbarra em um rótulo mais prioritário já colocado -- por isso o
    // mapa mostra o máximo de nomes que cabem em qualquer zoom, não um
    // conjunto fixo por faixa.
    const PONTOS = [
      { nome:'Adrianópolis', x:0.4266, y:0.7167, p:1 },
      { nome:'Aleixo', x:0.4687, y:0.6754, p:2 },
      { nome:'Alvorada', x:0.3372, y:0.6428, p:2 },
      { nome:'Armando Mendes', x:0.5730, y:0.6947, p:3 },
      { nome:'Betânia', x:0.4565, y:0.8064, p:3 },
      { nome:'Cachoeirinha', x:0.4346, y:0.7841, p:3 },
      { nome:'Centro', x:0.3986, y:0.8036, p:0 },
      { nome:'Chapada', x:0.3862, y:0.6827, p:3 },
      { nome:'Cidade Nova', x:0.4631, y:0.5115, p:1 },
      { nome:'Cidade de Deus', x:0.5570, y:0.4795, p:3 },
      { nome:'Colônia Antônio Aleixo', x:0.6577, y:0.7277, p:3 },
      { nome:'Colônia Japonesa', x:0.4385, y:0.6398, p:3 },
      { nome:'Colônia Oliveira Machado', x:0.4472, y:0.8539, p:3 },
      { nome:'Colônia Terra Nova', x:0.4141, y:0.4635, p:3 },
      { nome:'Compensa', x:0.3271, y:0.7267, p:1 },
      { nome:'Coroado', x:0.5058, y:0.6836, p:2 },
      { nome:'Crespo', x:0.4694, y:0.8086, p:3 },
      { nome:'Da Paz', x:0.3783, y:0.5888, p:3 },
      { nome:'Distrito Industrial I', x:0.5354, y:0.7752, p:2 },
      { nome:'Distrito Industrial II', x:0.6642, y:0.5488, p:3 },
      { nome:'Dom Pedro', x:0.3506, y:0.6768, p:3 },
      { nome:'Educandos', x:0.4220, y:0.8323, p:2 },
      { nome:'Flores', x:0.3994, y:0.6341, p:2 },
      { nome:'Gilberto Mestrinho', x:0.6098, y:0.6293, p:3 },
      { nome:'Glória', x:0.3693, y:0.7647, p:3 },
      { nome:'Japiim', x:0.4750, y:0.7495, p:2 },
      { nome:'Jorge Teixeira', x:0.6288, y:0.5032, p:3 },
      { nome:'Lago Azul', x:0.4571, y:0.3413, p:3 },
      { nome:'Lírio do Vale', x:0.2872, y:0.6474, p:3 },
      { nome:'Mauazinho', x:0.5813, y:0.7715, p:3 },
      { nome:'Monte das Oliveiras', x:0.4542, y:0.4390, p:3 },
      { nome:'Morro da Liberdade', x:0.4458, y:0.8205, p:3 },
      { nome:'Nossa Senhora Aparecida', x:0.2791, y:0.5858, p:3 },
      { nome:'Nossa Senhora das Graças', x:0.4020, y:0.7239, p:3 },
      { nome:'Nova Cidade', x:0.4992, y:0.4336, p:3 },
      { nome:'Nova Esperança', x:0.3145, y:0.6659, p:3 },
      { nome:'Novo Aleixo', x:0.5253, y:0.5828, p:3 },
      { nome:'Novo Israel', x:0.4299, y:0.5058, p:3 },
      { nome:'Parque 10 de Novembro', x:0.3992, y:0.6529, p:3 },
      { nome:'Petrópolis', x:0.4582, y:0.7458, p:1 },
      { nome:'Planalto', x:0.3192, y:0.6126, p:3 },
      { nome:'Ponta Negra', x:0.2324, y:0.5715, p:1 },
      { nome:'Praça 14 de Janeiro', x:0.4138, y:0.7761, p:3 },
      { nome:'Presidente Vargas', x:0.3811, y:0.7648, p:3 },
      { nome:'Puraquequara', x:0.8300, y:0.5775, p:3 },
      { nome:'Raiz', x:0.4510, y:0.7884, p:3 },
      { nome:'Redenção', x:0.3497, y:0.5835, p:2 },
      { nome:'Reserva Adolpho Ducke', x:0.6025, y:0.3116, p:0 },
      { nome:'Santa Etelvina', x:0.4294, y:0.4063, p:3 },
      { nome:'Santa Luzia', x:0.4320, y:0.8251, p:3 },
      { nome:'Santo Agostinho', x:0.2980, y:0.6804, p:3 },
      { nome:'Santo Antônio', x:0.3485, y:0.7570, p:3 },
      { nome:'São Francisco', x:0.4389, y:0.7444, p:3 },
      { nome:'São Geraldo', x:0.3898, y:0.7434, p:3 },
      { nome:'São Jorge', x:0.3538, y:0.7087, p:3 },
      { nome:'São José Operário', x:0.5673, y:0.6161, p:3 },
      { nome:'São Lázaro', x:0.4601, y:0.8273, p:3 },
      { nome:'São Raimundo', x:0.3540, y:0.7732, p:2 },
      { nome:'Tancredo Neves', x:0.5826, y:0.5781, p:3 },
      { nome:'Tarumã', x:0.3324, y:0.4965, p:2 },
      { nome:'Tarumã-Açu', x:0.2903, y:0.3581, p:3 },
      { nome:'Vila Buriti', x:0.5098, y:0.8370, p:3 },
      { nome:'Vila da Prata', x:0.3427, y:0.7358, p:3 },
      { nome:'Zumbi dos Palmares', x:0.5661, y:0.6403, p:3 },
    ];

    // Canvas fora da tela, pré-renderizado uma vez na resolução máxima --
    // zoom/pan só recortam e escalam essa imagem (rápido, sem recalcular
    // cor a cada frame de interação).
    const CELL_PX = 16;
    const off = document.createElement('canvas');
    off.width = NCOL * CELL_PX;
    off.height = NROW * CELL_PX;
    const offCtx = off.getContext('2d');
    const matriz = HEAT.anos['2025'];
    for(let r=0; r<NROW; r++){
      for(let c=0; c<NCOL; c++){
        offCtx.fillStyle = corCelula(matriz[r*NCOL + c]);
        offCtx.fillRect(c*CELL_PX, r*CELL_PX, CELL_PX, CELL_PX);
      }
    }

    const ZOOM_MIN = 1, ZOOM_MAX = 8;
    const view = { cx:0.5, cy:0.5, zoom:1 };

    function clampView(){
      view.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, view.zoom));
      const halfW = 0.5/view.zoom, halfH = 0.5/view.zoom;
      view.cx = Math.max(halfW, Math.min(1-halfW, view.cx));
      view.cy = Math.max(halfH, Math.min(1-halfH, view.cy));
    }

    function ajustarTamanho(){
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    function desenhar(){
      const halfW = 0.5/view.zoom, halfH = 0.5/view.zoom;
      const sx = (view.cx-halfW)*off.width, sy = (view.cy-halfH)*off.height;
      const sw = 2*halfW*off.width, sh = 2*halfH*off.height;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(off, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      atualizarLabels(halfW, halfH);
    }

    function atualizarLabels(halfW, halfH){
      labelsLayer.innerHTML = '';
      // Candidatos visíveis no recorte atual, ordenados por prioridade --
      // os mais importantes tentam entrar primeiro.
      const candidatos = [];
      PONTOS.forEach(p => {
        const dx = (p.x - (view.cx-halfW)) / (2*halfW);
        const dy = (p.y - (view.cy-halfH)) / (2*halfH);
        if(dx < 0.03 || dx > 0.97 || dy < 0.06 || dy > 0.97) return;
        candidatos.push({ p, dx, dy });
      });
      candidatos.sort((a, b) => a.p.p - b.p.p);

      // Colisão real: cada rótulo é medido de verdade (getBoundingClientRect)
      // e só fica visível se não esbarrar em nenhum já aceito -- é isso que
      // deixa o mapa sempre mostrando o máximo de nomes que cabem, em vez
      // de um conjunto fixo por faixa de zoom.
      const ocupados = [];
      const MARGEM = 4;
      candidatos.forEach(({ p, dx, dy }) => {
        const el = document.createElement('span');
        el.className = 'heatmap-label';
        el.textContent = p.nome;
        el.style.left = (dx*100)+'%';
        el.style.top = (dy*100)+'%';
        el.style.visibility = 'hidden';
        labelsLayer.appendChild(el);
        const r = el.getBoundingClientRect();
        const caixa = { l:r.left-MARGEM, r:r.right+MARGEM, t:r.top-MARGEM, b:r.bottom+MARGEM };
        const colide = ocupados.some(o => !(caixa.r < o.l || caixa.l > o.r || caixa.b < o.t || caixa.t > o.b));
        if(colide){
          labelsLayer.removeChild(el);
        } else {
          el.style.visibility = 'visible';
          ocupados.push(caixa);
        }
      });
    }

    // Barra da legenda desenhada com a mesma corCelula, pra mostrar os
    // blocos de verdade em vez de um gradiente suave que não existe no mapa.
    const legendCanvas = document.getElementById('heatmap-legend-bar');
    const legendMark = document.getElementById('heatmap-legend-mark');
    const LEGEND_MAX = 39.01;
    function desenharLegenda(){
      if(!legendCanvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = legendCanvas.getBoundingClientRect();
      legendCanvas.width = Math.round(rect.width * dpr);
      legendCanvas.height = Math.round(rect.height * dpr);
      const lctx = legendCanvas.getContext('2d');
      for(let i=0; i<legendCanvas.width; i++){
        const v = COLD_ANCORA + (i/legendCanvas.width) * (LEGEND_MAX - COLD_ANCORA);
        lctx.fillStyle = corCelula(v);
        lctx.fillRect(i, 0, 2, legendCanvas.height);
      }
      if(legendMark){
        const frac = (CORTE - COLD_ANCORA) / (LEGEND_MAX - COLD_ANCORA);
        legendMark.style.left = (frac*100).toFixed(1) + '%';
        legendMark.textContent = CORTE.toFixed(1).replace('.', ',') + '°C';
      }
    }

    aoEntrarNaTela(wrap.closest('.chart-card'), () => {
      wrap.closest('.chart-card').classList.add('revelado');
      ajustarTamanho();
      desenhar();
      desenharLegenda();
    });
    window.addEventListener('resize', () => { ajustarTamanho(); desenhar(); desenharLegenda(); });
  })();

  // ================= chart-scatter =================
  (async function(){
    const svg = document.getElementById('chart-scatter');
    if(!svg) return;
    let pts;
    try {
      const vegetationDataResponse = await fetch("/resources/vegetation.json");
      if(!vegetationDataResponse.ok) throw new Error(`HTTP ${vegetationDataResponse.status}`);
      pts = await vegetationDataResponse.json();
    } catch(erro){
      console.error('Não consegui carregar vegetation.json -- gráfico de dispersão fica vazio nesta carga:', erro);
      return;
    }
    const corr = {"n": 1773, "slope": -0.01256, "intercept": 0.9008, "r2": 0.057, "r": -0.2387, "x_min": -79.2, "x_max": 104.2, "grupo_perdeu": {"n": 767, "media_lst_var": 1.091}, "grupo_manteve": {"n": 1006, "media_lst_var": 0.788}};
    const W=700,H=320, pad={l:44,r:14,t:14,b:34};
    const CLIP=50;
    const pf = pts.filter(p=>Math.abs(p[0])<=CLIP);
    const ys = pf.map(p=>p[1]);
    const x0=-CLIP, x1=CLIP;
    const y0=Math.floor(Math.min(...ys)*2)/2-.3, y1=Math.ceil(Math.max(...ys)*2)/2+.3;
    const X = v => pad.l + (v-x0)/(x1-x0)*(W-pad.l-pad.r);
    const Y = v => H-pad.b - (v-y0)/(y1-y0)*(H-pad.t-pad.b);
    for(let i=0;i<=4;i++){ const val=y0+(y1-y0)*i/4, gy=Y(val); svg.appendChild(el('line',{x1:pad.l,x2:W-pad.r,y1:gy,y2:gy,class:'gridline'})); const t=el('text',{x:pad.l-8,y:gy+3,'text-anchor':'end',class:'axis'}); t.textContent=(val>0?'+':'')+val.toFixed(1)+'°'; svg.appendChild(t); }
    [-50,-25,0,25,50].forEach(v=>{ const t=el('text',{x:X(v),y:H-14,'text-anchor':'middle',class:'axis'}); t.textContent=(v>0?'+':'')+v+'%'; svg.appendChild(t); svg.appendChild(el('line',{x1:X(v),x2:X(v),y1:pad.t,y2:H-pad.b,class:'gridline'})); });
    // Pontos aparecem em ordem embaralhada (nao da esquerda pra direita),
    // espalhados ao longo de 3s -- o atraso fica gravado no proprio ponto
    // (transition-delay), entao so precisamos disparar a opacidade final
    // uma vez pra todos, sem loop de setTimeout.
    const DURACAO_POPULACAO_MS = 3000;
    const ordemAleatoria = pf.map((_, i) => i);
    for(let i = ordemAleatoria.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [ordemAleatoria[i], ordemAleatoria[j]] = [ordemAleatoria[j], ordemAleatoria[i]];
    }
    const atrasoPorIndiceOriginal = new Array(pf.length);
    ordemAleatoria.forEach((indiceOriginal, posicaoNaAnimacao) => {
      atrasoPorIndiceOriginal[indiceOriginal] = (posicaoNaAnimacao / pf.length) * DURACAO_POPULACAO_MS;
    });

    const pontos = pf.map((p,i)=>{
      const color = p[2] ? cssVar('--chart-red') : cssVar('--chart-green');
      const c=el('circle',{cx:X(p[0]),cy:Y(p[1]),r:3,fill:color});
      c.style.opacity = '0';
      c.style.transition = `opacity .5s ease-out ${atrasoPorIndiceOriginal[i].toFixed(0)}ms`;
      const t=el('title',{}); t.textContent='NDVI '+(p[0]>0?'+':'')+p[0].toFixed(1)+'% · LST '+(p[1]>0?'+':'')+p[1].toFixed(2)+'°C'; c.appendChild(t); svg.appendChild(c);
      return c;
    });
    const path = `M ${X(x0)} ${Y(corr.slope*x0+corr.intercept)} L ${X(x1)} ${Y(corr.slope*x1+corr.intercept)}`;
    const linhaReg = el('path',{d:path, fill:'none', stroke:cssVar('--ink'), 'stroke-width':2, opacity:.7});
    linhaReg.style.transitionDelay = (DURACAO_POPULACAO_MS - 500) + 'ms'; // a reta so desenha depois da nuvem de pontos ja formada
    svg.appendChild(linhaReg);
    prepararLinhas([linhaReg]);

    const cartao = svg.closest('.chart-card') || svg;
    aoEntrarNaTela(cartao, () => {
      cartao.classList.add('revelado');
      requestAnimationFrame(() => {
        linhaReg.style.strokeDashoffset = '0';
        pontos.forEach(c => { c.style.opacity = '.4'; });
      });
    });
  })();

  // ================= carrossel: arrastar com o mouse no desktop =================
  // overflow-x:auto já dá scroll por trackpad/barra de rolagem, mas clicar
  // e arrastar com o mouse não move um scroll container por padrão --
  // precisa de JS. Só ativa pra ponteiro tipo mouse: toque já tem scroll
  // nativo por gesto, arrastar com um dedo faria o gesto ser capturado
  // duas vezes.
  (function(){
    const track = document.getElementById('carousel-track');
    if(!track) return;

    let arrastando = false, comecouX = 0, scrollInicial = 0;

    track.addEventListener('pointerdown', (e) => {
      if(e.pointerType !== 'mouse') return;
      arrastando = true;
      comecouX = e.clientX;
      scrollInicial = track.scrollLeft;
      track.style.scrollSnapType = 'none'; // solta o snap durante o arrasto, senão o navegador briga com o movimento
      // user-select:none só enquanto arrasta -- fora disso, o crédito da
      // foto (figcaption, incluindo atribuição CC BY) precisa continuar
      // selecionável normalmente.
      track.classList.add('arrastando');
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if(!arrastando) return;
      track.scrollLeft = scrollInicial - (e.clientX - comecouX);
    });
    function soltar(){
      if(!arrastando) return;
      arrastando = false;
      track.style.scrollSnapType = '';
      track.classList.remove('arrastando');
    }
    track.addEventListener('pointerup', soltar);
    track.addEventListener('pointercancel', soltar);

    // sem isso, soltar o botão do mouse em cima de uma foto dispara o
    // "arrastar imagem" nativo do navegador (ghost da imagem seguindo o
    // cursor), que atrapalha o gesto de arrastar o carrossel inteiro.
    track.querySelectorAll('img').forEach(img => img.setAttribute('draggable', 'false'));
  })();

})();
