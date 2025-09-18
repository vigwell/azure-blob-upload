// Загружаем переменные окружения
require('dotenv').config();

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Конфигурация из переменных окружения
const CONFIG = {
    IS_DEBUG: process.env.IS_DEBUG === 'true',
    DEBUG_URL: process.env.DEBUG_URL || 'https://localhost:7000/api',
    REAL_URL: process.env.REAL_URL || 'https://api.production.com/api',
    CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE) || 4 * 1024 * 1024, // 4MB
    REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
    COMPANY_ID: process.env.COMPANY_ID || '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    SESSION_ID: process.env.SESSION_ID || '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    OVERLAY_TEXT: process.env.OVERLAY_TEXT || 'Processing Video...',
    STREAM_ID: 'stream-' + Date.now()
};

// Выбираем URL в зависимости от режима
CONFIG.API_BASE_URL = CONFIG.IS_DEBUG ? CONFIG.DEBUG_URL : CONFIG.REAL_URL;

// Пути к файлам (поместите ваши .webm файлы в эту папку)
const FILES = {
    VIDEO: './sample_video.webm',
    AUDIO: './sample_audio.webm'
};

/**
 * Класс для загрузки файлов по частям в Azure Blob Storage
 */
class ChunkedUploader {
    constructor(sasUrl, fileName, chunkSize = CONFIG.CHUNK_SIZE) {
        this.sasUrl = sasUrl;
        this.fileName = fileName;
        this.chunkSize = chunkSize;
        this.blockIds = [];
    }

    /**
     * Загружает файл по частям
     */
    async uploadFile(filePath) {
        console.log(`📤 Начинаем загрузку ${this.fileName}...`);
        
        const fileStats = fs.statSync(filePath);
        const fileSize = fileStats.size;
        const totalChunks = Math.ceil(fileSize / this.chunkSize);
        
        console.log(`📊 Файл: ${fileSize} байт, ${totalChunks} частей`);

        // Создаем массив промисов для параллельной загрузки
        const uploadPromises = [];
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.chunkSize;
            const end = Math.min(start + this.chunkSize, fileSize);
            
            const blockId = this.generateBlockId(i);
            this.blockIds.push(blockId);
            
            const uploadPromise = this.uploadChunk(filePath, start, end, blockId, i + 1, totalChunks);
            uploadPromises.push(uploadPromise);
        }

        // Загружаем все части параллельно
        console.log(`🚀 Загружаем ${totalChunks} частей параллельно...`);
        await Promise.all(uploadPromises);
        
        // Объединяем все части
        console.log(`🔗 Объединяем части ${this.fileName}...`);
        await this.commitBlockList();
        
