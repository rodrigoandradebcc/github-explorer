# Regras de arquitetura — github-explorer

Base de contexto obrigatória para criar ou alterar qualquer módulo neste repo.
Clean Architecture + Ports & Adapters. Cinco camadas, dependência sempre apontando para dentro.

## 1. Princípios obrigatórios

1. **Inversão de dependência** — módulo de alto nível (regra de negócio) nunca depende de módulo de baixo nível (HTTP, storage, lib externa). Ambos dependem de abstração.
2. **Interface antes de implementação** — repositório, datasource e serviço externo são declarados como `interface`/`type` e implementados em arquivo separado.
3. **Domínio isolado** — `src/domain/` não importa React, React Native, Axios, AsyncStorage, TanStack Query, Expo ou qualquer framework. Tem que rodar em Node puro.
4. **Application separada** — use cases e services orquestram o domínio sem conhecer UI nem infraestrutura.
5. **Apresentação desacoplada** — tela e componente consomem abstração (hook, service injetado). Nunca chamam API nem storage direto.

## 2. Mapa de camadas

| Camada | Caminho | Responsabilidade |
| --- | --- | --- |
| Domínio | `src/domain/` | entidades, ports de repositório, regras puras, `Page<T>` |
| Aplicação | `src/application/` | use cases (`*UseCase`) e services (`*Service`) |
| Infraestrutura | `src/infrastructure/` | datasources, adapters, mappers, DTOs, config de libs, composition root |
| Apresentação | `src/presentation/` | telas, componentes, hooks de UI, providers de DI |
| Rotas | `src/app/` | expo-router; wrappers finos, sem lógica |
| Design system | `src/design-system/` | biblioteca fechada e portável; superfície pública única em `index.ts` |

## 3. Tabela de dependências permitidas

| Camada | Pode importar |
| --- | --- |
| `domain/` | **nada** |
| `application/` | só `domain/` — sem exceção |
| `infrastructure/` | `domain/`; `application/` apenas em `di/container.ts` |
| `design-system/` | só a si mesmo e `domain/` (tipos e ports de preferência) |
| `presentation/` | `application/` (tipos), `domain/`, `design-system/` — nunca `infrastructure/` |
| `app/` | `presentation/`, `design-system/`, `infrastructure/` (só para injetar no composition root) |

Import de `@/infrastructure` fora de `app/_layout.tsx` é bug de arquitetura: a infraestrutura entra
por lá e desce injetada nos providers de `presentation/providers/`.

## 4. Estrutura real

```
src/
├── domain/
│   ├── entities/          Repo, RepoDetails, Issue, IssueLabel, Owner, issueRules
│   ├── errors/            DataAccessError (kind: rateLimit|notFound|network|unknown) + isRateLimitError
│   ├── repositories/      RepoRepository, IssueRepository   (ports)
│   └── shared/            Page<T>, DataSource (DATA_SOURCE_IDS/DataSourceId),
│                          DataSourceSelection, DataSourcePreferenceStorage,
│                          Theme (THEME_MODES/ThemeMode), ThemePreferenceStorage
├── application/
│   ├── repositories/      SearchReposUseCase, GetRepoDetailsUseCase, RepoService
│   └── issues/            ListRepoIssuesUseCase, IssueService
├── infrastructure/
│   ├── github/            dtos, mappers, client (axios + toDataAccessError), constants,
│   │                      GitHub*DataSource (port) + AxiosGitHub*DataSource (impl),
│   │                      GitHub*Repository (adapters dos ports de domínio)
│   ├── gitlab/            espelho de github/ para a API do GitLab → GitLab*,
│   │                      mais pageHeaders.ts (x-total / x-next-page)
│   ├── query/             createQueryClient()
│   ├── storage/           AsyncStorageThemePreference, AsyncStorageDataSourcePreference
│   └── di/                container.ts + DataSourceRegistry + SourceRouted*Repository
│                          — composition root
├── presentation/
│   ├── providers/         ApplicationProvider, QueryProvider, DataSourceProvider
│   ├── repositories/      components/, hooks/, screens/
│   ├── issues/            components/, hooks/, screens/, utils/
│   └── shared/            queryKeys, formatCount, hooks/useDebounce, components/,
│                          navigation/
├── design-system/         tokens/, theme/, components/
└── app/                   rotas expo-router
```

