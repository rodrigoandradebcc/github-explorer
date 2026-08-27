# GitHub Explorer

> Aplicativo React Native para buscar repositórios, visualizar detalhes e listar issues abertas no GitHub **ou GitLab, com troca de fonte em tempo de execução** — desenvolvido como avaliação técnica com foco em arquitetura de componentes, gerenciamento de estado servidor e disciplina de design system.

![Expo SDK](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/testes-184%20passando-brightgreen?logo=jest&logoColor=white)

---

## Requisitos atendidos

| Requisito | Status | Detalhes |
| --- | --- | --- |
| App Expo + TypeScript funcional | ✅ | Expo SDK 54, TypeScript `strict` + `noUncheckedIndexedAccess` |
| App inicia sem erros | ✅ | Testado em iOS Simulator, Android Emulator e Expo Go |
| Busca de repositórios com paginação | ✅ | Scroll infinito via TanStack Query `useInfiniteQuery` + `onEndReached` |
| Toque abre detalhes do repositório | ✅ | Navegação Expo Router para `/repository/:owner/:repo` |
| Design System mínimo e tipado | ✅ | Tokens tipados (colors, spacing, radius, sizes) + 10 componentes base |
| Showcase exibe todos os componentes | ✅ | Tela `/showcase` lista Avatar, Badge, Box, Button, Card, Heading, Input, Skeleton, Switch, Text com variações |
| Integração com API do GitHub | ✅ | Ports de domínio e adapters tipados em `src/infrastructure/github` |
| Troca de fonte de dados em tempo de execução (GitHub/GitLab) | ✅ | Registry no composition root + repositórios roteados por fonte; toggle no header da busca; preferência persistida |
| Cache controlado via biblioteca | ✅ | TanStack Query v5: staleTime por rota, paginação infinita e retry inteligente |
| Commits pequenos e descritivos | ✅ | Convenção Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`) |
| README com instalação e arquitetura | ✅ | Seções abaixo |

---

## Demonstração

**[Ver demo ao vivo (Android & iOS)](https://jam.dev/c/5283ff5e-7183-43a1-abf2-cb98687b0d6f)**

---

## Funcionalidades

- **Fonte de dados alternável** — GitHub ou GitLab via controle segmentado no header da busca; troca sem reiniciar, cache isolado por fonte e preferência persistida
- **Busca de repositórios** com input com debounce e scroll infinito
- **Detalhe do repositório** — avatar do dono, descrição, estrelas, forks, linguagem principal e watchers (campos que a fonte não fornece são omitidos, sem `if` por fonte na tela)
- **Lista de issues abertas** — labels (com cor quando a fonte fornece), autor, data relativa (locale pt-BR) e número da issue
- **Modo escuro / claro** com preferência persistida (AsyncStorage)
- **Animações de entrada escalonadas** via React Native Reanimated
- **Controle de rate limit** — cada fonte traduz sua falha para o `kind` `rateLimit` do domínio (GitHub: 403 e 429; GitLab: 429) e a UI exibe mensagem útil em vez de tentar novamente indefinidamente
- **Showcase do design system** — demonstração ao vivo de todos os tokens e componentes em `/showcase`

---

## Tecnologias

| Tecnologia                                             | Função                                                                                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Expo SDK 54 + Expo Router v6**                       | Roteamento baseado em arquivos, suporte a deep links e configuração de build gerenciada — o código foca no produto, não na infraestrutura |
| **React Native 0.81 / React 19**                       | Alvo mobile multiplataforma com New Architecture (Fabric + TurboModules) habilitada                                                       |
| **TanStack Query v5**                                  | Cache de estado servidor com stale-while-revalidate, paginação infinita e controle de retentativas                                        |
| **React Native Reanimated 4**                          | Animações na thread nativa: entradas escalonadas nas listas e feedback de pressão nos cards                                               |
| **Axios**                                              | Cliente HTTP; um client por fonte, com interceptors centralizando autenticação e a tradução para `DataAccessError`                        |
| **date-fns**                                           | Utilitários de data leves e tree-shakable com locale pt-BR para timestamps relativos                                                      |
| **TypeScript — `strict` + `noUncheckedIndexedAccess`** | Segurança máxima de tipos; captura bugs de acesso a array em tempo de compilação                                                          |
| **Jest + jest-expo + Testing Library**                 | Testes unitários e de componentes que rodam sem dispositivo ou simulador                                                                  |

---

## Como executar

### Pré-requisitos

| Ferramenta | Versão mínima | Observação |
| --- | --- | --- |
| Node.js | 20+ | Recomendado via [nvm](https://github.com/nvm-sh/nvm) |
| npm | 10+ | Incluído no Node.js 20 |
| Xcode | 15+ | Apenas para iOS Simulator (macOS) |
| Android Studio | Hedgehog+ | Apenas para Android Emulator |
| Expo Go | atual | Alternativa sem emulador — instale no dispositivo físico |

Não é necessário instalar Expo CLI globalmente; todos os comandos usam `npx`.

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/rodrigoandradebcc/github-explorer.git
cd github-explorer

# 2. Instale as dependências
npm install
```

