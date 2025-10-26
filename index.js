const socket = io("http://localhost:5000");
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const output = document.getElementById("output");
    const outputclass = document.querySelector(".output_class")
    const staticoutput = document.querySelector(".staticout")
    let audioContext, processor, input;
    let lastSubtitle = "";

    startBtn.onclick = async () => {
      if (!audioContext) {
        // Clear previous subtitles
        outputclass.innerHTML = "";
        lastSubtitle = "";
        audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 16000});
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        input = audioContext.createMediaStreamSource(stream);
        processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          const float32Array = e.inputBuffer.getChannelData(0);
          const int16Array = floatTo16BitPCM(float32Array);
          const base64Data = arrayBufferToBase64(int16Array.buffer);
          socket.emit('audio_chunk', base64Data);
        };

        input.connect(processor);
        processor.connect(audioContext.destination);
        output.textContent = "🎙 Listening...";
      }
    };

    stopBtn.onclick = () => {
      if (audioContext) {
        audioContext.close();
        audioContext = null;
        processor = null;
        input = null;
        output.textContent = "Stopped.";
      }
    };

    socket.on('subtitle', (data) => {
        if (data.text && data.text !== lastSubtitle && data.text.trim() !== "") {
            lastSubtitle = data.text;
            let output = document.createElement('p');
            output.textContent = data.text;
            outputclass.appendChild(output);
        }
    });

    function floatTo16BitPCM(float32Array) {
      const buffer = new ArrayBuffer(float32Array.length * 2);
      const view = new DataView(buffer);
      let offset = 0;
      for (let i = 0; i < float32Array.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
      return new Int16Array(buffer);
    }

    function arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    }