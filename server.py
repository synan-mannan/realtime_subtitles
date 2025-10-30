from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from vosk import Model, KaldiRecognizer
import json
import logging
import os

# Completely suppress Vosk logging
os.environ['VOSK_LOG_LEVEL'] = '0'
logging.getLogger('vosk').setLevel(logging.ERROR)
logging.getLogger('kaldi').setLevel(logging.ERROR)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables for model and recognizer
model = None
rec = None

def load_model(language):
    global model, rec
    if language == "english":
        model_path = "model-en"
    elif language == "hindi":
        model_path = "vosk-model-small-hi-0.22"
    else:
        model_path = "model-en"  # default to English
    model = Model(model_path)
    rec = KaldiRecognizer(model, 16000)

@socketio.on('start_recording')
def handle_start(data):
    language = data.get('language', 'english')
    load_model(language)
    emit('recording_started', {'status': 'started'})

@socketio.on('audio_chunk')
def handle_audio(data):
    """Receive raw audio chunk (base64 from frontend)"""
    import base64
    audio_bytes = base64.b64decode(data)

    if rec and rec.AcceptWaveform(audio_bytes):
        result = json.loads(rec.Result())
        text = result.get("text", "")
        emit('subtitle', {'text': text})
    # else:
    #     partial = json.loads(rec.PartialResult())
    #     emit('subtitle', {'text': partial.get("partial", "")})

@app.route('/')
def index():
    return "Speech-to-Text server is running."



if __name__ == '__main__':
    print("🚀 Server running on http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000)