### Variáveis de ambiente (opcional)

Sem um token, a API do GitHub limita requisições não autenticadas a **60/hora**. Para desenvolvimento confortável, adicione um Personal Access Token:

```bash
cp .env.example .env
# abra o .env e preencha o token
```

```env
EXPO_PUBLIC_GITHUB_TOKEN=ghp_seu_token_aqui
EXPO_PUBLIC_GITLAB_TOKEN=glpat_seu_token_aqui
```

> [!NOTE]
> O prefixo `EXPO_PUBLIC_` é exigido pelo Expo SDK 49+ para expor variáveis ao código do app. O arquivo `.env` já está no `.gitignore`.

Com um token o limite sobe para **5.000 requisições/hora**. O token precisa apenas da permissão padrão de leitura pública (sem escopos adicionais). Crie um em **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**.

O GitLab aplica rate limit por IP para requisições não autenticadas; um Personal Access Token com escopo `read_api` é opcional e apenas eleva esse limite. Ambos os tokens são opcionais — sem eles o app funciona normalmente, apenas com limites menores.

### Execução

```bash
npx expo start           # abre o Expo CLI — pressione i (iOS), a (Android), w (web)
npx expo start --ios     # inicia o iOS Simulator diretamente
npx expo start --android # inicia o Android Emulator diretamente
```

Ao usar **Expo Go** no celular, escaneie o QR Code exibido no terminal com a câmera (iOS) ou pelo próprio app Expo Go (Android).

---

## Scripts

| Comando              | Descrição                                        |
| -------------------- | ------------------------------------------------ |
| `npm run verify`     | `type-check` + `lint` + `test` — o que roda antes de abrir PR |
| `npm test`           | Executa o Jest uma vez (sem modo watch)          |
| `npm run lint`       | ESLint em todos os arquivos fonte                |
| `npm run type-check` | `tsc --noEmit` — apenas erros de tipo, sem saída |
| `npm run format`     | Formatação com Prettier                          |

---

## Estrutura do projeto

