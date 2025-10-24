const socket = io("http://localhost:5000");
    const startBtn = document.getElementById("startBtn");
    const outputclass = document.querySelector(".output_class")
    const staticoutput = document.querySelector(".staticout")
    let audioContext, processor, input;

    startBtn.onclick = async () => {
      if (!audioContext) {
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
    let outputlength;
    socket.on('subtitle', (data) => {
        let output = document.createElement('p')
        // outputlength = data.text.length
        if(data.text.length > output.innerText.length){
            output.textContent = data.text || "...";
            outputclass.appendChild(output)
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