## 5. Checklist para módulo novo

Ordem obrigatória — de dentro para fora. Cada passo compila e testa sozinho.

1. **Domínio** — criar entidade em `domain/entities/`. Campos em camelCase, datas como `Date`. Regra pura vai em `*Rules.ts` ao lado, como função exportada.
2. **Port** — declarar a interface do repositório em `domain/repositories/`. Métodos falam a língua do negócio, retornam entidade ou `Page<T>`. Zero vocabulário de HTTP.
3. **Use case** — em `application/<módulo>/<Ação>UseCase.ts`. Classe, port injetada por construtor, método público único `execute(input)`. Validação de entrada mora aqui.
4. **Service** — em `application/<módulo>/<Módulo>Service.ts`. Agrupa os use cases do módulo, só delega. É a superfície que a UI consome — `application/index.ts` exporta só services e tipos de input; classe de use case não sai pelo barrel.
5. **DTO + mapper** — `infrastructure/<provider>/dtos.ts` guarda o formato cru (snake_case). `mappers.ts` converte DTO → entidade. É aqui que o vocabulário externo morre.
6. **Datasource** — port em `infrastructure/<provider>/<Provider><Módulo>DataSource.ts`, implementação em `Axios<Provider><Módulo>DataSource.ts`. Uma port por repositório, não uma compartilhada.
7. **Adapter de repositório** — `<Provider><Módulo>Repository.ts` com `implements` do port de domínio. Recebe a datasource por construtor.
8. **Container** — ligar tudo em `infrastructure/di/container.ts` e exportar o service.
9. **Hook de UI** — `presentation/<módulo>/hooks/use<Ação>.ts`. Resolve o service por `useRepoService()`/`useIssueService()`, nunca por import de singleton. Chave de cache em `presentation/shared/queryKeys.ts`.
10. **Tela e componentes** — `presentation/<módulo>/screens/` e `components/`. UI só do design-system.
11. **Rota** — wrapper fino em `src/app/`.
12. **ADR** — decisão arquitetural nova vira arquivo em `docs/decisions/`, em inglês, no formato dos existentes.

## 6. Divisão de responsabilidade dentro da infra

| Arquivo | Faz | Não faz |
| --- | --- | --- |
| `Axios*DataSource` | path, `params`, `per_page`; devolve DTO cru | `map`, `filter`, `Math.min`, cálculo de página |
| `*Repository` | mapeia DTO → entidade, calcula `nextPage`, aplica regra de domínio | montar URL, tocar axios |

Motivo: a regra de paginação é a parte não-trivial e precisa ser testável com fake, sem mock de HTTP.

## 7. Convenções de nome

| Coisa | Padrão | Exemplo |
| --- | --- | --- |
| Entidade | PascalCase, singular | `Repo.ts` |
| Port de repositório | `<Entidade>Repository` | `IssueRepository`, `RepoRepository` |
| Use case | `<Verbo><Alvo>UseCase` | `SearchReposUseCase` |
| Service | `<Módulo>Service` | `RepoService` |
| Port de datasource | `<Provider><Módulo>DataSource` | `GitHubIssueDataSource`, `GitHubRepoDataSource` |
| Implementação | `<Lib><Port>` | `AxiosGitHubIssueDataSource` |
| Adapter de repositório | `<Provider><Entidade>Repository` | `GitHubIssueRepository` |
| Hook de UI | `use<Ação>` | `useSearchRepos` |