        console.log(`✅ ${this.fileName} успешно загружен!`);
        return this.sasUrl.split('?')[0]; // Возвращаем URL без SAS параметров
    }

    /**
     * Генерирует уникальный Block ID
     */
    generateBlockId(index) {
        const blockIdString = `block-${index.toString().padStart(6, '0')}`;
        return Buffer.from(blockIdString).toString('base64');
    }

    /**
     * Загружает один чанк файла
     */
    async uploadChunk(filePath, start, end, blockId, chunkNum, totalChunks) {
        const url = `${this.sasUrl}&comp=block&blockid=${encodeURIComponent(blockId)}`;
        
        try {
            // Читаем часть файла
            const buffer = Buffer.alloc(end - start);
            const fd = fs.openSync(filePath, 'r');
            fs.readSync(fd, buffer, 0, end - start, start);
            fs.closeSync(fd);

            // Отправляем PUT запрос
            const response = await axios.put(url, buffer, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'x-ms-blob-type': 'BlockBlob'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            if (response.status === 201) {
                process.stdout.write(`\r📦 ${this.fileName}: ${chunkNum}/${totalChunks} частей загружено`);
                return true;
            } else {
                throw new Error(`Неожиданный статус ответа: ${response.status}`);
            }

        } catch (error) {
            console.error(`\n❌ Ошибка загрузки части ${chunkNum}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Объединяет все загруженные блоки в финальный файл
     */
    async commitBlockList() {
        const url = `${this.sasUrl}&comp=blocklist`;
        
        // Создаем XML со списком блоков
        const blockListXml = `<?xml version="1.0" encoding="utf-8"?>
<BlockList>
${this.blockIds.map(id => `    <Latest>${id}</Latest>`).join('\n')}
</BlockList>`;

        try {
            const response = await axios.put(url, blockListXml, {
                headers: {
                    'Content-Type': 'application/xml'
                }
            });

            if (response.status !== 201) {
                throw new Error(`Ошибка объединения блоков: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            console.error(`❌ Ошибка объединения блоков: ${error.message}`);
            throw error;
        }
    }
}

/**
 * Завершает процесс загрузки и запускает обработку
 */
async function finalizeUpload(streamId, blobPrefix, overlayText = 'Processing...') {
    console.log('🏁 Завершаем загрузку и запускаем обработку...');
    
    const requestData = {
        streamId: streamId,
        blobPrefix: blobPrefix,
        outputFileName: `final_${streamId}.mp4`,
        overlayText: overlayText
    };

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
            requestData,
            axiosConfig
        );

        if (response.status === 200) {
            console.log('✅ Задача обработки запущена успешно');
            console.log(`🎬 Выходной файл: ${requestData.outputFileName}`);
            console.log(`📝 Текст наложения: ${requestData.overlayText}`);
            
            if (CONFIG.IS_DEBUG) {
                console.log('🔍 DEBUG: Ответ finalize API:', JSON.stringify(response.data, null, 2));
            }
            
            return response.data;
        } else {
            throw new Error(`Неожиданный статус ответа: ${response.status}`);
        }

    } catch (error) {
        console.error('❌ Ошибка завершения загрузки:');
        console.error(`   URL: ${CONFIG.API_BASE_URL}/Video/finalize`);
        console.error(`   Сообщение: ${error.message}`);
        
        if (error.response) {
            console.error(`   Статус: ${error.response.status}`);
            if (CONFIG.IS_DEBUG) {
                console.error(`   Данные: ${JSON.stringify(error.response.data, null, 2)}`);
            }
        }
        
        throw error;
    }
}

/**
 * Получает SAS токены от API
 */
async function getSasTokens() {
    console.log(`🔑 Получаем SAS токены... (${CONFIG.IS_DEBUG ? 'DEBUG' : 'PRODUCTION'} режим)`);
    console.log(`🌐 API URL: ${CONFIG.API_BASE_URL}`);
    
    const requestData = {
        companyIdFromUserToken: CONFIG.COMPANY_ID,
        sessionId: CONFIG.SESSION_ID,
        streamId: CONFIG.STREAM_ID
    };

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
            `${CONFIG.API_BASE_URL}/Video/sas`,
            requestData,
            axiosConfig
        );

        if (response.data.success) {
            console.log('✅ SAS токены получены успешно');
            console.log(`📁 Префикс блоба: ${response.data.payload.blobPrefix}`);
            
            if (CONFIG.IS_DEBUG) {
                console.log('🔍 DEBUG: SAS URLs получены (скрыты в production)');
            }
            
            return response.data.payload;
        } else {
            throw new Error('API вернул success: false');
        }

    } catch (error) {
        console.error('❌ Ошибка получения SAS токенов:');
        console.error(`   Режим: ${CONFIG.IS_DEBUG ? 'DEBUG' : 'PRODUCTION'}`);
        console.error(`   URL: ${CONFIG.API_BASE_URL}/Video/sas`);
        console.error(`   Сообщение: ${error.message}`);
        
        if (error.response) {
            console.error(`   Статус: ${error.response.status}`);
            if (CONFIG.IS_DEBUG) {
                console.error(`   Данные: ${JSON.stringify(error.response.data, null, 2)}`);
            }
        }
        
        throw error;
    }
}

/**
 * Проверяет существование файлов
 */
