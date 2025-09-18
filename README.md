# Azure Blob Storage Chunked Upload

Node.js проект для загрузки видео и аудио файлов по частям в Azure Blob Storage.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Подготовка файлов
Поместите тестовые файлы в корневую папку проекта:
- `sample_video.webm` - видео файл
- `sample_audio.webm` - аудио файл

### 3. Настройка переменных окружения
Создайте файл `.env` из примера:
```bash
npm run env:create
```

Или создайте `.env` файл вручную:
```bash
# Режим отладки
IS_DEBUG=true

# URL для отладки (разработка) 
DEBUG_URL=https://localhost:7000/api

# URL для продакшена
REAL_URL=https://api.production.com/api

# Дополнительные настройки
CHUNK_SIZE=4194304
REQUEST_TIMEOUT=30000
MAX_RETRIES=3

# Тестовые данные
COMPANY_ID=3fa85f64-5717-4562-b3fc-2c963f66afa6
SESSION_ID=3fa85f64-5717-4562-b3fc-2c963f66afa6
```

### 4. Запуск
```bash
npm start
```

## 📁 Структура проекта
```
azure-blob-chunked-upload/
├── package.json          # Конфигурация проекта
├── upload.js             # Основной файл загрузки
├── README.md            # Документация
├── sample_video.webm    # Тестовый видео файл (нужно добавить)
└── sample_audio.webm    # Тестовый аудио файл (нужно добавить)
```

## ⚙️ Управление конфигурацией

### **Переменные окружения**
```bash
# Показать текущую конфигурацию
npm run env:show

# Переключить режим DEBUG ⇄ PRODUCTION
npm run env:toggle

# Интерактивная настройка
npm run env:setup

# Создать .env из примера
npm run env:create

# Проверить валидность конфигурации
npm run env:validate
```

### **Быстрые команды**
```bash
# Запуск в debug режиме
npm run debug

# Запуск в production режиме  
npm run prod

# Обычный запуск (использует IS_DEBUG из .env)
npm start
```

## ⚙️ Конфигурация

### **Основные параметры (.env файл):**

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| `IS_DEBUG` | Режим отладки (true/false) | `true` |
| `DEBUG_URL` | URL для разработки | `https://localhost:7000/api` |
| `REAL_URL` | URL для продакшена | `https://api.production.com/api` |
| `CHUNK_SIZE` | Размер части файла (байты) | `4194304` (4MB) |
| `REQUEST_TIMEOUT` | Таймаут запроса (мс) | `30000` |
| `MAX_RETRIES` | Максимум повторов | `3` |
| `COMPANY_ID` | ID компании | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |
| `SESSION_ID` | ID сессии | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |
| `OVERLAY_TEXT` | Текст для наложения на видео | `Processing Video...` |

### **Режимы работы:**

**🔧 DEBUG режим** (`IS_DEBUG=true`):
- Используется `DEBUG_URL` 
- Отключена проверка SSL сертификатов
- Подробное логирование ошибок
- Показывается отладочная информация

**🏭 PRODUCTION режим** (`IS_DEBUG=false`):
- Используется `REAL_URL`
- Включена проверка SSL сертификатов
- Минимальное логирование
- Скрыта отладочная информация

## 🔧 Как это работает

### 1. **Получение SAS токенов**
```bash
curl -X 'POST' \
  'https://localhost:7000/api/Video/sas' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
    "companyIdFromUserToken": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "streamId": "string"
  }'
```

### 2. **Ответ API**
```json
{
  "success": true,
  "payload": {
    "videoSasUrl": "https://rads4vets.blob.core.windows.net/video-raw-uploads/string/20250917091611_video.webm?sv=...",
    "audioSasUrl": "https://rads4vets.blob.core.windows.net/video-raw-uploads/string/20250917091611_audio.webm?sv=...",
    "blobPrefix": "string/20250917091611"
  }
}
```

### 3. **Алгоритм загрузки**

1. **Разделение файла** на части по 4MB
2. **Генерация Block ID** для каждой части
3. **Параллельная отправка** частей через `PUT Block` API
4. **Объединение** частей через `PUT Block List` API
5. **Вызов finalize API** для запуска обработки FFmpeg
6. **Логирование** результата

