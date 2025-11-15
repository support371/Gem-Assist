/**
 * @file GEM Enterprise - AI-Powered Media Generation Server
 * @description Enterprise-grade Express.js backend for automated content creation. Handles image, video, TTS, chat, and voice call generation.
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.MEDIA_SERVER_PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'generated-assets', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}_${sanitized}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|wav|mp3/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, videos, and audio files are allowed.'));
        }
    }
});

/**
 * A logging utility for the media server.
 * @param {string} level - The log level (e.g., 'info', 'error').
 * @param {string} message - The log message.
 * @param {Object} [meta={}] - Additional metadata for the log entry.
 */
const log = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        service: 'media-server',
        ...meta
    };
    console.log(JSON.stringify(logEntry));
};

/**
 * Error handling middleware for the Express app.
 * @param {Error} error - The error object.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
const handleError = (error, req, res, next) => {
    log('error', error.message, { 
        stack: error.stack,
        endpoint: req.path,
        method: req.method 
    });
    
    res.status(error.status || 500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
    });
};

/**
 * Utility function to ensure a directory exists.
 * @param {string} dirPath - The path to the directory.
 */
const ensureDir = async (dirPath) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        log('error', `Failed to create directory: ${dirPath}`, { error: error.message });
        throw error;
    }
};

/**
 * Utility function to upload a file to AWS S3 (optional).
 * @param {string} filePath - The path to the file to upload.
 * @param {string} fileName - The name of the file.
 * @returns {Promise<string|null>} A promise that resolves to the S3 URL of the uploaded file, or null if S3 is not configured.
 */
const uploadToS3 = async (filePath, fileName) => {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        log('info', 'AWS credentials not configured, storing locally only');
        return null;
    }
    
    try {
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1'
        });
        
        const fileContent = await fs.readFile(filePath);
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `generated-media/${fileName}`,
            Body: fileContent,
            ContentType: 'application/octet-stream'
        };
        
        const result = await s3.upload(params).promise();
        log('info', 'File uploaded to S3', { fileName, location: result.Location });
        return result.Location;
    } catch (error) {
        log('error', 'S3 upload failed', { error: error.message, fileName });
        return null;
    }
};

/**
 * @route POST /api/media/image
 * @group Media Generation - Operations for generating media
 * @param {string} prompt.body.required - The prompt for image generation.
 * @param {string} size.body - The size of the generated image (e.g., '1024x1024').
 * @param {string} quality.body - The quality of the generated image (e.g., 'standard').
 * @param {string} style.body - The style of the generated image (e.g., 'vivid').
 * @returns {object} 200 - An object containing the details of the generated image.
 * @returns {Error}  500 - Unexpected error.
 */
app.post('/api/media/image', async (req, res) => {
    try {
        const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body;
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required for image generation'
            });
        }
        
        log('info', 'Starting image generation', { prompt, size, quality, style });
        
        // OpenAI DALL-E 3 integration
        if (process.env.OPENAI_API_KEY) {
            const openaiResponse = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    model: 'dall-e-3',
                    prompt: prompt,
                    size: size,
                    quality: quality,
                    style: style,
                    n: 1
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const imageUrl = openaiResponse.data.data[0].url;
            const revisedPrompt = openaiResponse.data.data[0].revised_prompt;
            
            // Download and save the image
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const fileName = `image_${Date.now()}.png`;
            const localPath = path.join(__dirname, 'generated-assets', 'images', fileName);
            
            await ensureDir(path.dirname(localPath));
            await fs.writeFile(localPath, imageResponse.data);
            
            // Optional S3 upload
            const s3Url = await uploadToS3(localPath, fileName);
            
            log('info', 'Image generated successfully', { fileName, prompt: revisedPrompt });
            
            res.json({
                success: true,
                data: {
                    fileName,
                    localPath: `/generated-assets/images/${fileName}`,
                    s3Url,
                    originalPrompt: prompt,
                    revisedPrompt,
                    timestamp: new Date().toISOString()
                }
            });
            
        } else {
            throw new Error('OpenAI API key not configured');
        }
        
    } catch (error) {
        log('error', 'Image generation failed', { error: error.message, prompt: req.body.prompt });
        res.status(500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message
        });
    }
});

