#!/bin/bash

echo "🎬 Azure Blob Chunked Upload"
echo "============================"

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo "💡 Установите с https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js найден"

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости..."
    npm install
fi

# Проверяем файлы
missing_files=false

if [ ! -f "sample_video.webm" ]; then
    echo "❌ Не найден sample_video.webm"
    missing_files=true
fi

if [ ! -f "sample_audio.webm" ]; then
    echo "❌ Не найден sample_audio.webm"
    missing_files=true
fi

if [ "$missing_files" = true ]; then
    echo ""
    echo "💡 Поместите тестовые файлы в папку проекта:"
    echo "   - sample_video.webm"
    echo "   - sample_audio.webm"
    echo ""
    echo "🔧 Можете использовать генератор из предыдущего ответа"
    echo "   или команду: npm run setup"
    echo ""
    exit 1
fi

echo "✅ Файлы найдены"
echo "🚀 Запускаем загрузку..."
echo ""

node upload.js

echo ""
echo "🏁 Готово!"