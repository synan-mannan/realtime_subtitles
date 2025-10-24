from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from vosk import Model, KaldiRecognizer
import json

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Load Vosk model
model = Model("model-en")
rec = KaldiRecognizer(model, 16000)

@socketio.on('audio_chunk')
def handle_audio(data):
    """Receive raw audio chunk (base64 from frontend)"""
    import base64
    audio_bytes = base64.b64decode(data)

    if rec.AcceptWaveform(audio_bytes):
        result = json.loads(rec.Result())
        text = result.get("text", "")
        emit('subtitle', {'text': text})
    else:
        partial = json.loads(rec.PartialResult())
        emit('subtitle', {'text': partial.get("partial", "")})

@app.route('/')
def index():
    return "Speech-to-Text server is running."

if __name__ == '__main__':
    print("🚀 Server running on http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000)
