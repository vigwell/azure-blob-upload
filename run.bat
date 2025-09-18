@echo off
echo 🎬 Azure Blob Chunked Upload
echo ============================

REM Проверяем наличие Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не установлен!
    echo 💡 Скачайте с https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js найден

REM Устанавливаем зависимости если нужно
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    npm install
)

REM Проверяем файлы
if not exist "sample_video.webm" (
    echo ❌ Не найден sample_video.webm
    goto :missing_files
)

if not exist "sample_audio.webm" (
    echo ❌ Не найден sample_audio.webm
    goto :missing_files
)

echo ✅ Файлы найдены
echo 🚀 Запускаем загрузку...
echo.

node upload.js

echo.
echo 🏁 Готово!
pause
exit /b 0

:missing_files
echo.
echo 💡 Поместите тестовые файлы в папку проекта:
echo    - sample_video.webm
echo    - sample_audio.webm
echo.
echo 🔧 Можете использовать генератор из предыдущего ответа
echo    или команду: npm run setup
echo.
pause
exit /b 1