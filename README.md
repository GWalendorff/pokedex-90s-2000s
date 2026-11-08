
# Pokédex-90s-2000s

Este projeto foi desenvolvido como parte de uma atividade acadêmica do curso de Análise e Desenvolvimento de Sistemas da UniFECAF.

A ideia foi criar uma Pokédex utilizando HTML, CSS e JavaScript, buscando as informações diretamente da [PokéAPI](https://pokeapi.co/).

O site apresenta os **251 Pokémon das duas primeiras gerações**, com imagens e informações de cada um.

## Tecnologias utilizadas

- HTML5 para a estrutura do site.
- CSS3 para o visual e a adaptação em diferentes telas.
- JavaScript para buscar os dados da API e criar os cards automaticamente.
- PokéAPI como fonte das informações dos Pokémon.

## Funcionalidades

- Visualização dos 251 Pokémon da 1ª e 2ª gerações.
- Pesquisa por nome ou número.
- Filtros por geração e tipo.
- Sistema de favoritos, que ficam salvos no navegador.
- Paginação com 12 Pokémon por página.
- Informações como tipo, altura, peso, HP, ataque e habilidades.
- Layout adaptado para computadores e celulares.

## Como funciona

Ao abrir o site, o JavaScript utiliza o `fetch()` para buscar os dados da PokéAPI.

Com as informações recebidas, os cards são criados automaticamente utilizando `createElement()` e `appendChild()`, sem precisar deixar os Pokémon cadastrados diretamente no HTML.

Também utilizei o `localStorage` para salvar os Pokémon favoritos no navegador.

## Estrutura do projeto

```
pokedex-api/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── README.md
```

## Como acessar

Para executar o projeto, basta abrir o arquivo `index.html` no navegador.

É necessário ter conexão com a internet para carregar as informações da PokéAPI.

## API utilizada

**PokéAPI:** https://pokeapi.co/

A API é pública e não exige cadastro ou token de acesso para as consultas utilizadas neste projeto.

---

**Projeto acadêmico — UniFECAF**

**Curso:** Análise e Desenvolvimento de Sistemas

**Desenvolvido por:** Gabriel Augusto Walendorff
