require('dotenv').config();

/**
 * Конфигурационный файл приложения
 * Использует переменные окружения из .env файла
 */

const config = {
    // Основные настройки
    isDebug: process.env.IS_DEBUG === 'true',
    debugUrl: process.env.DEBUG_URL || 'https://localhost:7000/api',
    realUrl: process.env.REAL_URL || 'https://api.production.com/api',
    
    // Настройки загрузки
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 4 * 1024 * 1024, // 4MB
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    
    // Тестовые данные
    companyId: process.env.COMPANY_ID || '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    sessionId: process.env.SESSION_ID || '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    
    // Пути к файлам
    files: {
        video: process.env.VIDEO_FILE || './sample_video.webm',
        audio: process.env.AUDIO_FILE || './sample_audio.webm'
    }
};

// Выбираем API URL в зависимости от режима
config.apiBaseUrl = config.isDebug ? config.debugUrl : config.realUrl;

// Генерируем уникальный Stream ID
config.streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Валидация конфигурации
 */
function validateConfig() {
    const errors = [];
    
    if (!config.apiBaseUrl) {
        errors.push('API URL не настроен');
    }
    
    if (config.chunkSize < 1024 * 1024) {
        errors.push('Размер части слишком мал (минимум 1MB)');
    }
    
    if (config.chunkSize > 100 * 1024 * 1024) {
        errors.push('Размер части слишком велик (максимум 100MB)');
    }
    
    if (config.requestTimeout < 1000) {
        errors.push('Таймаут слишком мал (минимум 1000ms)');
    }
    
    if (config.maxRetries < 1 || config.maxRetries > 10) {
        errors.push('Количество повторных попыток должно быть от 1 до 10');
    }
    
    return errors;
}

/**
 * Показать текущую конфигурацию
 */
function showConfig() {
    console.log('⚙️  Конфигурация:');
    console.log(`   🔧 Режим: ${config.isDebug ? 'DEBUG' : 'PRODUCTION'}`);
    console.log(`   🌐 API URL: ${config.apiBaseUrl}`);
    console.log(`   📦 Размер части: ${formatBytes(config.chunkSize)}`);
    console.log(`   ⏱️  Таймаут: ${config.requestTimeout}ms`);
    console.log(`   🔄 Повторы: ${config.maxRetries}`);
    console.log(`   📹 Видео файл: ${config.files.video}`);
    console.log(`   🎵 Аудио файл: ${config.files.audio}`);
    console.log(`   🆔 Stream ID: ${config.streamId}`);
}

/**
 * Форматирует размер в байтах
 */
function formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Переключить режим отладки
 */
function toggleDebug() {
    config.isDebug = !config.isDebug;
    config.apiBaseUrl = config.isDebug ? config.debugUrl : config.realUrl;
    console.log(`🔧 Режим переключен на: ${config.isDebug ? 'DEBUG' : 'PRODUCTION'}`);
    console.log(`🌐 Новый API URL: ${config.apiBaseUrl}`);
}

/**
 * Получить конфигурацию для axios
 */
function getAxiosConfig() {
    const axiosConfig = {
        headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
        },
        timeout: config.requestTimeout
    };

    // Для debug режима отключаем проверку SSL сертификата
    if (config.isDebug) {
        const https = require('https');
        axiosConfig.httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });
    }

    return axiosConfig;
}

/**
 * Получить данные для запроса SAS токенов
 */
function getSasRequestData() {
    return {
        companyIdFromUserToken: config.companyId,
        sessionId: config.sessionId,
        streamId: config.streamId
    };
}

module.exports = {
    config,
    validateConfig,
    showConfig,
    toggleDebug,
    getAxiosConfig,
    getSasRequestData,
    formatBytes
};