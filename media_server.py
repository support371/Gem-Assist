
"""
GEM Enterprise - AI-Powered Media Generation Server
Enterprise-grade endpoints for image, video, TTS, chat, and call generation
"""

import os
import json
import logging
import requests
import base64
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import boto3
from botocore.exceptions import ClientError
import openai
from twilio.rest import Client as TwilioClient
from twilio.twiml import VoiceResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint for media endpoints
media_bp = Blueprint('media', __name__, url_prefix='/api/media')

# Environment variables
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
ELEVENLABS_KEY = os.environ.get('ELEVENLABS_KEY')
REPLICATE_API_TOKEN = os.environ.get('REPLICATE_API_TOKEN')
TWILIO_SID = os.environ.get('TWILIO_SID')
TWILIO_TOKEN = os.environ.get('TWILIO_TOKEN')
TWILIO_PHONE = os.environ.get('TWILIO_PHONE')
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize clients
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

if TWILIO_SID and TWILIO_TOKEN:
    twilio_client = TwilioClient(TWILIO_SID, TWILIO_TOKEN)

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
else:
    s3_client = None

# Ensure generated assets directory exists
GENERATED_ASSETS_DIR = 'static/generated-assets'
os.makedirs(GENERATED_ASSETS_DIR, exist_ok=True)

def upload_to_s3(file_data, filename, content_type='image/png'):
    """Upload file to S3 if configured, otherwise save locally"""
    try:
        if s3_client and AWS_BUCKET_NAME:
            # Upload to S3
            s3_client.put_object(
                Bucket=AWS_BUCKET_NAME,
                Key=f"generated/{filename}",
                Body=file_data,
                ContentType=content_type,
                ACL='public-read'
            )
            url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/generated/{filename}"
            logger.info(f"File uploaded to S3: {url}")
            return url
        else:
            # Save locally
            local_path = os.path.join(GENERATED_ASSETS_DIR, filename)
            with open(local_path, 'wb') as f:
                f.write(file_data)
            url = f"/static/generated-assets/{filename}"
            logger.info(f"File saved locally: {local_path}")
            return url
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        # Fallback to local save
        local_path = os.path.join(GENERATED_ASSETS_DIR, filename)
        with open(local_path, 'wb') as f:
            f.write(file_data)
        return f"/static/generated-assets/{filename}"