```
src/
├── app/                        # Rotas do Expo Router (apenas wrappers — sem lógica de negócio)
│   ├── _layout.tsx             # Layout raiz: providers de apresentação + ThemeProvider + Stack
│   ├── index.tsx               # / → SearchScreen
│   ├── showcase.tsx            # /showcase → Showcase do Design System
│   └── repository/[owner]/[repo]/
│       ├── index.tsx           # /repository/:owner/:repo → RepositoryDetailScreen
│       └── issues.tsx          # /repository/:owner/:repo/issues → IssuesScreen
│
├── domain/                     # Núcleo sem dependências externas
│   ├── entities/               # Repo, RepoDetails, Issue, IssueLabel, Owner, issueRules
│   ├── errors/                 # DataAccessError e o guard isRateLimitError
│   ├── repositories/           # Interfaces dos repositórios (ports)
│   └── shared/                 # Page<T>, RequestOptions, DataSource (ids),
│                               #   DataSourceSelection, DataSourcePreferenceStorage
│
├── application/                # Use cases e services independentes de frameworks
│   ├── repositories/           # SearchRepos, GetRepoDetails e RepoService
│   └── issues/                 # ListRepoIssues e IssueService
│
├── infrastructure/             # Adapters concretos e configuração de bibliotecas
│   ├── di/                     # Composition root manual + DataSourceRegistry
│   │   ├── container.ts                     # Monta os dois stacks e expõe os services
│   │   ├── DataSourceRegistry.ts            # Record<DataSourceId, { repos, issues }>
│   │   └── SourceRouted*Repository.ts       # Ports de domínio que resolvem a fonte ativa
│   ├── query/                  # Factory e defaults do QueryClient
│   ├── storage/                # Persistência de tema e de fonte de dados (AsyncStorage)
│   ├── github/
│   │   ├── AxiosGitHub*DataSource.ts  # Transporte HTTP e DTOs crus
│   │   ├── GitHub*DataSource.ts       # Ports internas das datasources
│   │   ├── GitHub*Repository.ts       # Mapeamento e paginação
│   │   ├── client.ts                  # Axios, interceptors e tradução para DataAccessError
│   │   ├── constants.ts               # Tamanho de página da API
│   │   ├── dtos.ts                    # Formatos snake_case do GitHub
│   │   └── mappers.ts                 # DTO → entidade de domínio
│   └── gitlab/                 # Espelho de github/ para a API do GitLab
│       ├── AxiosGitLab*DataSource.ts  # Transporte HTTP e DTOs crus
│       ├── GitLab*DataSource.ts       # Ports internas das datasources
│       ├── GitLab*Repository.ts       # Mapeamento e paginação
│       ├── client.ts                  # Axios, interceptors (429 → rateLimit)
│       ├── constants.ts               # Tamanho de página e base web
│       ├── dtos.ts                    # Formatos do GitLab, incluindo GitLabPageDto
│       ├── pageHeaders.ts             # Lê x-total / x-next-page da resposta
│       └── mappers.ts                 # DTO → entidade de domínio
│
├── presentation/               # UI e integração com frameworks de apresentação
│   ├── repositories/
│   │   ├── components/         # RepositoryCard, SearchContent, RepositoryDetailContent…
│   │   ├── hooks/              # useSearchRepos, useRepoDetails
│   │   └── screens/            # SearchScreen, RepositoryDetailScreen (+ __tests__)
│   ├── issues/
│   │   ├── components/         # IssueCard, IssueSkeleton, IssuesEmptyState
│   │   ├── hooks/              # useRepoIssues
│   │   ├── screens/            # IssuesScreen (+ __tests__)
│   │   └── utils/              # labelColorToTone
│   ├── shared/
│   │   ├── components/         # DataAccessErrorState, DataSourceToggle
│   │   ├── navigation/         # getStackScreenOptions
│   │   ├── hooks/              # useDebounce
│   │   ├── queryKeys.ts        # Chaves escopadas por fonte de dados
│   │   └── formatCount.ts
│   ├── di/                     # ApplicationProvider, QueryProvider, DataSourceProvider
│   └── __test-utils__/         # renderWithProviders
│
├── design-system/              # Biblioteca de componentes fechada (index.ts é a única superfície pública)
│   ├── tokens/                 # colors, spacing, radius, sizes
│   ├── theme/                  # ThemeProvider + useTheme + porta de persistência
│   └── components/             # Avatar, Badge, Box, Button, Card, Heading,
│                               #   Input, Skeleton, Switch, Text
```

---

## Decisões arquiteturais

As regras que qualquer módulo novo precisa seguir — camadas, dependências permitidas, convenções de
nome, padrão de teste por camada e checklist de criação — estão em
[docs/ARCHITECTURE-RULES.md](docs/ARCHITECTURE-RULES.md). Os arquivos `AGENTS.md`,
`.claude/rules/`, `.cursor/rules/` e `.github/copilot-instructions.md` são ponteiros para ele.

Essas fronteiras não dependem de disciplina em revisão: `eslint.config.js` declara um bloco de
`no-restricted-imports` por camada, e a mensagem de erro cita a seção violada. Um import de camada
proibida quebra `npm run lint` no momento em que é digitado
([ADR-010](docs/decisions/010-enforce-layer-boundaries-in-lint.md)).

