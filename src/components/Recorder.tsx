"use client";

import React, { useState, useRef, useEffect } from "react";

type RecorderProps = {
  onTranscribe: (transcript: string, error: string | null) => void;
  setIsTranscribing: (isTranscribing: boolean) => void;
};

const Recorder: React.FC<RecorderProps> = ({
  onTranscribe,
  setIsTranscribing,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    setIsRecording(true);
    setRecordingTime(0); // タイムリセット
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
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
    if (!mediaRecorderRef.current || !streamRef.current) return;

    setIsRecording(false);
    mediaRecorderRef.current.stop();
    streamRef.current.getTracks().forEach((track) => track.stop()); // Stop all tracks

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

      if (!response.ok) {
        onTranscribe("", data.error || "An unknown error occurred.");
        setIsTranscribing(false);
        return;
      }

      onTranscribe(data.transcript, null);
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
      // コンポーネントがアンマウントされる際にストリームを停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
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
      {isRecording && (
        <div className="mt-4">
          <p className="text-red-600">録音中...（{recordingTime}秒経過）</p>
          <Progress recordingTime={recordingTime} />
        </div>
      )}
    </div>
  );
};

type ProgressProps = {
  recordingTime: number;
};

const Progress: React.FC<ProgressProps> = ({ recordingTime }) => (
  <div className="relative">
    <div className="w-full h-4 bg-gray-300 rounded-full">
      <div
        className="h-4 bg-green-500 rounded-full"
        style={{ width: `${(recordingTime / 10) * 100}%` }}
      ></div>
    </div>
  </div>
);

export default Recorder;