def generate_html_snippet(asset_type, url, metadata):
    """Generate HTML snippet for the created asset"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    snippet_filename = f"{asset_type}_{timestamp}.html"
    snippet_path = os.path.join(GENERATED_ASSETS_DIR, snippet_filename)
    
    if asset_type == 'image':
        html_content = f'''<!-- Generated Image - {metadata.get('prompt', 'No prompt')} -->
<div class="generated-image-container">
    <img src="{url}" 
         alt="{metadata.get('prompt', 'Generated image')}" 
         class="img-fluid rounded shadow"
         style="max-width: 100%; height: auto;">
    <div class="image-metadata mt-2">
        <small class="text-muted">
            Style: {metadata.get('style', 'default')} | 
            Size: {metadata.get('size', 'default')} | 
            Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
        </small>
    </div>
</div>'''
    
    elif asset_type == 'video':
        html_content = f'''<!-- Generated Video - {metadata.get('prompt', 'No prompt')} -->
<div class="generated-video-container">
    <video controls class="video-fluid rounded shadow" style="max-width: 100%;">
        <source src="{url}" type="video/mp4">
        Your browser does not support the video tag.
    </video>
    <div class="video-metadata mt-2">
        <small class="text-muted">
            Prompt: {metadata.get('prompt', 'No prompt')} | 
            Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
        </small>
    </div>
</div>'''
    
    elif asset_type == 'audio':
        html_content = f'''<!-- Generated Audio - {metadata.get('text', 'No text')} -->
<div class="generated-audio-container">
    <audio controls class="audio-fluid" style="width: 100%;">
        <source src="{url}" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>
    <div class="audio-metadata mt-2">
        <small class="text-muted">
            Text: "{metadata.get('text', 'No text')}" | 
            Voice: {metadata.get('voice', 'default')} | 
            Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
        </small>
    </div>
</div>'''
    
    # Write snippet file
    with open(snippet_path, 'w') as f:
        f.write(html_content)
    
    return snippet_filename

@media_bp.route('/image', methods=['POST'])
def generate_image():
    """Generate image using OpenAI DALL-E"""
    try:
        if not OPENAI_API_KEY:
            return jsonify({'error': 'OpenAI API key not configured'}), 500
        
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        style = data.get('style', 'natural')
        size = data.get('size', '1024x1024')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        logger.info(f"Generating image with prompt: {prompt}")
        
        # Enhance prompt based on style
        style_prompts = {
            'photorealistic': f"photorealistic, high resolution, professional photography, {prompt}",
            'artistic': f"artistic, creative, beautiful art style, {prompt}",
            'corporate': f"professional, business, corporate style, clean, {prompt}",
            'cybersecurity': f"cybersecurity themed, high-tech, digital, secure, {prompt}",
            'natural': prompt
        }
        
        enhanced_prompt = style_prompts.get(style, prompt)
        
        # Generate image with OpenAI
        response = openai.Image.create(
            prompt=enhanced_prompt,
            n=1,
            size=size,
            response_format="b64_json"
        )
        
        # Get base64 image data
        image_data = base64.b64decode(response['data'][0]['b64_json'])
        
        # Create filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"image_{timestamp}.png"
        
        # Upload to S3 or save locally
        url = upload_to_s3(image_data, filename, 'image/png')
        
        # Generate HTML snippet
        metadata = {'prompt': prompt, 'style': style, 'size': size}
        snippet_filename = generate_html_snippet('image', url, metadata)
        
        logger.info(f"Image generated successfully: {url}")
        
        return jsonify({
            'success': True,
            'url': url,
            'snippet_path': f"/static/generated-assets/{snippet_filename}",
            'metadata': metadata
        })
        
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        return jsonify({'error': f'Failed to generate image: {str(e)}'}), 500

@media_bp.route('/video', methods=['POST'])
def generate_video():
    """Generate video using Replicate (Runway Gen-2)"""
    try:
        if not REPLICATE_API_TOKEN:
            return jsonify({'error': 'Replicate API token not configured'}), 500
        
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        duration = data.get('duration', 3)  # seconds
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        logger.info(f"Generating video with prompt: {prompt}")
        
        # Call Replicate API for video generation
        headers = {
            'Authorization': f'Token {REPLICATE_API_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "version": "028c75e7-4001-43d5-8e4f-5f56b3c6b1e8",  # Runway Gen-2 model
            "input": {
                "prompt": prompt,
                "duration": duration,
                "seed": -1
            }
        }
        
        response = requests.post(
            'https://api.replicate.com/v1/predictions',
            headers=headers,
            json=payload
        )
        
        if response.status_code != 201:
            return jsonify({'error': 'Failed to start video generation'}), 500
        
        prediction = response.json()
        prediction_id = prediction['id']
        
        # Note: In production, you'd implement polling or webhooks
        # For now, return the prediction ID for status checking
        logger.info(f"Video generation started: {prediction_id}")
        
        return jsonify({
            'success': True,
            'prediction_id': prediction_id,
            'status': 'processing',
            'message': 'Video generation started. Check status with /api/media/video/status/<prediction_id>'
        })
        
    except Exception as e:
        logger.error(f"Error generating video: {str(e)}")
        return jsonify({'error': f'Failed to generate video: {str(e)}'}), 500

@media_bp.route('/video/status/<prediction_id>')
def check_video_status(prediction_id):
    """Check video generation status"""
    try:
        if not REPLICATE_API_TOKEN:
            return jsonify({'error': 'Replicate API token not configured'}), 500
        
        headers = {
            'Authorization': f'Token {REPLICATE_API_TOKEN}'
        }
        
        response = requests.get(
            f'https://api.replicate.com/v1/predictions/{prediction_id}',
            headers=headers
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to check video status'}), 500
        
        prediction = response.json()
        status = prediction['status']
        
        if status == 'succeeded' and prediction.get('output'):
            video_url = prediction['output'][0] if isinstance(prediction['output'], list) else prediction['output']
            
            # Download and save video
            video_response = requests.get(video_url)
            if video_response.status_code == 200:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"video_{timestamp}.mp4"
                
                # Upload to S3 or save locally
                url = upload_to_s3(video_response.content, filename, 'video/mp4')
                
                # Generate HTML snippet
                metadata = {'prompt': prediction.get('input', {}).get('prompt', 'No prompt')}
                snippet_filename = generate_html_snippet('video', url, metadata)
                
                return jsonify({
                    'success': True,
                    'status': 'completed',
                    'url': url,
                    'snippet_path': f"/static/generated-assets/{snippet_filename}",
                    'metadata': metadata
                })
        
        return jsonify({
            'success': True,
            'status': status,
            'progress': prediction.get('progress', 0)
        })
        
    except Exception as e:
        logger.error(f"Error checking video status: {str(e)}")
        return jsonify({'error': f'Failed to check video status: {str(e)}'}), 500

@media_bp.route('/tts', methods=['POST'])
def text_to_speech():
    """Generate speech using ElevenLabs or Amazon Polly"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        voice = data.get('voice', 'default')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        logger.info(f"Generating TTS for text: {text[:50]}...")
        
        # Try ElevenLabs first, then fallback to Polly
        if ELEVENLABS_KEY:
            audio_data = generate_elevenlabs_tts(text, voice)
        else:
            audio_data = generate_polly_tts(text, voice)
        
        if not audio_data:
            return jsonify({'error': 'Failed to generate speech'}), 500
        
        # Create filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"tts_{timestamp}.mp3"
        
        # Upload to S3 or save locally
        url = upload_to_s3(audio_data, filename, 'audio/mpeg')
        
        # Generate HTML snippet
        metadata = {'text': text, 'voice': voice}
        snippet_filename = generate_html_snippet('audio', url, metadata)
        
        logger.info(f"TTS generated successfully: {url}")
        
        return jsonify({
            'success': True,
            'url': url,
            'snippet_path': f"/static/generated-assets/{snippet_filename}",
            'metadata': metadata
        })
        
    except Exception as e:
        logger.error(f"Error generating TTS: {str(e)}")
        return jsonify({'error': f'Failed to generate TTS: {str(e)}'}), 500

