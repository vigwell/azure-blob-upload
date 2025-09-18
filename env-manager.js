#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Менеджер переменных окружения
 * Позволяет легко переключаться между режимами и настраивать конфигурацию
 */

const ENV_FILE = '.env';
const ENV_EXAMPLE_FILE = '.env.example';

/**
 * Чтение .env файла
 */
function readEnvFile() {
    if (!fs.existsSync(ENV_FILE)) {
        console.log('❌ Файл .env не найден');
        return null;
    }
    
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    
    return env;
}

/**
 * Запись .env файла
 */
function writeEnvFile(env) {
    const lines = [
        '# Режим отладки',
        `IS_DEBUG=${env.IS_DEBUG || 'true'}`,
        '',
        '# URL для отладки (разработка)',
        `DEBUG_URL=${env.DEBUG_URL || 'https://localhost:7000/api'}`,
        '',
        '# URL для продакшена',
        `REAL_URL=${env.REAL_URL || 'https://api.production.com/api'}`,
        '',
        '# Дополнительные настройки',
        `CHUNK_SIZE=${env.CHUNK_SIZE || '4194304'}`,
        `REQUEST_TIMEOUT=${env.REQUEST_TIMEOUT || '30000'}`,
        `MAX_RETRIES=${env.MAX_RETRIES || '3'}`,
        '',
        '# Тестовые данные',
        `COMPANY_ID=${env.COMPANY_ID || '3fa85f64-5717-4562-b3fc-2c963f66afa6'}`,
        `SESSION_ID=${env.SESSION_ID || '3fa85f64-5717-4562-b3fc-2c963f66afa6'}`
    ];
    
    fs.writeFileSync(ENV_FILE, lines.join('\n'));
    console.log(`✅ Файл ${ENV_FILE} обновлен`);
}

/**
 * Показать текущую конфигурацию
 */
function showConfig() {
    const env = readEnvFile();
    if (!env) return;
    
    console.log('⚙️  Текущая конфигурация:');
    console.log('========================');
    console.log(`🔧 Режим: ${env.IS_DEBUG === 'true' ? '🟢 DEBUG' : '🔴 PRODUCTION'}`);
    console.log(`🌐 Debug URL: ${env.DEBUG_URL}`);
    console.log(`🌐 Real URL: ${env.REAL_URL}`);
    console.log(`📦 Chunk Size: ${formatBytes(parseInt(env.CHUNK_SIZE))}`);
    console.log(`⏱️  Timeout: ${env.REQUEST_TIMEOUT}ms`);
    console.log(`🔄 Max Retries: ${env.MAX_RETRIES}`);
    console.log(`🏢 Company ID: ${env.COMPANY_ID}`);
    console.log(`🆔 Session ID: ${env.SESSION_ID}`);
}

/**
 * Переключить режим DEBUG/PRODUCTION
 */
function toggleMode() {
    const env = readEnvFile();
    if (!env) return;
    
    const isCurrentlyDebug = env.IS_DEBUG === 'true';
    env.IS_DEBUG = isCurrentlyDebug ? 'false' : 'true';
    
    writeEnvFile(env);
    
    console.log(`🔄 Режим переключен на: ${env.IS_DEBUG === 'true' ? '🟢 DEBUG' : '🔴 PRODUCTION'}`);
}

/**
 * Интерактивная настройка
 */