Os cinco princípios obrigatórios têm uma seção cada:

| Princípio | Seção | Como é garantido |
| --- | --- | --- |
| Inversão de Dependência | [↓](#inversão-de-dependência) | ports em `domain/`, `implements` na infraestrutura, `new` só no container |
| Interfaces antes de implementações | [↓](#interfaces-antes-de-implementações) | 8 contratos em arquivo próprio, 12 implementações, `implements` explícito |
| Domínio isolado | [↓](#domínio-isolado) | `no-restricted-imports` bloqueia toda camada e todo framework em `src/domain` |
| Camada de application separada | [↓](#camada-de-application-separada) | única dependência permitida é `domain/`, verificada no lint |
| Apresentação desacoplada | [↓](#apresentação-desacoplada) | zero import de infraestrutura, Axios ou AsyncStorage; injeção só em `app/_layout.tsx` |

### Inversão de Dependência

Regra de negócio não depende de HTTP, de storage nem de biblioteca externa. As duas pontas dependem
da mesma abstração — e a abstração pertence à camada de dentro.

| Peça | Onde | Papel |
| --- | --- | --- |
| `RepoRepository` | `domain/repositories/` | o contrato, escrito no vocabulário do domínio (`Page<Repo>`, nunca `AxiosResponse`) |
| `SearchReposUseCase` | `application/repositories/` | recebe o contrato por construtor; não sabe qual fonte existe do outro lado |
| `GitHubRepoRepository` | `infrastructure/github/` | `implements RepoRepository` |
| `container.ts` | `infrastructure/di/` | único arquivo do projeto que instancia classe concreta |

```
SearchReposUseCase ──depende de──▶  RepoRepository  ◀──implements──  GitHubRepoRepository
     (application)                     (domain)                       (infrastructure)
```

As duas setas de compilação chegam no mesmo ponto: o contrato do domínio. Nenhuma sai dele. O
sentido oposto — o use case alcançando o adapter — existe apenas em tempo de execução, montado pelo
composition root.

A inversão se repete dentro da infraestrutura: `GitHubRepoRepository` depende de
`GitHubRepoDataSource`, não de Axios. Trocar o cliente HTTP altera uma classe por provedor, e testar
a regra de paginação não exige rede.

O retorno aparece em dois lugares concretos. `SearchReposUseCase` é testado com um objeto literal que
implementa o port — sem `jest.mock`, sem servidor, sem simulador. E `SourceRoutedRepoRepository`, que
implementa o mesmo contrato e resolve a fonte ativa a cada chamada, permitiu acrescentar o GitLab sem
alterar uma linha de `domain/` ou `application/`. Veja o
[ADR-001](docs/decisions/001-isolate-domain-from-github-api.md) e o
[ADR-002](docs/decisions/002-application-layer-use-cases.md).

### Interfaces antes de implementações

Repositórios, datasources e serviços externos são declarados como interface em um arquivo e
implementados em outro. São oito contratos e doze implementações, todas com `implements` explícito —
quem verifica a relação é o compilador, não a convenção.

| Contrato | Onde | Implementações |
| --- | --- | --- |
| `RepoRepository` | `domain/repositories/` | `GitHubRepoRepository`, `GitLabRepoRepository`, `SourceRoutedRepoRepository` |
| `IssueRepository` | `domain/repositories/` | `GitHubIssueRepository`, `GitLabIssueRepository`, `SourceRoutedIssueRepository` |
| `GitHubRepoDataSource`, `GitHubIssueDataSource` | `infrastructure/github/` | `AxiosGitHubRepoDataSource`, `AxiosGitHubIssueDataSource` |
| `GitLabRepoDataSource`, `GitLabIssueDataSource` | `infrastructure/gitlab/` | `AxiosGitLabRepoDataSource`, `AxiosGitLabIssueDataSource` |
| `DataSourcePreferenceStorage` | `domain/shared/` | `AsyncStorageDataSourcePreference` |
| `ThemePreferenceStorage` | `design-system/theme/` | `AsyncStorageThemePreference` |

O nome diz qual arquivo é qual: o contrato é o nome nu, a implementação leva a tecnologia como
prefixo — `AxiosGitHubRepoDataSource` implementa `GitHubRepoDataSource`. Dá para distinguir os dois
sem abrir nenhum.

Existem **dois níveis de contrato, com vocabulários deliberadamente diferentes**:

- **Port de domínio** — `search(query, page): Promise<Page<Repo>>`. Fala entidade.
- **Port de datasource** — `searchProjects(query, page): Promise<GitLabPageDto<GitLabProjectDto>>`.
  Fala o dialeto do provedor: o GitLab chama de *project*, e aqui pode.

Por isso são dois e não um. Com um contrato só, ou o domínio engoliria o DTO, ou o datasource teria
de mapear — e mapear é trabalho do `mappers.ts`, onde o vocabulário externo morre. Também vale um
port por módulo, nunca um compartilhado: o repositório de issues não depende de métodos de busca que
jamais chama.

A entidade se chama `Repo`, e não `Repository`, porque o sufixo `Repository` já pertence ao padrão de
port — ver [ADR-008](docs/decisions/008-name-the-repository-entity-repo.md).

### Domínio isolado

Entidades e interfaces de repositório ficam em `src/domain` e não importam Axios, React, Expo,
TanStack Query ou qualquer outra dependência externa. Os formatos retornados pelo GitHub permanecem
em `src/infrastructure/github/dtos.ts`, os do GitLab em `src/infrastructure/gitlab/dtos.ts`, e
ambos são convertidos para as mesmas entidades por mappers na borda da aplicação. Datasources Axios cuidam somente de path, parâmetros e DTOs crus; os adapters de
repository fazem mapeamento e paginação, enquanto o use case de issues mantém o filtro e a
repaginação de pull requests — limitada a cinco páginas por chamada, devolvendo `nextPage` para que
continuar a busca seja uma escolha de quem está na tela e não um gasto silencioso de rate limit
([ADR-009](docs/decisions/009-bound-the-issue-page-scan.md)). Assim, particularidades da API não vazam para telas e componentes.
Veja o [ADR-001](docs/decisions/001-isolate-domain-from-github-api.md).

### Camada de application separada

Use cases representam uma operação do sistema e concentram validação e orquestração do domínio por
meio das interfaces de repositório. Services são fachadas finas que agrupam os use cases de cada
agregado e oferecem uma superfície estável para os hooks. Apenas o composition root em
`infrastructure/di/container.ts` conhece os adapters concretos: ele injeta as implementações nos use
cases e monta os services sem uma biblioteca de DI. Assim, React Query continua responsável por
cache e estado assíncrono, mas não carrega regras de negócio nem conhece infraestrutura. Veja o
[ADR-002](docs/decisions/002-application-layer-use-cases.md).

### Apresentação desacoplada

`src/presentation/` não importa `@/infrastructure`, Axios nem AsyncStorage. Nenhuma vez — e a regra
de lint que garante isso não tem exceção.

Telas consomem hooks, hooks resolvem o service pelo contexto. A cadeia da busca é
`app/index.tsx` (duas linhas, só reexporta) → `SearchScreen` → `useSearchRepos` → `RepoService`
injetado → port de domínio. A tela não conhece service, o hook não conhece adapter, e nenhum dos dois
sabe que existe GitHub.

O caso do storage mostra a distância: `DataSourceToggle` chama `setSource(id)` do contexto; o
`DataSourceProvider` persiste através de `DataSourcePreferenceStorage` — uma interface, cujo valor
padrão é uma implementação no-op; o adapter real de AsyncStorage entra em `app/_layout.tsx`. Três
abstrações entre o toque e o `setItem`, e trocar por MMKV altera uma linha do layout.

Toda a montagem vive nesse único arquivo. Os providers não têm implementação padrão: `services`,
`selection` e `createClient` são props obrigatórias, e pedir um service que ninguém injetou lança um
erro nomeado em vez de cair no container de produção — o que antes fazia um teste distraído bater na
rede de verdade, em silêncio. Veja o
[ADR-010](docs/decisions/010-enforce-layer-boundaries-in-lint.md).

### Camadas na raiz e organização por feature

As fronteiras arquiteturais ficam explícitas na raiz de `src/`: `domain/`, `application/`,
`infrastructure/`, `presentation/`, `design-system/` e `app/`. Dentro de `presentation/`, o código
continua agrupado por feature (`repositories`, `issues`) em vez de ser achatado em pastas globais
como `screens/`, `hooks/` e `components/`. Tudo que pertence a uma feature permanece co-localizado;
adicionar uma nova feature significa criar uma pasta sem alterar as existentes.

```
src/presentation/
├── repositories/     # busca, detalhe, componentes e hooks de repositório
├── issues/           # listagem, componentes e hooks de issues
├── shared/           # utilitários, componentes e navegação transversais à apresentação
└── di/               # providers de serviços, server state e fonte de dados
```

Os hooks resolvem `RepoService` e `IssueService` pelo `ApplicationProvider`, evitando imports de
singletons em tempo de módulo e permitindo injetar fakes em testes. A configuração do TanStack
Query também vive em `presentation/`, mantendo as rotas do Expo Router como wrappers finos. Veja o
[ADR-003](docs/decisions/003-presentation-layer-and-dependency-injection.md).

### Fronteiras de infraestrutura

Configuração do TanStack Query, montagem de dependências e persistência AsyncStorage ficam em
`infrastructure/`. O `QueryProvider` e o `ThemeProvider` permanecem responsáveis apenas pela
integração React; o design system define uma porta de persistência e funciona com implementação
no-op quando usado isoladamente. Navegação continua em `app/` e `presentation/`, pois rotas e
aparência de headers são responsabilidades de framework e apresentação. Veja o
[ADR-004](docs/decisions/004-infrastructure-boundaries.md).

### Contrato de erro no domínio

`domain/errors/DataAccessError.ts` declara a falha de acesso a dado com um `kind` — `rateLimit`,
`notFound`, `network`, `cancelled` ou `unknown` — e os guards `isRateLimitError` e
`isCancelledError`. A infraestrutura traduz o status
HTTP para esse vocabulário no interceptor, de modo que códigos 403, 404 e 429 não existem fora de
`infrastructure/github`. Telas e query client dependem do guard de domínio, e renomear um `kind`
passa a quebrar no `type-check`. Uma requisição abortada pelo próprio app também cruza a fronteira
nesse vocabulário — `cancelled` — em vez de vazar o `CanceledError` do Axios ou se disfarçar de falha
de rede. Veja o [ADR-005](docs/decisions/005-domain-owned-error-contract.md) e o
[ADR-007](docs/decisions/007-caller-driven-request-cancellation.md).

### Fontes de dados alternáveis em tempo de execução

O domínio declara o vocabulário de fonte em `domain/shared/`: os ids (`DataSourceId`), o observável
`DataSourceSelection` e a porta `DataSourcePreferenceStorage`. Cada provider tem sua própria pasta
de infraestrutura (`infrastructure/github` e `infrastructure/gitlab`) com client, DTOs, datasources
e adapters — as diferenças de campo, paginação e vocabulário morrem ali.

A troca é **uma única decisão em um único lugar**: o composition root monta os dois stacks em um
`DataSourceRegistry` e entrega à aplicação os adapters `SourceRouted*Repository`, que resolvem
`registry[fonteAtiva()]` a cada chamada. Use cases, services, hooks e telas não sabem que existe
uma segunda fonte, e o compilador acusa a entrada faltante quando um novo id é adicionado. O
`DataSourceProvider` expõe a seleção via `useSyncExternalStore` e persiste a preferência; as chaves
do TanStack Query carregam a fonte como escopo, então trocar dispara um fetch novo com os estados
de loading normais e mantém o cache da fonte anterior para a volta instantânea. Veja o
[ADR-006](docs/decisions/006-runtime-switchable-data-sources.md).

### Design System como módulo fechado

Todos os componentes vivem em `src/design-system/` e a **única** superfície pública é `src/design-system/index.ts`. Telas de funcionalidades não podem importar diretamente de caminhos internos do DS.

**Tokens disponíveis:**

| Token | Valores | Arquivo |
| --- | --- | --- |
| `colors` | paleta semântica clara/escura | `tokens/colors.ts` |
| `spacing` | escala 4px (`xs` → `xxxl`) | `tokens/spacing.ts` |
| `radius` | `sm`, `md`, `lg`, `full` | `tokens/radius.ts` |
| `sizes` | alturas fixas de componentes | `tokens/sizes.ts` |

**Componentes disponíveis:** `Avatar`, `Badge`, `Box`, `Button`, `Card`, `GlassView`, `Heading`, `Input`, `Skeleton`, `Switch`, `Text`

Todos leem tokens via `useTheme()` — zero valores hex fixos ou estilos inline fora do DS. A tela `/showcase` demonstra cada componente com suas variações ao vivo.

### Paginação infinita

`useSearchRepos` usa `useInfiniteQuery` do TanStack Query. O parâmetro `page` é gerenciado pela chave de query; `getNextPageParam` extrai o número da próxima página da resposta da API. O `FlatList` dispara `fetchNextPage` via `onEndReached` quando o usuário se aproxima do fim da lista. Skeletons de carregamento aparecem durante o fetch das páginas seguintes sem bloquear o scroll.

### Estratégia de cache com TanStack Query v5

| Query | `staleTime` | Justificativa |
| --- | --- | --- |
| Busca de repositórios | 5 min | Evita sobrecarregar a API a cada tecla com debounce; resultados mudam com pouca frequência |
| Detalhe do repositório | 1 min | Dados relativamente estáticos; TTL menor mantém contadores de estrelas/forks razoavelmente atualizados |
| Lista de issues | 5 min | Issues mudam em repos ativos, mas atualizações em tempo real não são um requisito |

`refetchOnWindowFocus` está desabilitado globalmente — apps mobile não têm um evento de "foco de janela" significativo e o comportamento padrão dispararia refetches desnecessários a cada transição de navegação.

### Tratamento de erros e rate limit

Cada client Axios normaliza os erros da sua fonte em `DataAccessError`, o contrato de domínio com o `kind` `rateLimit`, `notFound`, `network`, `cancelled` ou `unknown` — o GitHub mapeia 403 e 429 para `rateLimit`, o GitLab apenas 429 (no GitLab, 403 é falha de autorização). O guard `isRateLimitError` desabilita retentativas automáticas no `QueryClient` raiz e exibe um estado de erro dedicado em cada tela, sugerindo configurar um token no `.env`. Erros genéricos recebem um botão de nova tentativa que re-executa a query falha. Códigos HTTP não existem fora de `infrastructure/`.

---

## O que eu faria com mais tempo

- **Tela de detalhe de issue** — renderizar o corpo da issue (Markdown) e a thread de comentários.
- **Suporte offline** — persistir o cache do React Query no AsyncStorage via `@tanstack/query-async-storage-persister` para que dados já carregados fiquem disponíveis sem conexão.
- **Testes E2E** — testes com Detox ou Maestro cobrindo o fluxo busca → detalhe → issues em um simulador real, o que verificação de tipos e testes unitários não conseguem capturar.
- **Acessibilidade** — adicionar `accessibilityLabel` / `accessibilityHint` em todos os elementos interativos, auditar contraste de cores contra WCAG AA e testar com VoiceOver e TalkBack.
- **Expansão de tokens** — adicionar tokens de tipografia (família de fonte, altura de linha) e um token de motion para durações de animação consistentes em `Skeleton` e micro-interações.
- **Error boundaries** — envolver o `Stack` raiz em um error boundary React para capturar erros inesperados de runtime de forma elegante em vez de exibir uma tela em branco.
- **Pipeline de CI** — workflow no GitHub Actions executando `type-check`, `lint` e `test` em todo pull request antes do merge.
- **UX de paginação** — o scroll infinito atual é funcional, mas uma estratégia baseada em cursor com um botão visível de "carregar mais" seria mais confiável para repos com milhares de issues.
