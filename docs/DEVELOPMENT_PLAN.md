# Tesnel — План разработки

> Статический анализатор зависимостей проекта с визуализацией графа и AI-интеграцией.

## Архитектура

```
CLI (вход: entry point)
  → Analyzer (рекурсивный обход, парсинг, резолв)
  → JSON (граф зависимостей, циклы, метаданные)
  → Static HTML (Vue + D3.js, встроенный в билд)
  → MCP Server (Claude Code читает граф on-demand)
```

## Фаза 0: Инфраструктура

### 0.1 Обновление зависимостей

| Пакет | Было | Стало |
|-------|------|-------|
| oxc-parser | 0.38.0 | latest |
| oxc-resolver | 2.1.1 | latest |
| @types/node | 22.10.1 | latest |
| typescript | 5.7.2 | latest |
| vite | 6.0.2 | latest |
| oxlint | 0.14.0 | latest |

- Убрать `@oxc-resolver/binding-wasm32-wasi` (не нужен для Node-окружения)
- Проверить breaking changes в oxc-parser (API менялся значительно)

### 0.2 Тестирование

- **Vitest** — нативная интеграция с Vite, быстрый, поддержка TypeScript из коробки
- Структура тестов: `lib/**/*.test.ts` рядом с исходниками
- Покрытие: `@vitest/coverage-v8`
- Скрипты: `test`, `test:watch`, `test:coverage`

### 0.3 Настройка проекта

- Добавить `tsconfig.json` для strict mode
- Настроить `vitest.config.ts`
- Добавить скрипт `dev` для запуска CLI в режиме разработки
- Настроить bin entry point в package.json для CLI

---

## Фаза 1: Core CLI — Полный граф зависимостей

### 1.1 Рекурсивный обход

- Из entry point рекурсивно резолвить все импорты
- Строить Map: `filePath → { imports, importedBy }`
- Обрабатывать: `.ts`, `.tsx`, `.js`, `.jsx`, `.vue` (script блок)
- Игнорировать: `node_modules`, bare specifiers (npm пакеты)
- Ограничение глубины (опциональный флаг `--depth`)

### 1.2 Детект циклических зависимостей

- Алгоритм: DFS с отслеживанием visited/inStack
- Результат: массив циклов `[fileA → fileB → fileC → fileA]`
- Сохранение в JSON для подсветки в UI

### 1.3 Структура выходного JSON

```jsonc
{
  "meta": {
    "entry": "./src/index.ts",
    "generatedAt": "2025-01-01T00:00:00Z",
    "totalFiles": 42,
    "totalDependencies": 128
  },
  "tree": {
    // иерархия директорий → файлы
    "src": {
      "_type": "directory",
      "children": {
        "index.ts": {
          "_type": "file",
          "path": "src/index.ts",
          "imports": ["src/utils/helpers.ts", "src/components/App.vue"],
          "importedBy": []
        }
      }
    }
  },
  "graph": {
    // плоский граф для быстрого доступа
    "nodes": [{ "id": "src/index.ts", "directory": "src" }],
    "edges": [{ "from": "src/index.ts", "to": "src/utils/helpers.ts" }]
  },
  "cycles": [
    ["src/a.ts", "src/b.ts", "src/a.ts"]
  ],
  "ai": {
    // кэш AI-описаний (заполняется on-demand)
    "descriptions": {},
    "architectureNotes": []
  }
}
```

### 1.4 CLI интерфейс

```bash
tesnel analyze ./src/index.ts          # базовый анализ
tesnel analyze ./src/index.ts -o graph.json  # указать output
tesnel analyze ./src/index.ts --depth 5      # ограничить глубину
tesnel analyze ./src/index.ts --ai claude    # разрешить AI-фичи
```

---

## Фаза 2: Static HTML UI

### 2.1 Визуализация графа (Vue + D3.js)

- **Вложенные прямоугольники** — директории как контейнеры, файлы внутри
- **Стрелки** — зависимости между файлами (import → target)
- **Подсветка циклов** — стрелки циклических зависимостей красным/оранжевым
- Layout: `d3-hierarchy` для вложенности + `dagre`/`elkjs` для расположения стрелок

