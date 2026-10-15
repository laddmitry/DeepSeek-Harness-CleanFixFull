# Состав исходной поставки

В Git: изменённые исходники Harness, Python SDK, native-исходники, vendored Cordis, package.json/pnpm-lock.yaml, тесты и их небольшие документы/изображения, скрипты kit и документация. Наличие тестового PDF/PPTX или иконки не означает поставку готовой программы.

Отдельно устанавливаются: Node.js 24.21.0 x64, pnpm 11.28.5 (точная версия packageManager), PowerShell 7.6.6 x64 ZIP, Ollama 0.35.1 Windows AMD64 ZIP и модель qwen3:0.6b. Эти версии использовались при предыдущей проверке. Все сторонние программы, модель и pnpm-пакеты **не входят в Git**; лицензии и контрольные суммы берутся у их издателей. Нельзя устанавливать опубликованный upstream Harness из npm вместо исходников этого fork.

Источники: [Node archive](https://nodejs.org/dist/v24.21.0/), [pnpm](https://pnpm.io/installation), [PowerShell](https://github.com/PowerShell/PowerShell/releases/tag/v7.6.6), [Ollama](https://github.com/ollama/ollama/releases/tag/v0.35.1), [Qwen3](https://ollama.com/library/qwen3).

Сборка требует доступа к npm и официальным источникам зависимостей. После установки и загрузки модели обычная работа может выполняться без внешней сети. Подготовка отдельного офлайн-комплекта выполняется вне репозитория и не превращается в tracked payload.
