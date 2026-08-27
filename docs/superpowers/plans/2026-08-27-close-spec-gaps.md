# Close Spec Gaps (Sort Params + AI Declaration) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two remaining gaps against the technical test spec: (1) the GitHub repo search must send the spec-mandated `sort=stars&order=desc` params, and (2) the README must gain the required AI-usage declaration section.

**Architecture:** Gap 1 is a two-file change confined to `infrastructure/github/` — the `Axios*DataSource` layer owns path and params per §6 of the rules doc, so no other layer moves. Gap 2 is documentation only: a new pt-BR README section that states verifiable repo facts as fact and leaves everything only the author can know as loud, impossible-to-miss fill-in markers.

**Tech Stack:** TypeScript (strict), Axios, Jest (jest-expo), Prettier (printWidth 100), Markdown (GitHub-flavored, pt-BR).

**Spec:** External technical test spec (not stored in this repo). The load-bearing excerpts are quoted verbatim in Global Constraints below; the plan argues from those quotes.

## Global Constraints

- Spec §5.1 mandates exactly: `GET /search/repositories?q={query}&sort=stars&order=desc&page={n}&per_page=20`
- Spec §3.3: the search screen must behave identically regardless of the active data source (GitHub vs GitLab) — including ordering ("ordenação" is named under the highest-weight evaluation dimension, "Múltiplas Fontes de Dados", peso Alta).
- Spec §8 ("Uso de IA — Política e Avaliação") + §9 ("Entrega"): the README MUST declare (a) which parts were AI-generated or heavily AI-assisted, (b) which prompts/instructions were used, (c) what the candidate modified, reviewed, or rejected from AI output and why.
- **Never invent process claims.** In the AI section, only repo-verifiable facts may be written as fact; everything else stays as `⚠️ PREENCHER` / `⚠️ CONFIRMAR` markers for the author.
- Read `docs/ARCHITECTURE-RULES.md` before touching any code (repo rule). §6: `Axios*DataSource` owns path/params; §8: `jest.mock('../client')` is the legitimate pattern for `Axios*DataSource` tests.
- README and docs are pt-BR (ADRs in `docs/decisions/` are English — none change here).
- No decorative comments in code (repo convention, see commit `8b655f9`).
- Prettier: `printWidth: 100`, `singleQuote`, `trailingComma: 'all'` — the literal code below is already formatted to be Prettier-stable.
- Verification gate: `npm run verify` (type-check + lint + test) must stay green — currently 37 suites / 184 tests.
- **No git operations.** Working tree is clean at `f147cfb`. Do NOT commit, branch, or push — the user commits themselves. This overrides the usual "Commit" step in the task template; each task ends at verification instead.

---

### Task 1: Send `sort=stars&order=desc` on GitHub repo search

**Files:**
- Modify: `src/infrastructure/github/AxiosGitHubRepoDataSource.ts` (searchRepositories, lines 9–15)
- Test: `src/infrastructure/github/__tests__/AxiosGitHubRepoDataSource.test.ts` (two assertions: lines 18–21 and 43–46)

**Interfaces:**
- Consumes: `apiClient.get` from `src/infrastructure/github/client.ts` (mocked in the test via `jest.mock('../client')` — the documented pattern for `Axios*DataSource` tests, rules doc §8) and `GITHUB_PAGE_SIZE = 20` from `src/infrastructure/github/constants.ts`.
- Produces: unchanged public signature `searchRepositories(query: string, page: number, options?: RequestOptions): Promise<GitHubSearchRepositoriesResponseDto>` — only the request params change. No caller changes: `src/infrastructure/di/__tests__/containerWiring.test.ts:96` asserts the path with `expect.anything()` for the config, so it stays green.

Context: the GitLab sibling (`src/infrastructure/gitlab/AxiosGitLabRepoDataSource.ts`) already sends `order_by: 'star_count', sort: 'desc'`. Without this change, the same query is ordered by GitHub's "best match" on one source and by stars on the other — violating §3.3 and §5.1 simultaneously.

- [ ] **Step 1: Read the rules doc, then update the two failing assertions in the test**

Read `docs/ARCHITECTURE-RULES.md` first (repo rule). Then replace the full content of `src/infrastructure/github/__tests__/AxiosGitHubRepoDataSource.test.ts` with:

