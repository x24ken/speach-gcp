"use client";

import React, { useState, useRef, useEffect } from "react";

export default function Home() {
  const [transcript, setTranscript] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    setIsRecording(true);
    setRecordingTime(0); // タイムリセット
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

    // 1秒ごとにrecordingTimeを更新
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);

    // 10秒後に録音を自動停止
    recordingTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, 10000); // 10秒
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    setIsRecording(false);
    mediaRecorderRef.current.stop();
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    mediaRecorderRef.current.onstop = async () => {
      setIsTranscribing(true);
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
      setIsTranscribing(false);
    };
  };

  useEffect(() => {
    // コンポーネントがアンマウントされるときにタイマーをクリーンアップ
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">音声認識デモ</h1>
      <div className="mb-4">
        {isRecording ? (
          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={stopRecording}
          >
            録音停止
          </button>
        ) : (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
            onClick={startRecording}
          >
            録音開始
          </button>
        )}
      </div>
      {isRecording && (
        <div className="mb-4">
          <p className="text-red-600">録音中...（{recordingTime}秒経過）</p>
          <div className="relative">
            <div className="w-full h-4 bg-gray-300 rounded-full">
              <div
                className="h-4 bg-green-500 rounded-full"
                style={{ width: `${(recordingTime / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      {isTranscribing && <p className="text-yellow-600">文字起こし中...</p>}
      <h2 className="mt-4 text-xl font-semibold">文字起こし結果</h2>
      <p className="mt-2 p-4 border rounded">{transcript}</p>
    </div>
  );
}
