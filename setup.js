#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎬 Azure Blob Chunked Upload - Setup');
console.log('====================================');

/**
 * Проверяет и создает тестовые файлы если их нет
 */
function checkTestFiles() {
    const videoFile = './sample_video.webm';
    const audioFile = './sample_audio.webm';
    
    let needsFiles = false;
    
    if (!fs.existsSync(videoFile)) {
        console.log(`❌ Не найден: ${videoFile}`);
        needsFiles = true;
    } else {
        const stats = fs.statSync(videoFile);
        console.log(`✅ Найден: ${videoFile} (${formatFileSize(stats.size)})`);
    }
    
    if (!fs.existsSync(audioFile)) {
        console.log(`❌ Не найден: ${audioFile}`);
        needsFiles = true;
    } else {
        const stats = fs.statSync(audioFile);
        console.log(`✅ Найден: ${audioFile} (${formatFileSize(stats.size)})`);
    }
    
    if (needsFiles) {
        console.log('\n💡 Как получить тестовые файлы:');
        console.log('1. Используйте генератор из предыдущего ответа');
        console.log('2. Скачайте с https://sample-videos.com/');
        console.log('3. Создайте с помощью FFmpeg:');
        console.log('   ffmpeg -f lavfi -i testsrc=duration=10:size=640x480:rate=30 -c:v libvpx sample_video.webm');
        console.log('   ffmpeg -f lavfi -i sine=frequency=440:duration=15 -c:a libopus sample_audio.webm');
        return false;
    }
    
    return true;
}

/**
 * Проверяет установку зависимостей
 */
function checkDependencies() {
    console.log('\n📦 Проверяем зависимости...');
    
    try {
        require('axios');
        console.log('✅ axios установлен');
    } catch (e) {
        console.log('❌ axios не установлен');
        return false;
    }
    
    return true;
}

/**
 * Устанавливает зависимости
 */
function installDependencies() {
    console.log('\n📥 Устанавливаем зависимости...');
    
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Зависимости установлены');
        return true;
    } catch (error) {
        console.error('❌ Ошибка установки зависимостей:', error.message);
        return false;
    }
}

/**
 * Тестирует подключение к API
 */
async function testApiConnection() {
    console.log('\n🔗 Тестируем подключение к API...');
    
    try {
        const axios = require('axios');
        const https = require('https');
        
        const response = await axios.post(
            'https://localhost:7000/api/Video/sas',
            {
                companyIdFromUserToken: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                sessionId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                streamId: 'test-setup'
            },
            {
                headers: {
                    'accept': '*/*',
                    'Content-Type': 'application/json'
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                }),
                timeout: 5000
            }
        );
        
        if (response.data.success) {
            console.log('✅ API доступен');
            console.log(`📁 Префикс: ${response.data.payload.blobPrefix}`);
            return true;
        } else {
            console.log('⚠️  API отвечает, но вернул success: false');
            return false;
        }
        
    } catch (error) {
        console.log('❌ API недоступен:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Убедитесь что API сервер запущен на https://localhost:7000');
        } else if (error.code === 'ENOTFOUND') {
            console.log('💡 Проверьте URL API в конфигурации');
        }
        
        return false;
    }
}

/**
 * Показывает статус готовности
 */
function showReadiness() {
    console.log('\n🚀 Готовность к запуску:');
    console.log('========================');
    
    const hasFiles = checkTestFiles();
    const hasDeps = checkDependencies();
    
    if (hasFiles && hasDeps) {
        console.log('✅ Все готово для запуска!');
        console.log('\n🎯 Команды для запуска:');
        console.log('   npm start        # Основной запуск');
        console.log('   node upload.js   # Прямой запуск');
        console.log('   npm run upload   # Альтернативный запуск');
        return true;
    } else {
        console.log('❌ Требуется дополнительная настройка');
        return false;
    }
}

/**
 * Создает простой тестовый файл
 */
function createDummyFile(fileName, sizeKB = 100) {
    console.log(`📝 Создаем заглушку ${fileName} (${sizeKB}KB)...`);
    
    try {
        const buffer = Buffer.alloc(sizeKB * 1024, 0);
        // Добавляем заголовок WebM (очень упрощенный)
        const header = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]); // EBML header
        header.copy(buffer, 0);
        
        fs.writeFileSync(fileName, buffer);
        console.log(`✅ Создан ${fileName}`);
        return true;
    } catch (error) {
        console.error(`❌ Ошибка создания ${fileName}:`, error.message);
        return false;
    }
}

/**
 * Форматирует размер файла
 */
function formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Главная функция настройки
 */
async function main() {
    // Проверяем зависимости и устанавливаем если нужно
    if (!checkDependencies()) {
        if (!installDependencies()) {
            process.exit(1);
        }
    }
    
    // Проверяем тестовые файлы
    if (!checkTestFiles()) {
        console.log('\n❓ Создать заглушки для тестовых файлов? (y/n)');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('> ', (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                createDummyFile('./sample_video.webm', 500); // 500KB
                createDummyFile('./sample_audio.webm', 100); // 100KB
                console.log('\n⚠️  Созданы заглушки! Замените их на настоящие .webm файлы');
            }
            
            rl.close();
            continueSetup();
        });
    } else {
        continueSetup();
    }
}

async function continueSetup() {
    // Тестируем API (опционально)
    console.log('\n❓ Протестировать подключение к API? (y/n)');
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('> ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            await testApiConnection();
        }
        
        rl.close();
        
        // Показываем итоговый статус
        showReadiness();
        
        console.log('\n🏁 Настройка завершена!');
    });
}

// Запускаем настройку
if (require.main === module) {
    main().catch(error => {
        console.error('Ошибка настройки:', error);
        process.exit(1);
    });
}

module.exports = {
    checkTestFiles,
    checkDependencies,
    testApiConnection,
    formatFileSize
};