/**
 * @route POST /api/media/video
 * @group Media Generation - Operations for generating media
 * @param {string} prompt.body.required - The prompt for video generation.
 * @param {number} duration.body - The duration of the video in seconds.
 * @param {number} width.body - The width of the video.
 * @param {number} height.body - The height of the video.
 * @returns {object} 200 - An object containing the details of the generated video.
 * @returns {Error}  500 - Unexpected error.
 */
app.post('/api/media/video', async (req, res) => {
    try {
        const { prompt, duration = 4, width = 1024, height = 576 } = req.body;
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required for video generation'
            });
        }
        
        log('info', 'Starting video generation', { prompt, duration, width, height });
        
        // Replicate API integration
        if (process.env.REPLICATE_API_TOKEN) {
            const replicateResponse = await axios.post(
                'https://api.replicate.com/v1/predictions',
                {
                    version: "009101d209a72e8e7e6bb1cd28e8be0ebd53d7c7f3968cb670b3e9ac8e7acc5b", // Stable Video Diffusion
                    input: {
                        cond_aug: 0.02,
                        decoding_t: 7,
                        video_length: duration,
                        sizing_strategy: "maintain_aspect_ratio",
                        prompt: prompt,
                        seed: Math.floor(Math.random() * 1000000)
                    }
                },
                {
                    headers: {
                        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const predictionId = replicateResponse.data.id;
            
            // Poll for completion
            let prediction;
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes timeout
            
            do {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                
                const statusResponse = await axios.get(
                    `https://api.replicate.com/v1/predictions/${predictionId}`,
                    {
                        headers: {
                            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
                        }
                    }
                );
                
                prediction = statusResponse.data;
                attempts++;
                
                log('info', 'Video generation status', { 
                    predictionId, 
                    status: prediction.status, 
                    attempt: attempts 
                });
                
            } while (prediction.status === 'starting' || prediction.status === 'processing' && attempts < maxAttempts);
            
            if (prediction.status === 'succeeded' && prediction.output) {
                // Download the video
                const videoUrl = prediction.output;
                const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
                const fileName = `video_${Date.now()}.mp4`;
                const localPath = path.join(__dirname, 'generated-assets', 'videos', fileName);
                
                await ensureDir(path.dirname(localPath));
                await fs.writeFile(localPath, videoResponse.data);
                
                // Optional S3 upload
                const s3Url = await uploadToS3(localPath, fileName);
                
                log('info', 'Video generated successfully', { fileName, prompt });
                
                res.json({
                    success: true,
                    data: {
                        fileName,
                        localPath: `/generated-assets/videos/${fileName}`,
                        s3Url,
                        prompt,
                        duration,
                        predictionId,
                        timestamp: new Date().toISOString()
                    }
                });
            } else {
                throw new Error(`Video generation failed with status: ${prediction.status}`);
            }
            
        } else {
            throw new Error('Replicate API token not configured');
        }
        
    } catch (error) {
        log('error', 'Video generation failed', { error: error.message, prompt: req.body.prompt });
        res.status(500).json({
            success: false,
            error: error.response?.data?.detail || error.message
        });
    }
});

/**
 * @route POST /api/media/tts
 * @group Media Generation - Operations for generating media
 * @param {string} text.body.required - The text to convert to speech.
 * @param {string} voice.body - The voice to use for the speech (e.g., 'Rachel').
 * @param {string} model.body - The model to use for the speech (e.g., 'eleven_monolingual_v1').
 * @returns {object} 200 - An object containing the details of the generated audio.
 * @returns {Error}  500 - Unexpected error.
 */