```ts
import { apiClient } from '../client';
import type { GitHubRepositoryDetailsDto } from '../dtos';
import { AxiosGitHubRepoDataSource } from '../AxiosGitHubRepoDataSource';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('AxiosGitHubRepoDataSource', () => {
  it('requests a repository search sorted by stars with the expected path and params', async () => {
    const response = { total_count: 0, incomplete_results: false, items: [] };
    mockGet.mockResolvedValueOnce({ data: response });

    const result = await new AxiosGitHubRepoDataSource().searchRepositories('react', 2);

    expect(mockGet).toHaveBeenCalledWith('/search/repositories', {
      params: { q: 'react', sort: 'stars', order: 'desc', page: 2, per_page: 20 },
      signal: undefined,
    });
    expect(result).toBe(response);
  });

  it('requests repository details with the expected path', async () => {
    const response = { id: 1 } as GitHubRepositoryDetailsDto;
    mockGet.mockResolvedValueOnce({ data: response });

    const result = await new AxiosGitHubRepoDataSource().getRepository('facebook', 'react');

    expect(mockGet).toHaveBeenCalledWith('/repos/facebook/react', { signal: undefined });
    expect(result).toBe(response);
  });

  it('hands the abort signal to Axios on both calls', async () => {
    const { signal } = new AbortController();
    mockGet.mockResolvedValue({ data: {} });
    const dataSource = new AxiosGitHubRepoDataSource();

    await dataSource.searchRepositories('react', 1, { signal });
    await dataSource.getRepository('facebook', 'react', { signal });

    expect(mockGet).toHaveBeenNthCalledWith(1, '/search/repositories', {
      params: { q: 'react', sort: 'stars', order: 'desc', page: 1, per_page: 20 },
      signal,
    });
    expect(mockGet).toHaveBeenNthCalledWith(2, '/repos/facebook/react', { signal });
  });
});
```

The only deltas from the current file are: `sort: 'stars', order: 'desc'` inserted between `q` and `page` in both params assertions (matching the param order of spec §5.1: `q`, `sort`, `order`, `page`, `per_page`), and the first test's name now says what the search asserts ("sorted by stars").

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx jest src/infrastructure/github/__tests__/AxiosGitHubRepoDataSource.test.ts`

Expected: FAIL — 2 failing tests ("requests a repository search sorted by stars with the expected path and params" and "hands the abort signal to Axios on both calls"), both with a `toHaveBeenCalledWith` / `toHaveBeenNthCalledWith` diff showing the received params object lacks `sort` and `order`. The "requests repository details" test still passes.

- [ ] **Step 3: Add the params to the implementation**

Replace the full content of `src/infrastructure/github/AxiosGitHubRepoDataSource.ts` with:

```ts
import type { RequestOptions } from '@/domain/shared/RequestOptions';

import { apiClient } from './client';
import { GITHUB_PAGE_SIZE } from './constants';
import type { GitHubRepositoryDetailsDto, GitHubSearchRepositoriesResponseDto } from './dtos';
import type { GitHubRepoDataSource } from './GitHubRepoDataSource';

export class AxiosGitHubRepoDataSource implements GitHubRepoDataSource {
  async searchRepositories(query: string, page: number, options: RequestOptions = {}) {
    const { data } = await apiClient.get<GitHubSearchRepositoriesResponseDto>(
      '/search/repositories',
      {
        params: { q: query, sort: 'stars', order: 'desc', page, per_page: GITHUB_PAGE_SIZE },
        signal: options.signal,
      },
    );
    return data;
  }

  async getRepository(owner: string, name: string, options: RequestOptions = {}) {
    const { data } = await apiClient.get<GitHubRepositoryDetailsDto>(`/repos/${owner}/${name}`, {
      signal: options.signal,
    });
    return data;
  }
}
```

The config object is now multi-line because the one-liner exceeds printWidth 100 with the two new params; the inner `params` line is 93 chars, within limit, so Prettier keeps this exact shape. Values are inline string literals, not constants: they are fixed by spec §5.1, used in exactly one place, and per rules doc §9 a shared constant is only warranted when two adapters need it (GitLab uses different vocabulary: `order_by: 'star_count'`). Sorting stays in the datasource, not the repository adapter, because per rules doc §6 the `Axios*DataSource` owns "path, `params`, `per_page`" while `*Repository` owns mapping and pagination.

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx jest src/infrastructure/github/__tests__/AxiosGitHubRepoDataSource.test.ts`

