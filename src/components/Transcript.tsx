import React from "react";

type TranscriptProps = {
  transcript: string;
  error: string | null;
};

const Transcript: React.FC<TranscriptProps> = ({ transcript, error }) => (
  <>
    {error && <p className="text-red-600">{error}</p>}
    <h2 className="mt-4 text-xl font-semibold">文字起こし結果</h2>
    <p className="mt-2 p-4 border rounded">{transcript}</p>
  </>
);

export default Transcript;