app.post('/api/media/tts', async (req, res) => {
    try {
        const { text, voice = 'Rachel', model = 'eleven_monolingual_v1' } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required for TTS generation'
            });
        }
        
        log('info', 'Starting TTS generation', { textLength: text.length, voice, model });
        
        // ElevenLabs integration
        if (process.env.ELEVENLABS_KEY) {
            const elevenLabsResponse = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
                {
                    text: text,
                    model_id: model,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                },
                {
                    headers: {
                        'xi-api-key': process.env.ELEVENLABS_KEY,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                }
            );
            
            const fileName = `tts_${Date.now()}.mp3`;
            const localPath = path.join(__dirname, 'generated-assets', 'audio', fileName);
            
            await ensureDir(path.dirname(localPath));
            await fs.writeFile(localPath, elevenLabsResponse.data);
            
            // Optional S3 upload
            const s3Url = await uploadToS3(localPath, fileName);
            
            log('info', 'TTS generated successfully', { fileName, textLength: text.length });
            
            res.json({
                success: true,
                data: {
                    fileName,
                    localPath: `/generated-assets/audio/${fileName}`,
                    s3Url,
                    text,
                    voice,
                    model,
                    timestamp: new Date().toISOString()
                }
            });
            
        } else {
            throw new Error('ElevenLabs API key not configured');
        }
        
    } catch (error) {
        log('error', 'TTS generation failed', { error: error.message, textLength: req.body.text?.length });
        res.status(500).json({
            success: false,
            error: error.response?.data?.detail?.message || error.message
        });
    }
});

/**
 * @route POST /api/media/chat
 * @group Media Generation - Operations for generating media
 * @param {string} message.body.required - The user's message.
 * @param {string} conversationId.body - The ID of the conversation.
 * @param {string} context.body - The context of the conversation (e.g., 'enterprise').
 * @returns {object} 200 - An object containing the AI's response.
 * @returns {Error}  500 - Unexpected error.
 */
app.post('/api/media/chat', async (req, res) => {
    try {
        const { message, conversationId = 'default', context = 'enterprise' } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required for chat'
            });
        }
        
        log('info', 'Processing chat message', { messageLength: message.length, conversationId, context });
        
        // Load conversation history
        const historyPath = path.join(__dirname, 'generated-assets', 'conversations', `${conversationId}.json`);
        let conversation = [];
        
        try {
            const historyData = await fs.readFile(historyPath, 'utf8');
            conversation = JSON.parse(historyData);
        } catch (error) {
            // New conversation
            conversation = [];
        }
        
        // Enterprise context prompt
        const systemPrompt = {
            role: 'system',
            content: `You are an AI assistant for GEM Enterprise, a professional security and trust services platform. 
            You provide expert guidance on cybersecurity, real estate services, legal documentation, and financial compliance. 
            Maintain a professional, knowledgeable tone while being helpful and accessible. 
            Focus on enterprise-grade solutions and regulatory compliance.`
        };
        
        // Add user message to conversation
        conversation.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
        
        // OpenAI Chat Completion
        if (process.env.OPENAI_API_KEY) {
            const messages = [systemPrompt, ...conversation.slice(-10)]; // Keep last 10 messages for context
            
            const openaiResponse = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4',
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.7,
                    presence_penalty: 0.1,
                    frequency_penalty: 0.1
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const response = openaiResponse.data.choices[0].message.content;
            
            // Add assistant response to conversation
            conversation.push({ 
                role: 'assistant', 
                content: response, 
                timestamp: new Date().toISOString() 
            });
            
            // Save conversation history
            await ensureDir(path.dirname(historyPath));
            await fs.writeFile(historyPath, JSON.stringify(conversation, null, 2));
            
            log('info', 'Chat response generated', { 
                conversationId, 
                responseLength: response.length,
                totalMessages: conversation.length 
            });
            
            res.json({
                success: true,
                data: {
                    response,
                    conversationId,
                    messageCount: conversation.length,
                    timestamp: new Date().toISOString()
                }
            });
            
        } else {
            throw new Error('OpenAI API key not configured');
        }
        
    } catch (error) {
        log('error', 'Chat processing failed', { error: error.message, conversationId: req.body.conversationId });
        res.status(500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message
        });
    }
});