Expected: PASS — 3 tests.

- [ ] **Step 5: Run the full verification gate**

Run: `npm run verify`

Expected: type-check clean, lint clean (the new formatting is Prettier-stable; if `prettier/prettier` warns, run `npm run format` and re-verify), all 37 suites / 184 tests pass. In particular `src/infrastructure/di/__tests__/containerWiring.test.ts` stays green because its params assertion is `expect.anything()`.

Do NOT commit — hand the clean working tree back to the user.

---

### Task 2: Add the required "Uso de IA" section to the README

**Files:**
- Modify: `README.md` — three edits:
  1. insert the new `## Uso de IA` section between the end of `## Decisões arquiteturais` (after the "Tratamento de erros e rate limit" subsection and its closing `---`) and `## O que eu faria com mais tempo`;
  2. add one row to the `## Requisitos atendidos` table;
  3. fix the stale `ThemePreferenceStorage` location in the "Interfaces antes de implementações" table (currently line 277).

**Interfaces:**
- Consumes: verifiable repo facts only — `docs/ARCHITECTURE-RULES.md` (11 numbered sections; §3 layer table; §5 12-step checklist; §9 anti-patterns), the four pointer files (`AGENTS.md`, `.claude/rules/architecture.md`, `.cursor/rules/architecture.mdc`, `.github/copilot-instructions.md`), `eslint.config.js` (`no-restricted-imports` per layer, messages citing §3), `docs/decisions/001..010`, git history (77 commits, Conventional Commits; review-fix commits `0b00afe` and `f147cfb`), 37 suites / 184 tests.
- Produces: a `#uso-de-ia` anchor that the Requisitos atendidos table row links to.

**Placement rationale:** the section goes after `## Decisões arquiteturais` and before `## O que eu faria com mais tempo`. The AI declaration is about *how* the project was built and *why* decisions hold — it reads as the natural continuation of the decisions section (which already introduces the rules doc and the pointer files the AI section cites), while "O que eu faria com mais tempo" is a closing/outlook section that must remain last. Putting it earlier (e.g., after Requisitos atendidos) would front-load process meta-discussion before the reader has seen what the project *is*; instead, the Requisitos table gets a linking row so an evaluator scanning for spec compliance finds the section immediately.

**Marker design rationale:** the task-suggested `<!-- PREENCHER -->` HTML comments are invisible in GitHub's rendered view — exactly where a reviewer (or the author proofreading before submission) would look. So the markers below are *visible* when rendered: a `> [!WARNING]` admonition heading the section plus `⚠️ PREENCHER` / `⚠️ CONFIRMAR OU REMOVER` blockquotes. An unfilled README then visibly announces itself as not ready on the repo's front page — impossible to submit by accident.

**Honesty boundary (restated for the executor):** everything under "Como a IA foi dirigida" is checkable in the repo and written as fact. Everything about tools, prompts, and accepted/rejected output is NOT known to us and must remain inside the marker blockquotes as guiding questions — do not answer them, do not soften the markers, do not remove the warning admonition.

- [ ] **Step 1: Insert the "Uso de IA" section**

In `README.md`, locate the boundary between the last subsection of "Decisões arquiteturais" and the final section. The current text is:

```markdown
Erros genéricos recebem um botão de nova tentativa que re-executa a query falha. Códigos HTTP não existem fora de `infrastructure/`.

---

## O que eu faria com mais tempo
```

