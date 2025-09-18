# 🛠️ Гид по переменным окружения

## 🚀 Быстрый старт

### 1. Создание конфигурации
```bash
# Создать .env из примера
npm run env:create

# Или интерактивная настройка
npm run env:setup
```

### 2. Переключение режимов
```bash
# Переключить DEBUG ⇄ PRODUCTION
npm run env:toggle

# Показать текущий режим
npm run env:show

# Запуск в конкретном режиме
npm run debug    # Принудительно DEBUG
npm run prod     # Принудительно PRODUCTION
npm start        # Использует IS_DEBUG из .env
```

## ⚙️ Переменные окружения

### **Основные настройки**

| Переменная | Тип | Описание | Пример |
|------------|-----|----------|--------|
| `IS_DEBUG` | boolean | Режим отладки | `true`, `false` |
| `DEBUG_URL` | string | URL для разработки | `https://localhost:7000/api` |
| `REAL_URL` | string | URL для продакшена | `https://api.company.com/api` |

### **Настройки загрузки**

| Переменная | Тип | Описание | Диапазон |
|------------|-----|----------|----------|
| `CHUNK_SIZE` | number | Размер части (байты) | 1MB - 100MB |
| `REQUEST_TIMEOUT` | number | Таймаут (мс) | ≥ 1000 |
| `MAX_RETRIES` | number | Макс. повторов | 1 - 10 |

### **Идентификаторы**

| Переменная | Тип | Описание | Формат |
|------------|-----|----------|--------|
| `COMPANY_ID` | string | ID компании | UUID |
| `SESSION_ID` | string | ID сессии | UUID |

## 🔧 Команды управления

### **Просмотр конфигурации**
```bash
npm run env:show
```
**Вывод:**
```
⚙️  Текущая конфигурация:
========================
🔧 Режим: 🟢 DEBUG
🌐 Debug URL: https://localhost:7000/api
🌐 Real URL: https://api.production.com/api
📦 Chunk Size: 4 MB
⏱️  Timeout: 30000ms
🔄 Max Retries: 3
🏢 Company ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6
🆔 Session ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6
```

### **Переключение режима**
```bash
npm run env:toggle
```
**Вывод:**
```
🔄 Режим переключен на: 🔴 PRODUCTION
```

### **Интерактивная настройка**
```bash
npm run env:setup
```
**Интерактивный диалог:**
```
🛠️  Интерактивная настройка переменных окружения
================================================
🔧 Режим отладки? (true) [true/false]: false
🌐 Debug URL? (https://localhost:7000/api): 
🌐 Production URL? (https://api.production.com/api): https://api.mycompany.com/api
📦 Размер части (байты)? (4194304): 8388608
⏱️  Таймаут (мс)? (30000): 60000
🔄 Макс. повторов? (3): 5
🏢 Company ID? (3fa85f64-...): 
🆔 Session ID? (3fa85f64-...): 

✅ Конфигурация сохранена!
```

### **Валидация конфигурации**
```bash
npm run env:validate
```
**Успешная валидация:**
```
✅ Конфигурация валидна
```

**С ошибками:**
```
❌ Найдены ошибки в конфигурации:
   - CHUNK_SIZE должен быть числом >= 1MB
   - REQUEST_TIMEOUT должен быть числом >= 1000ms
```

## 🎯 Различия режимов

### **🔧 DEBUG режим** (`IS_DEBUG=true`)
- ✅ Использует `DEBUG_URL`
- ✅ Отключена проверка SSL сертификатов  
- ✅ Подробное логирование
- ✅ Показ отладочной информации
- ✅ Показ SAS URLs в логах
- ✅ Полный стек ошибок

### **🏭 PRODUCTION режим** (`IS_DEBUG=false`)  
- ✅ Использует `REAL_URL`
- ✅ Включена проверка SSL сертификатов
- ✅ Минимальное логирование
- ❌ Скрыта отладочная информация
- ❌ SAS URLs не показываются
- ❌ Стек ошибок скрыт

## 💡 Советы и рекомендации

### **Размер частей (CHUNK_SIZE)**
```bash
# Для медленной сети
CHUNK_SIZE=2097152    # 2MB

# Оптимальный размер
CHUNK_SIZE=4194304    # 4MB (по умолчанию)

# Для быстрой сети
CHUNK_SIZE=8388608    # 8MB

# Максимальный размер
CHUNK_SIZE=104857600  # 100MB
```

### **Таймауты**
```bash
# Быстрая сеть
REQUEST_TIMEOUT=15000   # 15 сек

# Стандартная сеть  
REQUEST_TIMEOUT=30000   # 30 сек (по умолчанию)

# Медленная сеть
REQUEST_TIMEOUT=120000  # 2 мин
```

### **Повторные попытки**
```bash
# Стабильная сеть
MAX_RETRIES=1

# Стандартная сеть
MAX_RETRIES=3         # По умолчанию  

# Нестабильная сеть
MAX_RETRIES=5
```

## 🔒 Безопасность

### **Не коммитьте .env файл!**
```bash
# ✅ В .gitignore должно быть:
.env
.env.local
.env.*.local

# ✅ Коммитьте только:
.env.example
```

### **Переменные в CI/CD**
```bash
# GitHub Actions
- name: Upload files
  env:
    IS_DEBUG: false
    REAL_URL: ${{ secrets.API_URL }}
    COMPANY_ID: ${{ secrets.COMPANY_ID }}
    SESSION_ID: ${{ secrets.SESSION_ID }}
  run: npm start
```

### **Переменные в Docker**
```dockerfile
# Dockerfile
ENV IS_DEBUG=false
ENV REAL_URL=https://api.production.com/api
ENV CHUNK_SIZE=4194304
```

## 🐛 Отладка

### **Проверка переменных**
```bash
# Linux/Mac
printenv | grep -E "(DEBUG|REAL|CHUNK|TIMEOUT|RETRIES|COMPANY|SESSION)"

# Windows
set | findstr /R "DEBUG REAL CHUNK TIMEOUT RETRIES COMPANY SESSION"
```

### **Тест конфигурации**
```bash
# Показать конфигурацию и сразу запустить
npm run env:show && npm start

# Переключить режим и запустить  
npm run env:toggle && npm start
```

### **Сброс к значениям по умолчанию**
```bash
# Удалить .env и создать заново
rm .env
npm run env:create
npm run env:show
```