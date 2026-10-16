# Установка из исходников на Windows 11 Pro

Инструкция рассчитана на отдельную чистую Windows 11 Pro x64. В репозитории нет готовых программ, модели и node_modules. Сначала нужна сеть для загрузки официальных инструментов и зависимостей; затем рабочий запуск может выполняться без интернета. Паролей по умолчанию нет. Текущее состояние проверки этого пути описано в [результатах](TEST_RESULTS_RU.md).

## 1. Инструменты и исходники

Для сборки отведите 8 ГБ RAM и не менее 20 ГБ свободного диска; для рабочей маленькой модели ранее использовали 6 ГБ RAM. Издатели инструментов и версии перечислены в [составе](COMPONENTS_RU.md). Откройте отдельную чистую VM без личных данных; административные действия ниже выполняются только в ней.

Установите Git for Windows с [официального сайта](https://git-scm.com/downloads/win) и Node.js 24.21.0 x64 MSI из [архива Node](https://nodejs.org/dist/v24.21.0/). Node должен находиться в C:\Program Files\nodejs. Перед установкой сверяйте Get-FileHash с SHA-256 издателя. Откройте новое окно PowerShell, чтобы обновился PATH.

Установите точный package manager, не latest:

```powershell
npm.cmd install --global pnpm@11.28.5
if ($LASTEXITCODE -ne 0) { throw 'pnpm installation failed' }
node --version
pnpm.cmd --version
```

Ожидаются v24.21.0 и 11.28.5. Проверка версии Node в package.json допускает также другие совместимые версии, но они не становятся автоматически проверенными.

В административном PowerShell создайте новую структуру. C:\DSH и аккаунты DSHAudit/DSHAgent ещё не должны существовать; существующую установку эти команды не обновляют:

```powershell
if (Test-Path C:\DSH) { throw 'Use a clean machine: C:\DSH already exists' }
foreach ($name in 'DSHAudit','DSHAgent') {
    if (Get-LocalUser -Name $name -ErrorAction SilentlyContinue) { throw "Account already exists: $name" }
}
foreach ($dir in 'source','kit','tools','tools\PowerShell7','tools\ollama','tools\models','data','data\temp','workspace','logs','admin-evidence') {
    New-Item -ItemType Directory -Path (Join-Path C:\DSH $dir) -Force | Out-Null
}
```

Клонируйте **репозиторий исходников этой очищенной версии** в C:\DSH\source\deepseek-harness-master и выберите конкретный проверенный коммит. URL и SHA возьмите со страницы опубликованной версии; не клонируйте upstream вместо fork. Через GitHub Desktop можно сначала скачать репозиторий, затем скопировать его исходники в указанный каталог. Не копируйте чужие node_modules или готовый runtime. Если скачан ZIP без .git, перед сборкой задайте $env:DSH_CLIENT_COMMIT_HASH равным полному SHA скачанного коммита: build использует его в метаданных клиента. В Git checkout SHA берётся из HEAD автоматически.

Распакуйте официальный PowerShell 7.6.6 win-x64 ZIP непосредственно в C:\DSH\tools\PowerShell7, чтобы там появился pwsh.exe. Распакуйте официальный ollama-windows-amd64.zip версии 0.35.1 в C:\DSH\tools\ollama, сохранив его библиотеки и лицензии. Нужен CLI/server ZIP; отдельно работающий tray server на 11434 будет конфликтовать с данным запуском. Издатели: [PowerShell ZIP](https://github.com/PowerShell/PowerShell/releases/tag/v7.6.6), [Ollama ZIP](https://github.com/ollama/ollama/releases/tag/v0.35.1).

## 2. Зависимости и сборка

В PowerShell 7 из C:\DSH\tools\PowerShell7\pwsh.exe, на чистой сборочной VM:

```powershell
Set-Location C:\DSH\source\deepseek-harness-master
$env:POWERSHELL_TELEMETRY_OPTOUT='1'
Start-Transcript -Path C:\DSH\admin-evidence\source-build.txt
try {
    pnpm.cmd install --frozen-lockfile --store-dir C:\DSH\tools\pnpm-store --package-import-method=copy
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed' }
    pnpm.cmd run build:official
    if ($LASTEXITCODE -ne 0) { throw 'Harness build failed' }
} finally { Stop-Transcript }
```

Не заменяйте --frozen-lockfile на обновление lockfile для обхода ошибки. При отсутствии пакета, отказе supply-chain policy или ошибке lifecycle/native script остановитесь и сохраните журнал; это не успешная установка. Для зависимостей с native-сборкой при отсутствии готового совместимого модуля могут понадобиться официальные Visual Studio Build Tools C++ и Python; не отключайте проверку обязательных компонентов Harness.

После успешной сборки должны существовать apps\cli\lib\bin.js, packages\sdk\client\lib\index.js и клиентские Web assets. Скопируйте текстовые скрипты kit в отдельную рабочую папку:

```powershell
Copy-Item -Path .\kit\* -Destination C:\DSH\kit -Recurse
```

Вместе со скриптами копируется kit\source-version.json с проверенными SHA-256 файлов package.json, pnpm-lock.yaml и pnpm-workspace.yaml. Freeze сверяет их UTF-8-содержимое с учётом равнозначных окончаний строк LF/CRLF и останавливается до изменения ACL при отсутствии манифеста или изменении содержимого. Не создавайте манифест из непроверенной установки и не отключайте сверку для обхода отказа; используйте полный kit выбранной версии.

Если скачивали ZIP, Windows могла добавить отметку интернета. После просмотра собственных скриптов kit снимите отметку только с них командой Get-ChildItem C:\DSH\kit -File -Recurse | Unblock-File. Глобальную execution policy менять не требуется.

## 3. Локальная модель

До назначения окончательных ACL загрузите модель в C:\DSH\tools\models. В том же административном PowerShell 7:

```powershell
$env:OLLAMA_HOST='127.0.0.1:11434'
$env:OLLAMA_NO_CLOUD='1'
$env:OLLAMA_MODELS='C:\DSH\tools\models'
if (Get-NetTCPConnection -State Listen -LocalPort 11434 -ErrorAction SilentlyContinue) { throw 'Port 11434 is already in use' }
$modelBootstrap=Start-Process C:\DSH\tools\ollama\ollama.exe -ArgumentList serve -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput C:\DSH\admin-evidence\model-download.stdout.log `
    -RedirectStandardError C:\DSH\admin-evidence\model-download.stderr.log
try {
    $ready=$false
    for ($i=0; $i -lt 45; $i++) {
        try { Invoke-RestMethod http://127.0.0.1:11434/api/version -TimeoutSec 2 | Out-Null; $ready=$true; break }
        catch { Start-Sleep -Seconds 1 }
    }
    if (!$ready) { throw 'Model download server did not start' }
    & C:\DSH\tools\ollama\ollama.exe pull qwen3:0.6b
    if ($LASTEXITCODE -ne 0) { throw 'Model download failed' }
} finally {
    $ownedModel=Get-Process -Id $modelBootstrap.Id -ErrorAction SilentlyContinue
    if ($ownedModel -and $ownedModel.Path -eq 'C:\DSH\tools\ollama\ollama.exe') { Stop-Process -Id $modelBootstrap.Id }
}
```

Порт 11434 перед началом должен быть свободен. Не используйте чужой уже запущенный server для этой загрузки. qwen3:0.6b — небольшая модель для функциональных проверок, не обещание качества сложных задач. Сохраните фактический digest полученной модели и SHA-256 инструментов вместе с локальными журналами: registry tag может измениться.

## 4. Пользователи и защита каталогов

Этап выполняет администратор в PowerShell 7 после завершения сборки и остановки её Node-процессов. Исходники и инструменты после Freeze станут недоступны контроллеру для записи.

```powershell
$controllerPassword=Read-Host 'Create DSHAudit password' -AsSecureString
$workerPassword=ConvertTo-SecureString (([Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)))+'Aa1!') -AsPlainText -Force
& C:\DSH\kit\Initialize-WindowsWorker.ps1 -ConfirmAccountChanges -ControllerPassword $controllerPassword -WorkerPassword $workerPassword
$controllerPassword=$null; $workerPassword=$null
& C:\DSH\kit\Freeze-WindowsPermissions.ps1
```

Initialize создаёт два обычных пользователя, выдаёт контроллеру права для запуска ограниченного worker и сохраняет его credential-файл под ACL. Проверьте сообщения и admin-evidence; скрипт не должен использоваться как средство сброса существующих пользователей. Freeze откажется при неизвестных внешних/битых junction или многозначной структуре. Такой отказ требует разбора пути, а не обхода проверки. Хранилище pnpm располагается внутри tools, импорт выбран copy, чтобы не менять ACL файлов через внешние hardlinks.

## 5. Обычный рабочий запуск

Выйдите из установочного администратора и войдите в Windows как DSHAudit с выбранным паролем. Запустите C:\DSH\tools\PowerShell7\pwsh.exe **без UAC** и выполните:

```powershell
& C:\DSH\kit\Setup-User.ps1
```

Он проверит 13 canary-условий ACL, добавит английскую и русскую раскладки, создаст Harness-Local и запустит локальную модель и Web. Переключение языка — Win+Пробел; при необходимости повторно войдите в Windows. Откройте адрес с token из окна Harness в браузере этой VM. Вход DeepSeek не используется. Оставьте процесс открытым; повторный запуск — Harness-Local.

Попросите создать hello.txt с текстом LOCAL_HELLO, затем прочитать его. Проверьте файл в C:\DSH\workspace и события инструментов; текстовый ответ модели сам по себе не подтверждает операцию. Данные контроллера — C:\DSH\data, журналы — C:\DSH\logs. Копировать в Git их нельзя.

Полная дополнительная проверка под обычным DSHAudit:

```powershell
& C:\DSH\kit\Run-Verification.ps1
```

Итог — C:\DSH\logs\verification-latest.json. Скрипты поддерживают сборку из исходников и прежний runtime layout; запуск новых путей на чистой VM ещё должен быть отдельно подтверждён. Для SDK/ACP используйте Run-Harness.ps1 с -Profile sdk или acp под DSHAudit. Широкие команды агента, внешний MCP и общий web fetch запрещены; служба без интерактивного входа пока не подтверждена.

## Обновления и автономный сервер

Сначала соберите и проверьте новую версию на отдельной VM; текущие данные не перезаписывайте. При работе без внешней сети заранее подготовьте собственные инструменты, модель и pnpm store вне Git; установите зависимости с --offline --frozen-lockfile и повторите проверки. Эта инструкция не обещает готовый переносимый архив: абсолютные junction и ACL нужно создавать на целевой машине. Готовую прежнюю VM переносом source-only Git не обновляют.
