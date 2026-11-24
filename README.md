# Agence 3

UniFolio : refonte de l'outil de portfolio de compétences de l'IUT (Nuxt 4, TypeScript, Pinia).

## Organisation du dépôt

| Dossier | Contenu |
|---|---|
| [`frontend/`](frontend/) | Application Nuxt 4 (interface, routes Nitro provisoires, tests) |
| [`backend/`](backend/) | API Symfony 8 + ApiPlatform (Docker, PostgreSQL) : voir [`backend/README.md`](backend/README.md) |
| [`docs/`](docs/) | Fonctionnalités, roadmap, décisions, design |

## Documentation

- [Fonctionnalités](docs/FONCTIONNALITES.md) : périmètre de référence et statuts.
- [Roadmap](docs/ROADMAP.md) : planification par sprint.
- [Bascule vers l'API](docs/BASCULE-API.md) : brancher le front sur ApiPlatform (`NUXT_API_PROXY`), écran par écran.

## Assistants IA

Les règles de travail des assistants IA sont dans [`AGENTS.md`](AGENTS.md), source unique pour toute l'équipe :

- **Codex (ChatGPT)** lit `AGENTS.md` directement ;
- **Gemini CLI** et le mode agent de **Gemini Code Assist** lisent `GEMINI.md`, qui importe `AGENTS.md` ;
- **Claude Code** lit `CLAUDE.md`, qui importe `AGENTS.md`.

Pour changer une règle, modifier uniquement `AGENTS.md` (par une PR).

## Démarrage

Prérequis : Node 24 (voir `frontend/.nvmrc`).

```bash
cd frontend
npm ci
npm run dev          # http://localhost:3000
```

Toutes les commandes (lint, typage, tests, E2E) sont listées dans [`AGENTS.md`](AGENTS.md#2-commandes).