### 4. **Полный процесс:**

1. **Получение SAS токенов** (`/api/Video/sas`)
2. **Chunked upload** видео и аудио файлов
3. **Завершение загрузки** (`/api/Video/finalize`)
4. **Запуск FFmpeg обработки** через Azure Storage Queue
5. **Логирование "ready"**

## 📊 Пример вывода

```bash
🎬 Azure Blob Storage Chunked Upload
=====================================
⚙️  Режим: 🔧 DEBUG
🌐 API URL: https://localhost:7000/api
📦 Размер части: 4 MB
⏱️  Таймаут: 30000ms

📁 Найдены файлы:
   ./sample_video.webm (2.1 MB)
   ./sample_audio.webm (445.2 KB)

🔑 Получаем SAS токены... (DEBUG режим)
🌐 API URL: https://localhost:7000/api
✅ SAS токены получены успешно
📁 Префикс блоба: stream-1726564571000/20250917091611
🔍 DEBUG: SAS URLs получены (скрыты в production)

🚀 Начинаем параллельную загрузку файлов...
📤 Начинаем загрузку video.webm...
📊 Файл: 2201472 байт, 1 частей
🚀 Загружаем 1 частей параллельно...
📦 video.webm: 1/1 частей загружено
🔗 Объединяем части video.webm...
✅ video.webm успешно загружен!

🎉 Загрузка завершена!
=====================
⏱️  Время загрузки: 2.34 секунд
📹 Видео URL: https://rads4vets.blob.core.windows.net/...
🎵 Аудио URL: https://rads4vets.blob.core.windows.net/...
📂 Префикс: stream-1726564571000/20250917091611
🔧 Режим: DEBUG

🎬 Запуск обработки FFmpeg...
🏁 Завершаем загрузку и запускаем обработку...
✅ Задача обработки запущена успешно
🎬 Выходной файл: final_stream-1726564571000.mp4
📝 Текст наложения: Patient ID: 12345
🔍 DEBUG: SAS URLs получены (скрыты в production)

✨ Процесс завершен! Файлы переданы на обработку.
📺 FFmpeg worker начнет обработку в ближайшее время.

ready
```

## 🛠️ Особенности реализации

### **ChunkedUploader класс**
- Разделяет файл на части по 4MB
- Генерирует уникальные Block ID в формате base64
- Загружает части параллельно
- Использует Azure Blob Storage Put Block API
- Объединяет части через Put Block List API

### **Обработка ошибок**
- Проверка существования файлов
- Валидация ответов API
- Обработка сетевых ошибок
- Детальное логирование ошибок

### **Производительность**
- Параллельная загрузка видео и аудио
- Параллельная отправка частей файла
- Оптимальный размер частей (4MB)
- Прогресс-бар для отслеживания загрузки

## 🔍 Отладка

### **Проверка API**
```bash
# Тест доступности API
curl -k https://localhost:7000/api/Video/sas

# Проверка с подробностями
curl -v -k -X POST https://localhost:7000/api/Video/sas \
  -H "Content-Type: application/json" \
  -d '{"companyIdFromUserToken":"3fa85f64-5717-4562-b3fc-2c963f66afa6","sessionId":"3fa85f64-5717-4562-b3fc-2c963f66afa6","streamId":"test"}'
```

### **Типичные ошибки**
- `ECONNREFUSED` - API сервер не запущен
- `ENOTFOUND` - Неправильный URL API
- `404` - Неправильный endpoint API
- `Файл не найден` - Отсутствуют тестовые файлы

## 📦 Зависимости

- **axios** - HTTP клиент для запросов
- **fs** - Работа с файловой системой
- **path** - Работа с путями файлов
- **crypto** - Генерация Block ID

## 🔗 Связанные технологии

- [Azure Blob Storage Put Block API](https://docs.microsoft.com/en-us/rest/api/storageservices/put-block)
- [Azure Blob Storage Put Block List API](https://docs.microsoft.com/en-us/rest/api/storageservices/put-block-list)
- [Shared Access Signatures (SAS)](https://docs.microsoft.com/en-us/azure/storage/common/storage-sas-overview)