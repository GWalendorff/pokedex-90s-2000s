/*
  Pokédex 90s & 2000s
  O JavaScript busca os dados na PokéAPI e cria os cards dos Pokémon.
*/

const API = "https://pokeapi.co/api/v2";
const TOTAL_POKEMON = 251;
const ULTIMO_ID_GERACAO_1 = 151;
const POR_PAGINA = 12;
const CHAVE_FAVORITOS = "pokedex-favoritos";

// Nomes e cores dos tipos de Pokémon
const TIPOS = {
  normal:   { nome: "Normal", cor: "#8a8a59" },
  fire:     { nome: "Fogo", cor: "#d9480f" },
  water:    { nome: "Água", cor: "#2f6fd6" },
  grass:    { nome: "Planta", cor: "#2f8f3a" },
  electric: { nome: "Elétrico", cor: "#f2c200", textoEscuro: true },
  ice:      { nome: "Gelo", cor: "#5bb8c4", textoEscuro: true },
  fighting: { nome: "Lutador", cor: "#b5281c" },
  poison:   { nome: "Veneno", cor: "#8e3fa0" },
  ground:   { nome: "Terra", cor: "#c9a43b", textoEscuro: true },
  flying:   { nome: "Voador", cor: "#7d8fe0", textoEscuro: true },
  psychic:  { nome: "Psíquico", cor: "#e0407a" },
  bug:      { nome: "Inseto", cor: "#7a9a14" },
  rock:     { nome: "Pedra", cor: "#9c8a2e" },
  ghost:    { nome: "Fantasma", cor: "#5b4a8c" },
  dragon:   { nome: "Dragão", cor: "#4a2fc2" },
  dark:     { nome: "Sombrio", cor: "#4b3b32" },
  steel:    { nome: "Aço", cor: "#6f8294" },
  fairy:    { nome: "Fada", cor: "#d56fa4", textoEscuro: true }
};

// Informações usadas pelos filtros e pela paginação
const estado = {
  todos: [],
  pagina: 1,
  busca: "",
  geracao: "",
  tipo: "",
  soFavoritos: false
};

// Guarda os dados já consultados para não buscar novamente
const cacheDetalhes = {};
const cacheTipos = {};

let contadorRequisicao = 0;
let eventosConfigurados = false;

// Elementos do HTML
const els = {
  grade: document.getElementById("personagens"),
  resumo: document.getElementById("resumo"),
  busca: document.getElementById("busca"),
  geracao: document.getElementById("geracao"),
  tipo: document.getElementById("tipo"),
  btnFavoritos: document.getElementById("btn-favoritos"),
  contadorFavoritos: document.getElementById("contador-favoritos"),
  btnLimpar: document.getElementById("btn-limpar"),
  btnAnterior: document.getElementById("btn-anterior"),
  btnProxima: document.getElementById("btn-proxima"),
  indicador: document.getElementById("indicador-pagina"),
  form: document.getElementById("form-filtros")
};


// 1. BUSCA DOS DADOS NA POKÉAPI

// Faz a requisição e transforma a resposta em JSON
function buscarJSON(url) {
  return fetch(url).then((resposta) => {
    if (!resposta.ok) {
      throw new Error(`Erro ao buscar os dados: ${resposta.status}`);
    }

    return resposta.json();
  });
}

// Pega o número do Pokémon pela URL da API
function idDaUrl(url) {
  return Number(url.split("/").filter(Boolean).pop());
}

// Carrega os 251 Pokémon das duas primeiras gerações
function carregarLista() {
  return buscarJSON(`${API}/pokemon?limit=${TOTAL_POKEMON}`).then((dados) => {
    return dados.results.map((pokemon) => ({
      id: idDaUrl(pokemon.url),
      nome: pokemon.name
    }));
  });
}

// Busca as informações completas de um Pokémon
function obterDetalhes(id) {
  if (cacheDetalhes[id]) {
    return Promise.resolve(cacheDetalhes[id]);
  }

  return buscarJSON(`${API}/pokemon/${id}`).then((dados) => {

    // Procura um atributo específico, como HP ou ataque
    const stat = (nome) => {
      const item = dados.stats.find((s) => s.stat.name === nome);
      return item ? item.base_stat : "—";
    };

    const pokemon = {
      id: dados.id,
      nome: dados.name,

      imagem:
        dados.sprites?.other?.["official-artwork"]?.front_default ||
        dados.sprites?.front_default ||
        "",

      tipos: dados.types.map((t) => t.type.name),

      // Converte altura para metros e peso para quilos
      altura: dados.height / 10,
      peso: dados.weight / 10,

      habilidades: dados.abilities.map((a) => a.ability.name),
      hp: stat("hp"),
      ataque: stat("attack")
    };

    cacheDetalhes[id] = pokemon;

    return pokemon;
  });
}

