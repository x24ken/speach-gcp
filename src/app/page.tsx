"use client";

import React, { useState } from "react";
import Recorder from "../components/Recorder";
import Transcript from "../components/Transcript";

export default function Home() {
  const [transcript, setTranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranscribe = (transcript: string, error: string | null) => {
    setTranscript(transcript);
    setError(error);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">音声認識デモ</h1>
      <Recorder
        onTranscribe={handleTranscribe}
        setIsTranscribing={setIsTranscribing}
      />
      {isTranscribing && <p className="text-yellow-600">文字起こし中...</p>}
      <Transcript transcript={transcript} error={error} />
    </div>
  );
}