### 2.2 Интерактивность

- **Контрол глубины** — слайдер: от корня до максимальной вложенности
- **Клик на файл** — показать его imports/importedBy в сайдбаре
- **Hover** — подсветить все связанные рёбра
- **Zoom/Pan** — стандартное для графовых визуализаций
- **Поиск** — найти файл по имени, подсветить в графе

### 2.3 AI кнопки (когда `--ai claude` был передан)

- **"Объяснить"** — при клике на файл/папку, запрос через MCP, результат в панели
- **"Анализ архитектуры"** — открывает чат-интерфейс, саммари сохраняется в JSON

### 2.4 Сборка

- HTML генерируется CLI командой: `tesnel build` или автоматически после `analyze`
- Vue-приложение билдится в единый HTML (inline JS/CSS)
- JSON встраивается как `<script type="application/json">` или подгружается рядом

---

## Фаза 3: MCP Server

### 3.1 Функциональность

MCP-сервер для Claude Code, позволяет:

- `tesnel_get_structure` — получить дерево проекта
- `tesnel_get_file_info` — информация о файле (зависимости, кто импортирует)
- `tesnel_get_cycles` — список циклических зависимостей
- `tesnel_describe_file` — AI-описание файла (генерирует + кэширует в JSON)
- `tesnel_describe_directory` — AI-описание директории
- `tesnel_architecture_chat` — начать/продолжить архитектурный диалог

### 3.2 Кэширование

- AI-ответы сохраняются в `ai` секцию JSON
- При повторном запросе — возврат из кэша
- Инвалидация: по mtime файла (если файл изменился — описание устарело)

---

## Фаза 4: Claude Code интеграция

### 4.1 Параметр `--ai`

```bash
tesnel analyze ./src/index.ts --ai claude
# или если у пользователя алиас:
tesnel analyze ./src/index.ts --ai my-claude-alias
```

- При сборке JSON: НЕ генерировать описания автоматически (экономия токенов)
- Просто пометить в `meta.aiEnabled: true` и `meta.aiProvider: "claude"`
- AI-описания генерируются только on-demand (через UI кнопки или MCP)

### 4.2 MCP конфигурация

Пользователь добавляет в `.claude/settings.json`:

```json
{
  "mcpServers": {
    "tesnel": {
      "command": "npx",
      "args": ["tesnel", "mcp"],
      "env": {}
    }
  }
}
```

---

## Порядок реализации (приоритеты)

| # | Задача | Зависит от | Сложность |
|---|--------|------------|-----------|
| 1 | Обновление зависимостей + тесты | — | S |
| 2 | Рекурсивный обход графа | 1 | M |
| 3 | Детект циклов | 2 | S |
| 4 | CLI интерфейс + JSON output | 2, 3 | M |
| 5 | Базовый UI (граф без AI) | 4 | L |
| 6 | Интерактивность UI (depth, hover) | 5 | M |
| 7 | MCP Server (базовые tools) | 4 | M |
| 8 | AI кнопки в UI + кэширование | 6, 7 | M |
| 9 | Архитектурный чат | 7, 8 | M |

---

## Тестирование

### Unit-тесты (Vitest)

- `parser.test.ts` — парсинг файлов, извлечение импортов
- `resolver.test.ts` — резолв путей
- `graph.test.ts` — построение графа, обход
- `cycles.test.ts` — детект циклических зависимостей
- `cli.test.ts` — парсинг аргументов, output

### Интеграционные тесты

- Набор fixture-проектов в `tests/fixtures/`
- Проверка полного pipeline: entry → JSON → валидация структуры
- Fixture с циклами, fixture с глубокой вложенностью

### UI тесты

- Component tests (Vitest + @vue/test-utils)
- Визуальное тестирование при ручной проверке

---

## Зависимости для добавления

### Runtime
- `commander` или `cac` — CLI парсинг
- `vue` — UI фреймворк
- `d3` — визуализация графа

### Dev
- `vitest` — тестирование
- `@vitest/coverage-v8` — покрытие
- `@vue/test-utils` — тесты компонентов
- `vite-plugin-vue` — сборка Vue в Vite