// Busca os números dos Pokémon que pertencem a um tipo
function obterIdsDoTipo(tipo) {
  if (cacheTipos[tipo]) {
    return Promise.resolve(cacheTipos[tipo]);
  }

  return buscarJSON(`${API}/type/${tipo}`).then((dados) => {
    const ids = dados.pokemon.map((p) => idDaUrl(p.pokemon.url));

    cacheTipos[tipo] = ids;

    return ids;
  });
}


// 2. SISTEMA DE FAVORITOS

// Lê os favoritos salvos no navegador
function lerFavoritos() {
  try {
    const favoritos = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS));
    return Array.isArray(favoritos) ? favoritos : [];
  } catch (erro) {
    return [];
  }
}

// Salva os favoritos no navegador
function salvarFavoritos(lista) {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
  } catch (erro) {
    // O site continua funcionando se o armazenamento não estiver disponível
  }
}

// Adiciona ou remove um Pokémon dos favoritos
function alternarFavorito(id) {
  const favoritos = lerFavoritos();
  const posicao = favoritos.indexOf(id);

  if (posicao === -1) {
    favoritos.push(id);
  } else {
    favoritos.splice(posicao, 1);
  }

  salvarFavoritos(favoritos);
  atualizarContadorFavoritos();

  return posicao === -1;
}

function atualizarContadorFavoritos() {
  els.contadorFavoritos.textContent = lerFavoritos().length;
}


// 3. FILTROS DOS POKÉMON

function normalizar(texto) {
  return texto.trim().toLowerCase();
}

// Filtra por nome, número, geração, favoritos e tipo
function filtrarLista() {
  let lista = estado.todos;

  if (estado.busca) {
    const termo = normalizar(estado.busca);

    if (/^#?\d+$/.test(termo)) {
      const numero = Number(termo.replace("#", ""));
      lista = lista.filter((p) => p.id === numero);
    } else {
      lista = lista.filter((p) => p.nome.includes(termo));
    }
  }

  // Filtro por geração
  if (estado.geracao === "1") {
    lista = lista.filter((p) => p.id <= ULTIMO_ID_GERACAO_1);
  } else if (estado.geracao === "2") {
    lista = lista.filter((p) => p.id > ULTIMO_ID_GERACAO_1);
  }

  // Filtro de favoritos
  if (estado.soFavoritos) {
    const favoritos = lerFavoritos();
    lista = lista.filter((p) => favoritos.includes(p.id));
  }

  // Filtro por tipo, consultando a PokéAPI
  if (estado.tipo) {
    return obterIdsDoTipo(estado.tipo).then((ids) => {
      return lista.filter((p) => ids.includes(p.id));
    });
  }

  return Promise.resolve(lista);
}


// 4. CRIAÇÃO DOS CARDS

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarNumero(numero) {
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

// Cria uma linha com o nome e o valor de uma informação
function criarLinhaInfo(rotulo, conteudo) {
  const li = document.createElement("li");

  const spanRotulo = document.createElement("span");
  spanRotulo.className = "rotulo";
  spanRotulo.textContent = rotulo;

  const spanValor = document.createElement("span");
  spanValor.className = "valor";

  if (typeof conteudo === "string") {
    spanValor.textContent = conteudo;
  } else {
    spanValor.appendChild(conteudo);
  }

  li.appendChild(spanRotulo);
  li.appendChild(spanValor);

  return li;
}

// Cria as etiquetas coloridas dos tipos
function criarEtiquetasDeTipo(tipos) {
  const caixa = document.createElement("span");
  caixa.className = "tipos";

  tipos.forEach((tipo) => {
    const info = TIPOS[tipo] || {
      nome: capitalizar(tipo),
      cor: "#14213d"
    };

    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta-tipo";
    etiqueta.textContent = info.nome;

    etiqueta.style.setProperty("--cor-tipo", info.cor);

    if (info.textoEscuro) {
      etiqueta.style.setProperty("--texto-etiqueta", "#14213d");
    }

    caixa.appendChild(etiqueta);
  });

  return caixa;
}

// Cria o botão para favoritar um Pokémon
function criarBotaoFavorito(pokemon) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-fav";

  function pintar(ativo) {
    botao.textContent = ativo ? "♥" : "♡";
    botao.setAttribute("aria-pressed", String(ativo));

    botao.setAttribute(
      "aria-label",
      `${ativo ? "Remover" : "Adicionar"} ${capitalizar(pokemon.nome)} ${ativo ? "dos" : "aos"} favoritos`
    );
  }

  pintar(lerFavoritos().includes(pokemon.id));

  botao.addEventListener("click", () => {
    const ativo = alternarFavorito(pokemon.id);
    pintar(ativo);

    if (estado.soFavoritos && !ativo) {
      atualizar();
    }
  });

  return botao;
}