/**
 * @route POST /api/media/call/place
 * @group Media Generation - Operations for generating media
 * @param {string} to.body.required - The phone number to call.
 * @param {string} message.body.required - The message to speak.
 * @param {string} voice.body - The voice to use for the call (e.g., 'alice').
 * @param {string} callbackUrl.body - The URL for status callbacks.
 * @returns {object} 200 - An object containing the details of the call.
 * @returns {Error}  500 - Unexpected error.
 */
app.post('/api/media/call/place', async (req, res) => {
    try {
        const { 
            to, 
            message, 
            voice = 'alice', 
            callbackUrl = process.env.TWILIO_CALLBACK_URL 
        } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and message are required'
            });
        }
        
        log('info', 'Placing voice call', { to, messageLength: message.length, voice });
        
        // Twilio integration
        if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
            const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
            
            // Create TwiML for the call
            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Say voice="${voice}">${message}</Say>
                    <Pause length="2"/>
                    <Say voice="${voice}">Thank you for using GEM Enterprise services. Goodbye.</Say>
                </Response>`;
            
            // Save TwiML for webhook
            const twimlFileName = `call_${Date.now()}.xml`;
            const twimlPath = path.join(__dirname, 'generated-assets', 'twiml', twimlFileName);
            await ensureDir(path.dirname(twimlPath));
            await fs.writeFile(twimlPath, twiml);
            
            // Place the call
            const call = await twilioClient.calls.create({
                to: to,
                from: process.env.TWILIO_PHONE,
                url: `${process.env.BASE_URL}/api/media/twiml/${twimlFileName}`,
                statusCallback: callbackUrl,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
            });
            
            log('info', 'Voice call initiated', { 
                callSid: call.sid, 
                to, 
                status: call.status 
            });
            
            res.json({
                success: true,
                data: {
                    callSid: call.sid,
                    status: call.status,
                    to,
                    message,
                    twimlFile: twimlFileName,
                    timestamp: new Date().toISOString()
                }
            });
            
        } else {
            throw new Error('Twilio credentials not configured');
        }
        
    } catch (error) {
        log('error', 'Voice call failed', { error: error.message, to: req.body.to });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route GET /api/media/twiml/:filename
 * @group Media Generation - Operations for generating media
 * @param {string} filename.path.required - The name of the TwiML file to serve.
 * @returns {string} 200 - The TwiML content.
 * @returns {Error}  404 - TwiML file not found.
 */
app.get('/api/media/twiml/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const twimlPath = path.join(__dirname, 'generated-assets', 'twiml', filename);
        
        const twimlContent = await fs.readFile(twimlPath, 'utf8');
        
        res.set('Content-Type', 'application/xml');
        res.send(twimlContent);
        
    } catch (error) {
        log('error', 'TwiML serving failed', { error: error.message, filename: req.params.filename });
        res.status(404).send('TwiML file not found');
    }
});

/**
 * @route GET /api/media/health
 * @group Health Check - Operations for checking the server's health
 * @returns {object} 200 - An object containing the server's health status.
 */
app.get('/api/media/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            openai: !!process.env.OPENAI_API_KEY,
            elevenlabs: !!process.env.ELEVENLABS_KEY,
            replicate: !!process.env.REPLICATE_API_TOKEN,
            twilio: !!(process.env.TWILIO_SID && process.env.TWILIO_TOKEN),
            aws: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
        }
    };
    
    res.json(health);
});

/**
 * Static file serving for generated assets.
 */
app.use('/generated-assets', express.static(path.join(__dirname, 'generated-assets')));

// Error handling middleware
app.use(handleError);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, () => {
    log('info', `GEM Enterprise Media Server started`, { 
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

module.exports = app;
