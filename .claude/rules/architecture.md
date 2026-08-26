# Regras de arquitetura — github-explorer

**Leia `docs/ARCHITECTURE-RULES.md` agora, antes de escrever ou alterar qualquer código deste repo.**
Ele é a fonte única das regras. Este arquivo é só um ponteiro — não resuma nem substitua o conteúdo dele.

Resumo mínimo, insuficiente para trabalhar sozinho:

- Clean Architecture + Ports & Adapters. Dependência aponta sempre para dentro.
- `domain/` não importa nada. `application/` importa só `domain/`.
- `presentation/` e `app/` nunca importam `@/infrastructure`, exceto nos providers de `presentation/di/` e em `app/_layout.tsx`.
- Interface antes de implementação: repositório, datasource e serviço externo são contratos declarados separado da implementação.
- Instanciação de classe concreta só em `src/infrastructure/di/container.ts`.
- Módulo novo segue o checklist de 12 passos da seção 5, de dentro para fora.

Antes de abrir PR: `npm run type-check && npm run lint && npm test`, mais os greps da seção 10.