// Monta um card com as informações recebidas da API
function criarCard(pokemon) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = pokemon.id;

  const tipoPrincipal = TIPOS[pokemon.tipos[0]];

  if (tipoPrincipal) {
    card.style.setProperty("--cor-tipo", tipoPrincipal.cor);
  }

  // Nome e botão de favorito
  const topo = document.createElement("div");
  topo.className = "card-topo";

  const nome = document.createElement("h2");
  nome.className = "card-nome";
  nome.textContent = capitalizar(pokemon.nome);

  topo.appendChild(nome);
  topo.appendChild(criarBotaoFavorito(pokemon));

  // Imagem do Pokémon
  const figura = document.createElement("figure");
  figura.className = "card-figura";

  const imagem = document.createElement("img");
  imagem.src = pokemon.imagem;
  imagem.alt = `Ilustração oficial de ${capitalizar(pokemon.nome)}`;
  imagem.loading = "lazy";
  imagem.width = 475;
  imagem.height = 475;

  figura.appendChild(imagem);

  // Informações do Pokémon
  const lista = document.createElement("ul");
  lista.className = "card-info";

  lista.appendChild(
    criarLinhaInfo("Nº", `#${String(pokemon.id).padStart(3, "0")}`)
  );

  lista.appendChild(
    criarLinhaInfo("Tipo", criarEtiquetasDeTipo(pokemon.tipos))
  );

  lista.appendChild(
    criarLinhaInfo("Altura", `${formatarNumero(pokemon.altura)} m`)
  );

  lista.appendChild(
    criarLinhaInfo("Peso", `${formatarNumero(pokemon.peso)} kg`)
  );

  lista.appendChild(
    criarLinhaInfo("HP / Ataque", `${pokemon.hp} / ${pokemon.ataque}`)
  );

  lista.appendChild(
    criarLinhaInfo(
      "Habilidades",
      pokemon.habilidades
        .map((h) => capitalizar(h.replace("-", " ")))
        .join(", ")
    )
  );

  // Adiciona todas as partes ao card
  card.appendChild(topo);
  card.appendChild(figura);
  card.appendChild(lista);

  return card;
}

// Limpa a grade e adiciona os cards criados pelo JavaScript
function renderizarCards(lista) {
  els.grade.innerHTML = "";

  lista.forEach((pokemon) => {
    const card = criarCard(pokemon);
    els.grade.appendChild(card);
  });

  els.grade.setAttribute("aria-busy", "false");
}


// 5. MENSAGENS DO SITE

// Cria mensagens de carregamento, erro ou nenhum resultado
function criarEstado(texto, comSpinner, botaoTexto, aoClicar) {
  const caixa = document.createElement("div");
  caixa.className = "estado";

  if (comSpinner) {
    const spinner = document.createElement("div");
    spinner.className = "girando";
    spinner.setAttribute("aria-hidden", "true");
    caixa.appendChild(spinner);
  }

  const p = document.createElement("p");
  p.textContent = texto;
  caixa.appendChild(p);

  if (botaoTexto) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn btn-amarelo";
    botao.textContent = botaoTexto;
    botao.addEventListener("click", aoClicar);
    caixa.appendChild(botao);
  }

  return caixa;
}

function mostrarCarregando() {
  els.grade.setAttribute("aria-busy", "true");

  els.grade.replaceChildren(
    criarEstado("Buscando Pokémon na PokéAPI…", true)
  );
}

function mostrarVazio() {
  els.grade.setAttribute("aria-busy", "false");

  const mensagem = estado.soFavoritos
    ? "Você ainda não favoritou nenhum Pokémon com esses filtros. Toque no coração de um card para favoritar."
    : "Nenhum Pokémon encontrado. Tente outro nome ou limpe os filtros.";

  els.grade.replaceChildren(
    criarEstado(mensagem, false, "Limpar filtros", limparFiltros)
  );
}

function mostrarErro(erro) {
  console.error("Falha ao consumir a PokéAPI:", erro);

  els.grade.setAttribute("aria-busy", "false");
  els.resumo.textContent = "";

  els.grade.replaceChildren(
    criarEstado(
      "Não foi possível carregar os dados da PokéAPI. Verifique sua conexão e tente novamente.",
      false,
      "Tentar novamente",
      iniciar
    )
  );
}


// 6. ATUALIZAÇÃO E PAGINAÇÃO

function atualizarPaginacao(totalPaginas) {
  els.indicador.textContent = `Página ${estado.pagina} de ${totalPaginas}`;

  els.btnAnterior.disabled = estado.pagina <= 1;
  els.btnProxima.disabled = estado.pagina >= totalPaginas;
}