def generate_elevenlabs_tts(text, voice):
    """Generate TTS using ElevenLabs"""
    try:
        voice_map = {
            'default': 'pNInz6obpgDQGcFmaJgB',  # Adam
            'female': 'EXAVITQu4vr4xnSDxMaL',  # Bella
            'male': 'pNInz6obpgDQGcFmaJgB',    # Adam
            'professional': 'EXAVITQu4vr4xnSDxMaL'  # Bella
        }
        
        voice_id = voice_map.get(voice, voice_map['default'])
        
        headers = {
            'xi-api-key': ELEVENLABS_KEY,
            'Content-Type': 'application/json'
        }
        
        payload = {
            'text': text,
            'voice_settings': {
                'stability': 0.75,
                'similarity_boost': 0.75
            }
        }
        
        response = requests.post(
            f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}',
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            return response.content
        else:
            logger.error(f"ElevenLabs API error: {response.status_code}")
            return None
            
    except Exception as e:
        logger.error(f"Error with ElevenLabs TTS: {str(e)}")
        return None

def generate_polly_tts(text, voice):
    """Generate TTS using Amazon Polly (fallback)"""
    try:
        if not (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY):
            return None
        
        polly_client = boto3.client(
            'polly',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        voice_map = {
            'default': 'Joanna',
            'female': 'Joanna',
            'male': 'Matthew',
            'professional': 'Salli'
        }
        
        voice_id = voice_map.get(voice, 'Joanna')
        
        response = polly_client.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId=voice_id
        )
        
        return response['AudioStream'].read()
        
    except Exception as e:
        logger.error(f"Error with Polly TTS: {str(e)}")
        return None