Nome de método diz o que faz: `listOpenIssues`, não `listIssues` com `state: 'open'` escondido dentro.

A entidade é `Repo`, não `Repository`: o sufixo `Repository` já é do padrão de port, e usar a mesma
palavra para a entidade produzia `RepositoryRepository`. Vocabulário de provider — `GitHubRepositoryDto`,
`searchRepositories`, `/search/repositories` — não muda: ele morre no mapper (§5.5). Ver ADR-008.

## 8. Padrão de teste por camada

| Camada | Como testar | Proibido |
| --- | --- | --- |
| `domain/` | função pura, entrada e saída | qualquer mock |
| `application/` | port fake (objeto literal implementando a interface) | `jest.mock` de módulo |
| `*Repository` | datasource fake | `jest.mock('../client')` |
| `Axios*DataSource` | `jest.mock('../client')` — legítimo, o alvo é o axios | — |
| `presentation/` | `renderWithProviders`, injetando service fake via `ApplicationProvider` | mockar hook por string quando dá para injetar |
| `design-system/` | `renderWithTheme` | conhecer `application/` ou `infrastructure/` |

`jest.mock('<caminho>')` por string quebra silencioso em rename. Use só onde o módulo mockado é o alvo do teste.

## 9. Anti-padrões

- Reexportar tipo de infra através de `application/index.ts` para a UI alcançar. Reexport esconde a direção da seta, não a inverte.
- Duck-typing (`'campo' in error`) para evitar import entre camadas. Se precisa do contrato, declare o contrato no domínio.
- Singleton exportado no fim do arquivo do adapter. Instanciação é exclusividade do `container.ts`.
- Um adapter importando constante de outro adapter. Constante compartilhada vai para `constants.ts`.
- Interface de datasource compartilhada entre repositórios diferentes. Gera fake inchado no teste.
- Regra de negócio dentro do adapter porque "é detalhe da API". Se sobrevive à troca do provider, é domínio.
- Criar `infrastructure/navigation/`. No expo-router a config de navegação é a convenção de arquivos de `src/app/`.

## 10. Verificação

```bash
npm run verify   # type-check + lint + test
```

As regras da §3 são impostas por `no-restricted-imports` em `eslint.config.js`, um bloco por camada.
Import de camada proibida é **erro de lint**, não achado de revisão. A mensagem cita esta seção.

`infrastructure/` tem dois blocos: o geral, que também barra `application/`, e o de
`di/container.ts`, que reabre `application/` — a exceção da §3. São dois porque em flat config
a opção de uma mesma regra é substituída, não mesclada.

`presentation/` não tem exceção: infraestrutura entra só por `app/_layout.tsx`, injetada nos providers.

O lint lê `import`, não `require()` dinâmico. Para esse caso o grep continua valendo:

```bash
grep -rn "require(" src/domain src/application   # vazio
```

## 11. Erros entre camadas

Falha de acesso a dado é contrato de domínio, não de transporte. `domain/errors/DataAccessError.ts`
declara a classe e o union `kind` (`rateLimit`, `notFound`, `network`, `unknown`), mais o guard
`isRateLimitError`.

- `infrastructure/github/client.ts` e `infrastructure/gitlab/client.ts` traduzem status HTTP para
  `kind` em `toDataAccessError` e lançam no interceptor. Status, header e vocabulário de HTTP param
  nessa linha. Cada provider traduz conforme a sua semântica: no GitHub 403 e 429 são `rateLimit`;
  no GitLab só 429 (403 lá é autorização, não limite).
- `infrastructure/query/queryClient.ts` e as telas usam o guard. Nenhuma camada acima da infra
  conhece código HTTP.

Provider novo (GraphQL, cache local) traduz o erro dele para o mesmo `kind`. Não crie tipo de erro
por provider, e não identifique erro por duck-typing (`'campo' in error`): contrato que o compilador
não vê quebra calado em produção.