// Atualiza os cards conforme os filtros e a página selecionada
function atualizar() {
  const requisicao = ++contadorRequisicao;

  mostrarCarregando();

  return filtrarLista()
    .then((lista) => {
      const totalPaginas = Math.max(
        1,
        Math.ceil(lista.length / POR_PAGINA)
      );

      if (estado.pagina > totalPaginas) {
        estado.pagina = totalPaginas;
      }

      // Seleciona os 12 Pokémon da página atual
      const inicio = (estado.pagina - 1) * POR_PAGINA;
      const fatia = lista.slice(inicio, inicio + POR_PAGINA);

      if (fatia.length === 0) {
        return {
          lista,
          totalPaginas,
          detalhes: []
        };
      }

      // Busca os detalhes dos Pokémon ao mesmo tempo
      return Promise.all(
        fatia.map((p) => obterDetalhes(p.id))
      ).then((detalhes) => ({
        lista,
        totalPaginas,
        detalhes
      }));
    })
    .then(({ lista, totalPaginas, detalhes }) => {
      if (requisicao !== contadorRequisicao) {
        return;
      }

      atualizarPaginacao(totalPaginas);

      if (detalhes.length === 0) {
        els.resumo.textContent = "0 Pokémon encontrados.";
        mostrarVazio();
        return;
      }

      els.resumo.textContent =
        `Mostrando ${detalhes.length} de ${lista.length} Pokémon (de ${estado.todos.length} no total) — dados ao vivo da PokéAPI.`;

      renderizarCards(detalhes);
    })
    .catch((erro) => {
      if (requisicao !== contadorRequisicao) {
        return;
      }

      mostrarErro(erro);
    });
}

// Volta a tela para a lista após mudar de página
function irParaTopoDaLista() {
  els.grade.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// Limpa todos os filtros
function limparFiltros() {
  estado.busca = "";
  estado.geracao = "";
  estado.tipo = "";
  estado.soFavoritos = false;
  estado.pagina = 1;

  els.busca.value = "";
  els.geracao.value = "";
  els.tipo.value = "";

  els.btnFavoritos.setAttribute("aria-pressed", "false");

  atualizar();
}


// 7. EVENTOS DOS BOTÕES E FILTROS

// Adiciona as opções de tipo ao campo de seleção
function preencherOpcoesDeTipo() {
  Object.entries(TIPOS).forEach(([chave, info]) => {
    const opcao = document.createElement("option");

    opcao.value = chave;
    opcao.textContent = info.nome;

    els.tipo.appendChild(opcao);
  });
}

// Configura os eventos dos campos e botões
function configurarEventos() {
  els.form.addEventListener("submit", (evento) => {
    evento.preventDefault();
  });

  // Pesquisa por nome ou número
  let temporizador;

  els.busca.addEventListener("input", () => {
    clearTimeout(temporizador);

    temporizador = setTimeout(() => {
      estado.busca = els.busca.value;
      estado.pagina = 1;
      atualizar();
    }, 300);
  });

  // Filtro de geração
  els.geracao.addEventListener("change", () => {
    estado.geracao = els.geracao.value;
    estado.pagina = 1;
    atualizar();
  });

  // Filtro de tipo
  els.tipo.addEventListener("change", () => {
    estado.tipo = els.tipo.value;
    estado.pagina = 1;
    atualizar();
  });

  // Botão de favoritos
  els.btnFavoritos.addEventListener("click", () => {
    estado.soFavoritos = !estado.soFavoritos;

    els.btnFavoritos.setAttribute(
      "aria-pressed",
      String(estado.soFavoritos)
    );

    estado.pagina = 1;
    atualizar();
  });

  // Limpar filtros
  els.btnLimpar.addEventListener("click", limparFiltros);

  // Página anterior
  els.btnAnterior.addEventListener("click", () => {
    if (!els.btnAnterior.disabled) {
      estado.pagina -= 1;
      atualizar().then(irParaTopoDaLista);
    }
  });

  // Próxima página
  els.btnProxima.addEventListener("click", () => {
    if (!els.btnProxima.disabled) {
      estado.pagina += 1;
      atualizar().then(irParaTopoDaLista);
    }
  });
}


// 8. INÍCIO DO SITE

// Carrega a lista e prepara os filtros e botões
function iniciar() {
  mostrarCarregando();

  carregarLista()
    .then((lista) => {
      estado.todos = lista;

      if (!eventosConfigurados) {
        preencherOpcoesDeTipo();
        configurarEventos();
        eventosConfigurados = true;
      }

      atualizarContadorFavoritos();

      return atualizar();
    })
    .catch(mostrarErro);
}

// Inicia a Pokédex
iniciar();
