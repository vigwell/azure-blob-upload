#!/usr/bin/env node

// Загружаем переменные окружения
require('dotenv').config();
const axios = require('axios');

/**
 * Тестовый скрипт для проверки API /Video/finalize
 * Используется для тестирования запуска обработки FFmpeg
 */

const CONFIG = {
    IS_DEBUG: process.env.IS_DEBUG === 'true',
    DEBUG_URL: process.env.DEBUG_URL || 'https://localhost:7000/api',
    REAL_URL: process.env.REAL_URL || 'https://api.production.com/api',
    REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    OVERLAY_TEXT: process.env.OVERLAY_TEXT || 'Test Processing'
};

CONFIG.API_BASE_URL = CONFIG.IS_DEBUG ? CONFIG.DEBUG_URL : CONFIG.REAL_URL;

/**
 * Тестирует API finalize
 */
async function testFinalize() {
    console.log('🧪 Тест API /Video/finalize');
    console.log('============================');
    console.log(`🌐 URL: ${CONFIG.API_BASE_URL}/Video/finalize`);
    console.log(`🔧 Режим: ${CONFIG.IS_DEBUG ? 'DEBUG' : 'PRODUCTION'}`);
    
    // Тестовые данные
    const testData = {
        streamId: 'test-stream-' + Date.now(),
        blobPrefix: 'test-prefix/20240917123456',
        outputFileName: 'test-output.mp4',
        overlayText: CONFIG.OVERLAY_TEXT
    };
    
    console.log('\n📤 Отправляем запрос:');
    console.log(JSON.stringify(testData, null, 2));
    
    const axiosConfig = {
        headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
        },
        timeout: CONFIG.REQUEST_TIMEOUT
    };

    // Для debug режима отключаем проверку SSL сертификата
    if (CONFIG.IS_DEBUG) {
        axiosConfig.httpsAgent = new (require('https')).Agent({
            rejectUnauthorized: false
        });
    }

    try {
        const response = await axios.post(
            `${CONFIG.API_BASE_URL}/Video/finalize`,
            testData,
            axiosConfig
        );

        console.log('\n✅ Успешный ответ!');
        console.log(`📊 Статус: ${response.status}`);
        console.log(`📄 Данные:`, JSON.stringify(response.data, null, 2));
        
        console.log('\n🎉 Тест пройден! API finalize работает корректно.');
        
    } catch (error) {
        console.error('\n❌ Ошибка теста:');
        console.error(`   Сообщение: ${error.message}`);
        
        if (error.response) {
            console.error(`   Статус: ${error.response.status}`);
            console.error(`   Данные: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 API сервер недоступен. Убедитесь что он запущен.');
            console.error(`   URL: ${CONFIG.API_BASE_URL}`);
        } else if (error.code === 'ENOTFOUND') {
            console.error('\n💡 Проверьте URL API в .env файле');
        }
        
        process.exit(1);
    }
}

/**
 * Показать помощь
 */
function showHelp() {
    console.log('🧪 Тест API /Video/finalize');
    console.log('============================');
    console.log('');
    console.log('Этот скрипт тестирует endpoint для запуска обработки видео.');
    console.log('');
    console.log('Использование:');
    console.log('  node finalize-test.js        # Запуск теста');
    console.log('  node finalize-test.js help   # Показать эту справку');
    console.log('');
    console.log('Переменные окружения (.env):');
    console.log('  IS_DEBUG=true               # Режим отладки');
    console.log('  DEBUG_URL=https://localhost:7000/api');
    console.log('  OVERLAY_TEXT=Test Text      # Текст для наложения');
    console.log('');
    console.log('Тестовый запрос:');
    console.log('  POST /api/Video/finalize');
    console.log('  {');
    console.log('    "streamId": "test-stream-123",');
    console.log('    "blobPrefix": "test-prefix/20240917123456",');
    console.log('    "outputFileName": "test-output.mp4",');
    console.log('    "overlayText": "Test Processing"');
    console.log('  }');
}

// Запуск
async function main() {
    const command = process.argv[2];
    
    if (command === 'help' || command === '--help' || command === '-h') {
        showHelp();
        return;
    }
    
    await testFinalize();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Критическая ошибка:', error.message);
        process.exit(1);
    });
}

module.exports = { testFinalize };