Insert the new section so the region becomes (new content between the two existing `---` separators; a second `---` is added to keep the README's one-separator-per-section rhythm):

```markdown
Erros genéricos recebem um botão de nova tentativa que re-executa a query falha. Códigos HTTP não existem fora de `infrastructure/`.

---

## Uso de IA

> [!WARNING]
> **Esta seção contém marcadores `⚠️ PREENCHER` e ainda não está pronta para envio.** Cada marcador
> pede um relato que só o autor pode fornecer — ferramentas usadas, prompts reais, saídas de IA
> aceitas ou rejeitadas. Remova este aviso somente depois de resolver o último marcador.

Ferramentas de IA participaram do desenvolvimento deste projeto. Esta seção declara como, separando
o que é **verificável no próprio repositório** do que é relato do meu processo de trabalho.

### Como a IA foi dirigida (verificável no repositório)

O repositório foi estruturado para que qualquer ferramenta de IA trabalhasse sob as mesmas regras —
escritas à mão e impostas por máquina:

- **Uma única fonte de instruções, escrita manualmente** —
  [docs/ARCHITECTURE-RULES.md](docs/ARCHITECTURE-RULES.md): 11 seções cobrindo a tabela de
  dependências entre camadas, o checklist de 12 passos para módulo novo, o padrão de teste por
  camada e a lista explícita de anti-padrões. `AGENTS.md`, `.claude/rules/architecture.md`,
  `.cursor/rules/architecture.mdc` e `.github/copilot-instructions.md` são apenas ponteiros para
  esse documento: toda ferramenta de IA usada no projeto recebeu exatamente o mesmo contexto.
- **Fronteiras impostas por lint, não por confiança** — as regras de camada são erros de
  `no-restricted-imports` em `eslint.config.js`, um bloco por camada, com mensagem citando a seção
  violada do documento de regras. Código gerado por IA que viole a arquitetura quebra
  `npm run lint` antes de chegar a qualquer revisão humana.
- **Decisões registradas** — dez ADRs em [docs/decisions/](docs/decisions/) documentam o raciocínio
  por trás de cada decisão arquitetural relevante.
- **Histórico auditável** — 77 commits pequenos e incrementais em Conventional Commits, e 37 suítes
  / 184 testes verificados por `npm run verify`.

### O que foi gerado ou fortemente assistido por IA

> ⚠️ **PREENCHER** — substitua este bloco pelo seu relato. Perguntas-guia:
>
> - Quais camadas ou arquivos tiveram código majoritariamente gerado por IA (boilerplate de DTOs?
>   mappers? testes? componentes de UI?) e quais foram escritos manualmente?
> - A arquitetura (camadas, ports, checklist) foi desenhada por você e executada com IA, ou
>   proposta pela IA e ajustada por você?
> - Os textos de documentação (este README, os ADRs) foram redigidos, revisados ou traduzidos com
>   apoio de IA?

### Prompts e instruções utilizados

Fato verificável: a instrução permanente entregue a toda ferramenta foi o próprio
[docs/ARCHITECTURE-RULES.md](docs/ARCHITECTURE-RULES.md), através dos arquivos de ponteiro listados
acima — na prática, um "prompt de sistema" versionado junto com o código.

> ⚠️ **PREENCHER** — complete com o seu uso real:
>
> - Quais ferramentas foram usadas e para quê (ex.: autocomplete no editor, agente para tarefas
>   multi-arquivo, chat para dúvidas pontuais)?
> - Dois ou três exemplos representativos de prompts que você escreveu para tarefas específicas.

### O que modifiquei, revisei ou rejeitei da saída da IA

> ⚠️ **CONFIRMAR OU REMOVER** — o relato abaixo descreve um episódio verificável no histórico do
> repositório e foi pré-redigido para esta seção. Mantenha-o somente se quiser apresentá-lo assim;
> ajuste o texto ou remova-o se preferir outro enquadramento.

Exemplo verificável no histórico (commits `0b00afe` e `f147cfb`): uma revisão arquitetural
assistida por IA encontrou três violações das regras do próprio projeto, corrigidas em vez de
aceitas como estavam:

1. a porta `ThemePreferenceStorage` estava declarada em `src/design-system/theme/`, fazendo a
   infraestrutura importar a camada de UI — foi movida para `src/domain/shared/`, restaurando a
   direção da dependência;
2. `src/infrastructure/**` era a única camada sem guarda automatizada no lint — ganhou seus blocos
   de `no-restricted-imports` (dois, porque em flat config a opção de uma mesma regra é
   substituída, não mesclada);
3. singletons de adapters (`asyncStorageThemePreference`, `asyncStorageDataSourcePreference`)
   exportados nos próprios arquivos foram movidos para `infrastructure/di/container.ts`, o único
   ponto de instanciação permitido.

> ⚠️ **PREENCHER** — acrescente os seus próprios casos:
>
> - Sugestões de IA que você rejeitou e por quê (padrão inadequado, dependência desnecessária,
>   teste frágil…)?
> - O que você sempre revisou manualmente antes de aceitar (nomes? fronteiras de camada? testes?)?
> - Alguma parte em que a IA errou e você reescreveu por completo?

---

## O que eu faria com mais tempo
```

- [ ] **Step 2: Add the compliance row to the "Requisitos atendidos" table**

In the `## Requisitos atendidos` table, directly after the row

```markdown
| README com instalação e arquitetura | ✅ | Seções abaixo |
```

add:

```markdown
| Declaração de uso de IA no README | ⚠️ | Seção [Uso de IA](#uso-de-ia) — marcadores a preencher antes da entrega |
```

The status is deliberately `⚠️`, not `✅`: the section exists but is not compliant until the author fills the markers. Flipping this cell to `✅` is the author's act when removing the last marker (the warning admonition tells them so implicitly; the row makes the incomplete state visible in the very first table an evaluator reads).

- [ ] **Step 3: Fix the stale `ThemePreferenceStorage` location**

The new section's item 1 states the port was moved to `src/domain/shared/` — which `docs/ARCHITECTURE-RULES.md` §4 confirms — but the README's "Interfaces antes de implementações" table (line 277) still says the old location, which would contradict the new section on the same page. Change:

```markdown
| `ThemePreferenceStorage` | `design-system/theme/` | `AsyncStorageThemePreference` |
```

to:

```markdown
| `ThemePreferenceStorage` | `domain/shared/` | `AsyncStorageThemePreference` |
```

- [ ] **Step 4: Verify the README edits**

Run:

```bash
grep -n "^## Uso de IA" README.md
grep -c "PREENCHER" README.md
grep -n "Declaração de uso de IA" README.md
grep -n "ThemePreferenceStorage" README.md
```

Expected: exactly one `## Uso de IA` heading, positioned after the "Decisões arquiteturais" content and before `## O que eu faria com mais tempo` (confirm by eye or with `grep -n "^## " README.md` — the section order must end `... Decisões arquiteturais, Uso de IA, O que eu faria com mais tempo`); `PREENCHER` count of 4 (one in the warning, three marker blocks); one table row hit; the `ThemePreferenceStorage` table row now says `domain/shared/`.

- [ ] **Step 5: Confirm the verification gate is untouched**

Run: `npm run verify`

Expected: still green (README changes cannot affect it; this guards against accidental stray edits). Do NOT commit — the user commits themselves, and the `⚠️` markers must be filled by them first anyway.

---

## Self-Review

**Spec coverage:**
- §5.1 exact query string → Task 1 sends `q`, `sort=stars`, `order=desc`, `page`, `per_page=20` (via `GITHUB_PAGE_SIZE = 20`), in spec order. Covered.
- §3.3 identical behavior across sources → both sources now sort by stars descending (GitLab already did via `order_by: 'star_count'`). Covered by Task 1.
- §8/§9 required README section with the three mandated contents → Task 2's section has one subsection per mandated item, plus the verifiable-process preamble. Content only the author knows is scaffolded, not invented. Covered.
- Repo rule "read ARCHITECTURE-RULES.md before code" → Task 1 Step 1. Covered.

**Placeholder scan:** the only placeholder-like text in this plan is the `⚠️ PREENCHER` / `⚠️ CONFIRMAR` markers inside Task 2's literal README content — those are the deliverable itself (deliberate, spec-driven fill-ins for the author), not plan gaps. All code blocks are complete final file contents.

**Type consistency:** `searchRepositories(query, page, options)` signature unchanged between Task 1's test and implementation; `GITHUB_PAGE_SIZE` resolves to `20`, matching the test's literal `20`. The `#uso-de-ia` anchor in Task 2 Step 2 matches GitHub's slug for the `## Uso de IA` heading added in Step 1.

**Known out-of-scope observation (not a task):** README line ~150 (`domain/shared` contents in the project-structure tree) omits `Theme`/`ThemePreferenceStorage`; harmless and untouched to avoid scope creep beyond the two gaps — Step 3 fixes only the line the new section would directly contradict.
