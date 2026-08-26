# GitHub Explorer

> Aplicativo React Native para buscar repositórios do GitHub, visualizar detalhes e listar issues abertas — desenvolvido como avaliação técnica com foco em arquitetura de componentes, gerenciamento de estado servidor e disciplina de design system.

![Expo SDK](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/testes-87%20passando-brightgreen?logo=jest&logoColor=white)

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
| Cache controlado via biblioteca | ✅ | TanStack Query v5: staleTime por rota, paginação infinita e retry inteligente |
| Commits pequenos e descritivos | ✅ | Convenção Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`) |
| README com instalação e arquitetura | ✅ | Seções abaixo |

---

## Demonstração

**[Ver demo ao vivo (Android & iOS)](https://jam.dev/c/5283ff5e-7183-43a1-abf2-cb98687b0d6f)**

---

## Funcionalidades

- **Busca de repositórios** com input com debounce e scroll infinito
- **Detalhe do repositório** — avatar do dono, descrição, estrelas, forks, watchers e linguagem principal
- **Lista de issues abertas** — labels com cores, autor, data relativa (locale pt-BR) e número da issue
- **Modo escuro / claro** com preferência persistida (AsyncStorage)
- **Animações de entrada escalonadas** via React Native Reanimated
- **Controle de rate limit** — detecta erros 403/429 do GitHub e exibe mensagem útil em vez de tentar novamente indefinidamente
- **Showcase do design system** — demonstração ao vivo de todos os tokens e componentes em `/showcase`

---

## Tecnologias

| Tecnologia                                             | Função                                                                                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Expo SDK 54 + Expo Router v6**                       | Roteamento baseado em arquivos, suporte a deep links e configuração de build gerenciada — o código foca no produto, não na infraestrutura |
| **React Native 0.81 / React 19**                       | Alvo mobile multiplataforma com New Architecture (Fabric + TurboModules) habilitada                                                       |
| **TanStack Query v5**                                  | Cache de estado servidor com stale-while-revalidate, paginação infinita e controle de retentativas                                        |
| **React Native Reanimated 4**                          | Animações na thread nativa: entradas escalonadas nas listas e feedback de pressão nos cards                                               |
| **Axios**                                              | Cliente HTTP; interceptors centralizam autenticação e normalização de erros (`ApiError`)                                                  |
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
```

> [!NOTE]
> O prefixo `EXPO_PUBLIC_` é exigido pelo Expo SDK 49+ para expor variáveis ao código do app. O arquivo `.env` já está no `.gitignore`.

Com um token o limite sobe para **5.000 requisições/hora**. O token precisa apenas da permissão padrão de leitura pública (sem escopos adicionais). Crie um em **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**.

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
│   ├── entities/               # Repository, Issue e Owner
│   ├── repositories/           # Interfaces dos repositórios (ports)
│   └── shared/                 # Contratos compartilhados, como Page<T>
│
├── application/                # Use cases e services independentes de frameworks
│   ├── repositories/           # SearchRepos, GetRepoDetails e RepoService
│   └── issues/                 # ListRepoIssues e IssueService
│
├── infrastructure/             # Adapters concretos e configuração de bibliotecas
│   ├── di/                     # Composition root manual
│   ├── query/                  # Factory e defaults do QueryClient
│   ├── storage/                # Persistência de tema com AsyncStorage
│   └── github/
│       ├── AxiosGitHub*DataSource.ts  # Transporte HTTP e DTOs crus
│       ├── GitHub*DataSource.ts       # Ports internas das datasources
│       ├── GitHub*Repository.ts       # Mapeamento e paginação
│       ├── client.ts                  # Axios, interceptors e ApiError
│       ├── constants.ts               # Tamanho de página da API
│       ├── dtos.ts                    # Formatos snake_case do GitHub
│       └── mappers.ts                 # DTO → entidade de domínio
│
├── presentation/               # UI e integração com frameworks de apresentação
│   ├── repositories/
│   │   ├── components/         # RepositoryCard, RepositoryCardSkeleton
│   │   ├── hooks/              # useSearchRepos, useRepoDetails
│   │   └── screens/            # SearchScreen, RepositoryDetailScreen (+ __tests__)
│   ├── issues/
│   │   ├── hooks/              # useRepoIssues
│   │   └── screens/            # IssuesScreen (+ __tests__)
│   ├── github/                 # Estados de erro e navegação compartilhados
│   ├── shared/                 # query keys, formatação e useDebounce
│   ├── di/                     # ApplicationProvider e QueryProvider
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
├── github/           # apresentação compartilhada para recursos do GitHub
├── shared/           # utilitários transversais exclusivos da apresentação
└── di/               # providers de serviços e server state
```

Os hooks resolvem `RepoService` e `IssueService` pelo `ApplicationProvider`, evitando imports de
singletons em tempo de módulo e permitindo injetar fakes em testes. A configuração do TanStack
Query também vive em `presentation/`, mantendo as rotas do Expo Router como wrappers finos. Veja o
[ADR-003](docs/decisions/003-presentation-layer-and-dependency-injection.md).

### Domínio independente da API

Entidades e interfaces de repositório ficam em `src/domain` e não importam Axios, React, Expo,
TanStack Query ou qualquer outra dependência externa. Os formatos retornados pelo GitHub permanecem
em `src/infrastructure/github/dtos.ts` e são convertidos para entidades por mappers na borda da
aplicação. Datasources Axios cuidam somente de path, parâmetros e DTOs crus; os adapters de
repository fazem mapeamento e paginação, enquanto o use case de issues mantém o filtro e a
repaginação de pull requests. Assim, particularidades da API não vazam para telas e componentes.
Veja o [ADR-001](docs/decisions/001-isolate-domain-from-github-api.md).

### Use cases e services de aplicação

Use cases representam uma operação do sistema e concentram validação e orquestração do domínio por
meio das interfaces de repositório. Services são fachadas finas que agrupam os use cases de cada
agregado e oferecem uma superfície estável para os hooks. Apenas o composition root em
`infrastructure/di/container.ts` conhece os adapters concretos: ele injeta as implementações nos use
cases e monta os services sem uma biblioteca de DI. Assim, React Query continua responsável por
cache e estado assíncrono, mas não carrega regras de negócio nem conhece infraestrutura. Veja o
[ADR-002](docs/decisions/002-application-layer-use-cases.md).

### Fronteiras de infraestrutura

Configuração do TanStack Query, montagem de dependências e persistência AsyncStorage ficam em
`infrastructure/`. O `QueryProvider` e o `ThemeProvider` permanecem responsáveis apenas pela
integração React; o design system define uma porta de persistência e funciona com implementação
no-op quando usado isoladamente. Navegação continua em `app/` e `presentation/`, pois rotas e
aparência de headers são responsabilidades de framework e apresentação. Veja o
[ADR-004](docs/decisions/004-infrastructure-boundaries.md).

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

Todos os erros do Axios são normalizados em `ApiError` (status, message, `isRateLimit`). O flag `isRateLimit` (HTTP 403 e 429) desabilita retentativas automáticas no `QueryClient` raiz e exibe um estado de erro dedicado em cada tela, explicando o limite e sugerindo adicionar `EXPO_PUBLIC_GITHUB_TOKEN`. Erros de rede genéricos recebem um botão de nova tentativa que re-executa a query falha.

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
