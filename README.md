# Очищенный DeepSeek Harness — исходники

Очищенная версия Harness для локальной модели, Web/headless/SDK/ACP и ограниченного Windows worker. Web использует локальный токен; аккаунт DeepSeek не нужен. Запрещённые cloud/telemetry-плагины не допускаются к загрузке.

В Git находятся **исходники, тесты, конфигурации, скрипты и документация**. Node.js, pnpm, PowerShell, Ollama, веса моделей, node_modules и готовый runtime устанавливаются или собираются отдельно. Больших payload-архивов в этой истории нет.

1. Прочитайте [требования и установку на Windows 11](docs/clean/INSTALL_WINDOWS11_RU.md).
2. Установите зависимости и соберите Harness по lockfile.
3. Подготовьте обычные учётные записи и права; запускайте через kit под DSHAudit.

[Что изменено](docs/clean/CHANGES_RU.md) · [Проверки](docs/clean/TEST_RESULTS_RU.md) · [Границы безопасности](docs/clean/SECURITY_RU.md) · [Состав](docs/clean/COMPONENTS_RU.md) · [Публикация](docs/clean/PUBLISH_GITHUB_DESKTOP_RU.md).

Неофициальная модификация. [MIT](LICENSE) и [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md) сохранены. Оригинальные документы проекта описывают также отключённые возможности; начинайте с инструкции этой версии.
