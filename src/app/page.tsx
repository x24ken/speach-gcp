"use client";

import React, { useState, useRef } from "react";

export default function Home() {
  const [transcript, setTranscript] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audioBuffer: audioBase64 }),
      });

      const data = await response.json();
      setTranscript(data.transcript);
    };
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">音声認識デモ</h1>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        onClick={startRecording}
      >
        録音開始
      </button>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded"
        onClick={stopRecording}
      >
        録音停止
      </button>
      <h2 className="mt-4 text-xl font-semibold">文字起こし結果</h2>
      <p className="mt-2 p-4 border rounded">{transcript}</p>
    </div>
  );
}