function checkFiles() {
    const missingFiles = [];
    
    if (!fs.existsSync(FILES.VIDEO)) {
        missingFiles.push(FILES.VIDEO);
    }
    
    if (!fs.existsSync(FILES.AUDIO)) {
        missingFiles.push(FILES.AUDIO);
    }
    
    if (missingFiles.length > 0) {
        console.error('❌ Не найдены файлы:');
        missingFiles.forEach(file => console.error(`   ${file}`));
        console.error('\n💡 Поместите файлы sample_video.webm и sample_audio.webm в корневую папку проекта');
        process.exit(1);
    }
    
    // Показываем информацию о файлах
    const videoStats = fs.statSync(FILES.VIDEO);
    const audioStats = fs.statSync(FILES.AUDIO);
    
    console.log('📁 Найдены файлы:');
    console.log(`   ${FILES.VIDEO} (${formatFileSize(videoStats.size)})`);
    console.log(`   ${FILES.AUDIO} (${formatFileSize(audioStats.size)})`);
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
 * Главная функция
 */
async function main() {
    console.log('🎬 Azure Blob Storage Chunked Upload');
    console.log('=====================================');
    
    // Показываем текущую конфигурацию
    console.log(`⚙️  Режим: ${CONFIG.IS_DEBUG ? '🔧 DEBUG' : '🏭 PRODUCTION'}`);
    console.log(`🌐 API URL: ${CONFIG.API_BASE_URL}`);
    console.log(`📦 Размер части: ${formatFileSize(CONFIG.CHUNK_SIZE)}`);
    console.log(`⏱️  Таймаут: ${CONFIG.REQUEST_TIMEOUT}ms`);
    console.log('');
    
    try {
        // Проверяем файлы
        checkFiles();
        
        // Получаем SAS токены
        const sasData = await getSasTokens();
        
        console.log('\n🚀 Начинаем параллельную загрузку файлов...');
        
        // Создаем загрузчики
        const videoUploader = new ChunkedUploader(sasData.videoSasUrl, 'video.webm');
        const audioUploader = new ChunkedUploader(sasData.audioSasUrl, 'audio.webm');
        
        // Загружаем файлы параллельно
        const startTime = Date.now();
        
        const [videoUrl, audioUrl] = await Promise.all([
            videoUploader.uploadFile(FILES.VIDEO),
            audioUploader.uploadFile(FILES.AUDIO)
        ]);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('\n\n🎉 Загрузка завершена!');
        console.log('=====================');
        console.log(`⏱️  Время загрузки: ${duration} секунд`);
        console.log(`📹 Видео URL: ${videoUrl}`);
        console.log(`🎵 Аудио URL: ${audioUrl}`);
        console.log(`📂 Префикс: ${sasData.blobPrefix}`);
        console.log(`🔧 Режим: ${CONFIG.IS_DEBUG ? 'DEBUG' : 'PRODUCTION'}`);
        
        // Вызываем finalize для запуска обработки
        console.log('\n🎬 Запуск обработки FFmpeg...');
        const overlayText = CONFIG.OVERLAY_TEXT || `Patient ID: ${CONFIG.SESSION_ID.substring(0, 8)}`;
        
        await finalizeUpload(CONFIG.STREAM_ID, sasData.blobPrefix, overlayText);
        
        console.log('\n✨ Процесс завершен! Файлы переданы на обработку.');
        console.log('📺 FFmpeg worker начнет обработку в ближайшее время.');
        
        console.log('\nready');
        
    } catch (error) {
        console.error('\n💥 Критическая ошибка:');
        console.error(error.message);
        
        if (CONFIG.IS_DEBUG) {
            console.error('\n🔍 DEBUG информация:');
            console.error(`   Стек ошибки: ${error.stack}`);
        }
        
        if (error.code === 'ENOTFOUND') {
            console.error('\n💡 Проверьте:');
            console.error(`   - Запущен ли API сервер на ${CONFIG.API_BASE_URL}`);
            console.error('   - Правильность URL в .env файле');
            console.error(`   - Текущий режим: ${CONFIG.IS_DEBUG ? 'DEBUG' : 'PRODUCTION'}`);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 API сервер недоступен. Убедитесь что он запущен.');
            console.error(`   URL: ${CONFIG.API_BASE_URL}`);
        }
        
        process.exit(1);
    }
}

// Запускаем программу
if (require.main === module) {
    main().catch(error => {
        console.error('Необработанная ошибка:', error);
        process.exit(1);
    });
}