async function interactiveSetup() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
    
    console.log('🛠️  Интерактивная настройка переменных окружения');
    console.log('================================================');
    
    const env = readEnvFile() || {};
    
    try {
        // Режим
        const mode = await question(`🔧 Режим отладки? (${env.IS_DEBUG || 'true'}) [true/false]: `);
        if (mode.trim()) env.IS_DEBUG = mode.trim();
        
        // Debug URL
        const debugUrl = await question(`🌐 Debug URL? (${env.DEBUG_URL || 'https://localhost:7000/api'}): `);
        if (debugUrl.trim()) env.DEBUG_URL = debugUrl.trim();
        
        // Real URL
        const realUrl = await question(`🌐 Production URL? (${env.REAL_URL || 'https://api.production.com/api'}): `);
        if (realUrl.trim()) env.REAL_URL = realUrl.trim();
        
        // Chunk Size
        const chunkSize = await question(`📦 Размер части (байты)? (${env.CHUNK_SIZE || '4194304'}): `);
        if (chunkSize.trim()) env.CHUNK_SIZE = chunkSize.trim();
        
        // Timeout
        const timeout = await question(`⏱️  Таймаут (мс)? (${env.REQUEST_TIMEOUT || '30000'}): `);
        if (timeout.trim()) env.REQUEST_TIMEOUT = timeout.trim();
        
        // Max Retries
        const retries = await question(`🔄 Макс. повторов? (${env.MAX_RETRIES || '3'}): `);
        if (retries.trim()) env.MAX_RETRIES = retries.trim();
        
        // Company ID
        const companyId = await question(`🏢 Company ID? (${env.COMPANY_ID || '3fa85f64-5717-4562-b3fc-2c963f66afa6'}): `);
        if (companyId.trim()) env.COMPANY_ID = companyId.trim();
        
        // Session ID
        const sessionId = await question(`🆔 Session ID? (${env.SESSION_ID || '3fa85f64-5717-4562-b3fc-2c963f66afa6'}): `);
        if (sessionId.trim()) env.SESSION_ID = sessionId.trim();
        
        writeEnvFile(env);
        console.log('\n✅ Конфигурация сохранена!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        rl.close();
    }
}

/**
 * Создать .env файл из примера
 */
function createFromExample() {
    if (!fs.existsSync(ENV_EXAMPLE_FILE)) {
        console.log(`❌ Файл ${ENV_EXAMPLE_FILE} не найден`);
        return;
    }
    
    if (fs.existsSync(ENV_FILE)) {
        console.log(`⚠️  Файл ${ENV_FILE} уже существует`);
        return;
    }
    
    fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
    console.log(`✅ Создан ${ENV_FILE} из ${ENV_EXAMPLE_FILE}`);
}

/**
 * Валидация конфигурации
 */
function validateConfig() {
    const env = readEnvFile();
    if (!env) return;
    
    const errors = [];
    
    if (!env.DEBUG_URL) errors.push('DEBUG_URL не задан');
    if (!env.REAL_URL) errors.push('REAL_URL не задан');
    
    const chunkSize = parseInt(env.CHUNK_SIZE);
    if (isNaN(chunkSize) || chunkSize < 1024 * 1024) {
        errors.push('CHUNK_SIZE должен быть числом >= 1MB');
    }
    
    const timeout = parseInt(env.REQUEST_TIMEOUT);
    if (isNaN(timeout) || timeout < 1000) {
        errors.push('REQUEST_TIMEOUT должен быть числом >= 1000ms');
    }
    
    const retries = parseInt(env.MAX_RETRIES);
    if (isNaN(retries) || retries < 1 || retries > 10) {
        errors.push('MAX_RETRIES должен быть числом от 1 до 10');
    }
    
    if (errors.length === 0) {
        console.log('✅ Конфигурация валидна');
    } else {
        console.log('❌ Найдены ошибки в конфигурации:');
        errors.forEach(error => console.log(`   - ${error}`));
    }
}

/**
 * Форматирование размера в байтах
 */
function formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Показать помощь
 */
function showHelp() {
    console.log('🛠️  Environment Manager - Управление конфигурацией');
    console.log('================================================');
    console.log('');
    console.log('Команды:');
    console.log('  show         Показать текущую конфигурацию');
    console.log('  toggle       Переключить режим DEBUG/PRODUCTION');
    console.log('  setup        Интерактивная настройка');
    console.log('  create       Создать .env из .env.example');
    console.log('  validate     Проверить конфигурацию');
    console.log('  help         Показать эту справку');
    console.log('');
    console.log('Примеры:');
    console.log('  npm run env show');
    console.log('  npm run env toggle');
    console.log('  npm run env setup');
}

/**
 * Главная функция
 */
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'show':
            showConfig();
            break;
        case 'toggle':
            toggleMode();
            break;
        case 'setup':
            await interactiveSetup();
            break;
        case 'create':
            createFromExample();
            break;
        case 'validate':
            validateConfig();
            break;
        case 'help':
        default:
            showHelp();
            break;
    }
}

// Запуск
if (require.main === module) {
    main().catch(error => {
        console.error('Ошибка:', error.message);
        process.exit(1);
    });
}

module.exports = {
    readEnvFile,
    writeEnvFile,
    showConfig,
    toggleMode,
    validateConfig
};