@media_bp.route('/chat', methods=['POST'])
def ai_chat():
    """Humanized AI chat with short-term memory"""
    try:
        if not OPENAI_API_KEY:
            return jsonify({'error': 'OpenAI API key not configured'}), 500
        
        data = request.get_json()
        message = data.get('message', '').strip()
        session_id = data.get('session_id', 'default')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Simple memory storage (in production, use Redis or database)
        if not hasattr(current_app, 'chat_sessions'):
            current_app.chat_sessions = {}
        
        if session_id not in current_app.chat_sessions:
            current_app.chat_sessions[session_id] = []
        
        # Add user message to session
        current_app.chat_sessions[session_id].append({"role": "user", "content": message})
        
        # Keep only last 10 messages for context
        if len(current_app.chat_sessions[session_id]) > 10:
            current_app.chat_sessions[session_id] = current_app.chat_sessions[session_id][-10:]
        
        # System prompt for GEM Enterprise brand
        system_prompt = {
            "role": "system",
            "content": """You are a professional AI assistant for GEM Assist Enterprise, a cybersecurity and real estate services company. 
            You provide helpful, accurate information about our services including:
            - 24/7 threat monitoring and cybersecurity
            - Real estate investment and management
            - Asset recovery services
            - Telegram automation solutions
            - Legal and trust services
            
            Maintain a professional, knowledgeable tone while being approachable and helpful."""
        }
        
        messages = [system_prompt] + current_app.chat_sessions[session_id]
        
        # Generate response
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Add AI response to session
        current_app.chat_sessions[session_id].append({"role": "assistant", "content": ai_response})
        
        logger.info(f"Chat response generated for session: {session_id}")
        
        return jsonify({
            'success': True,
            'response': ai_response,
            'session_id': session_id
        })
        
    except Exception as e:
        logger.error(f"Error in AI chat: {str(e)}")
        return jsonify({'error': f'Failed to generate chat response: {str(e)}'}), 500

@media_bp.route('/call/place', methods=['POST'])
def place_call():
    """Place humanized call using Twilio with TTS"""
    try:
        if not (TWILIO_SID and TWILIO_TOKEN and TWILIO_PHONE):
            return jsonify({'error': 'Twilio credentials not configured'}), 500
        
        data = request.get_json()
        to_number = data.get('to_number', '').strip()
        message = data.get('message', '').strip()
        voice = data.get('voice', 'default')
        
        if not to_number or not message:
            return jsonify({'error': 'Phone number and message are required'}), 400
        
        logger.info(f"Placing call to {to_number}")
        
        # Create TwiML response for the call
        twiml_url = f"{request.url_root}api/media/call/twiml"
        
        # Store message for TwiML endpoint
        if not hasattr(current_app, 'call_messages'):
            current_app.call_messages = {}
        
        call_id = f"{to_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        current_app.call_messages[call_id] = message
        
        # Place call using Twilio
        call = twilio_client.calls.create(
            to=to_number,
            from_=TWILIO_PHONE,
            url=f"{twiml_url}?call_id={call_id}",
            method='GET'
        )
        
        logger.info(f"Call placed successfully: {call.sid}")
        
        return jsonify({
            'success': True,
            'call_sid': call.sid,
            'status': call.status,
            'to_number': to_number
        })
        
    except Exception as e:
        logger.error(f"Error placing call: {str(e)}")
        return jsonify({'error': f'Failed to place call: {str(e)}'}), 500

@media_bp.route('/call/twiml')
def call_twiml():
    """Generate TwiML for Twilio call"""
    try:
        call_id = request.args.get('call_id')
        
        if call_id and hasattr(current_app, 'call_messages'):
            message = current_app.call_messages.get(call_id, 'Hello from GEM Enterprise.')
        else:
            message = 'Hello from GEM Enterprise.'
        
        # Create TwiML response
        response = VoiceResponse()
        response.say(message, voice='alice', language='en-US')
        response.hangup()
        
        return str(response), 200, {'Content-Type': 'text/xml'}
        
    except Exception as e:
        logger.error(f"Error generating TwiML: {str(e)}")
        response = VoiceResponse()
        response.say('Sorry, there was an error processing your call.')
        response.hangup()
        return str(response), 200, {'Content-Type': 'text/xml'}

# Health check endpoint
@media_bp.route('/health')
def health_check():
    """Health check for media services"""
    services_status = {
        'openai': bool(OPENAI_API_KEY),
        'elevenlabs': bool(ELEVENLABS_KEY),
        'replicate': bool(REPLICATE_API_TOKEN),
        'twilio': bool(TWILIO_SID and TWILIO_TOKEN),
        's3': bool(s3_client and AWS_BUCKET_NAME)
    }
    
    return jsonify({
        'status': 'healthy',
        'services': services_status,
        'timestamp': datetime.now().isoformat()
    })
