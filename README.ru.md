# tesnel

Статический анализатор графа зависимостей с визуализацией для TypeScript, JavaScript и Vue проектов.

> **tesnel** (տեսնել) — «видеть» по-армянски.

[English](./README.md)

## Возможности

- **Рекурсивный анализ зависимостей** от entry point или директории
- **Интерактивная визуализация графа** — вложенные директории, файлы, стрелки зависимостей
- **Детект циклов** — циклические зависимости подсвечены красным
- **Разделение type-imports** — пунктирные линии для `import type`, можно отключить
- **Контроль глубины** — свернуть/развернуть вложенность директорий
- **Фильтры** — изолировать выбранный файл, показать только циклы, исключить по паттерну
- **Поддержка Vue SFC** — парсинг `<script setup>` из `.vue` файлов
- **Поддержка Nuxt** — определяет автоимпорты composables и stores через `.nuxt/types/`
- **Поддержка Nest.js** — работает из коробки с explicit imports
- **tsconfig paths** — резолвит `@/`, `~/` и кастомные алиасы
- **MCP сервер** — интеграция с Claude Code для запросов к графу зависимостей
- **Single HTML** — самодостаточный файл, работает офлайн через `file://`

## Установка

```bash
npm install -g tesnel
# или
pnpm add -g tesnel
```

## Использование

### Анализ проекта

```bash
# От entry файла
tesnel analyze ./src/main.ts

# От директории (все .ts/.vue/.js файлы)
tesnel analyze ./src

# Кастомный путь вывода
tesnel analyze ./src/main.ts -o deps.json

# Ограничить глубину обхода
tesnel analyze ./src/main.ts --depth 3

# Только JSON, без HTML
tesnel analyze ./src/main.ts --no-html
```

Результат: `tesnel-output.json` + `tesnel-output.html`

### Открыть визуализацию

Откройте `tesnel-output.html` в любом браузере. Сервер не нужен.

**Управление:**
- **Zoom** — скролл или кнопки +/-
- **Pan** — перетаскивание
- **Слайдер глубины** — свернуть директории
- **Клик на файл** — sidebar с imports/importedBy
- **Поиск** — найти файл по имени
- **Hide unrelated** — изолировать связи выбранного файла
- **Cycles only** — показать только циклические зависимости
- **Exclude** — скрыть файлы по паттерну (например `__tests__, .spec`)
- **Type imports** — вкл/выкл type-only imports (пунктирные линии)

### MCP сервер (Claude Code)

```bash
# Запуск MCP сервера (читает tesnel-output.json из CWD)
tesnel mcp

# Или указать путь к данным
tesnel mcp --data ./deps.json
```

Добавьте в `.mcp.json` или настройки Claude Code:

```json
{
  "mcpServers": {
    "tesnel": {
      "command": "npx",
      "args": ["tesnel", "mcp"]
    }
  }
}
```

**Доступные tools:**

| Tool | Описание |
|------|----------|
| `tesnel_get_stats` | Обзор проекта: файлы, связи, циклы |
| `tesnel_get_structure` | Дерево директорий (с ограничением глубины) |
| `tesnel_get_file_info` | Imports и importedBy для файла |
| `tesnel_get_cycles` | Все циклические зависимости |

## Поддерживаемые проекты

| Фреймворк | Как работает |
|-----------|-------------|
| **React** | Explicit imports — работает из коробки |
| **Vue** | `.vue` SFC через `@vue/compiler-sfc` |
| **Nuxt** | Автоимпорты из `.nuxt/types/imports.d.ts` |
| **Nest.js** | Explicit imports — работает из коробки |
| **Angular** | Стандартные TS imports — работает из коробки |
| **Любой TS/JS** | Статические imports и re-exports |

## Легенда графа

| Визуал | Значение |
|--------|----------|
| Пунктирная рамка, серый акцент | Директория |
| Сплошная рамка, зелёный бордер | `.vue` файл |
| Сплошная рамка, синий бордер | `.ts` / `.tsx` файл |
| Сплошная рамка, жёлтый бордер | `.js` / `.jsx` файл |
| Сплошная стрелка | Runtime import |
| Пунктирная стрелка | Type-only import |
| Красная стрелка | Циклическая зависимость |
| Синяя стрелка | Связи выбранного файла |

## Разработка

```bash
pnpm install
pnpm test          # запуск тестов
pnpm build         # сборка UI + CLI
pnpm dev analyze ./src/main.ts  # запуск CLI в dev режиме
```

## Стек

- [oxc-parser](https://www.npmjs.com/package/oxc-parser) — быстрый AST парсинг
- [oxc-resolver](https://github.com/oxc-project/oxc-resolver) — резолв модулей с поддержкой tsconfig
- [ELK.js](https://github.com/kieler/elkjs) — иерархический layout графа
- [Vue 3](https://vuejs.org) + [D3.js](https://d3js.org) — интерактивная визуализация
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) — MCP сервер
- [Vite](https://vite.dev) — сборка
- [Vitest](https://vitest.dev) — тестирование

## Лицензия

ISC
