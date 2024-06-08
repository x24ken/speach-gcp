import { NextRequest, NextResponse } from "next/server";
import { SpeechClient } from "@google-cloud/speech";

// 認証情報は環境変数 GOOGLE_APPLICATION_CREDENTIALS を使用して設定されます
const client = new SpeechClient();

async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const [response] = await client.recognize({
    audio: {
      content: audioBuffer.toString("base64"),
    },
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US",
    },
  });

  return (
    response.results
      ?.map((result) => result.alternatives![0].transcript)
      .join("\n") || ""
  );
}

export async function POST(request: NextRequest) {
  const { audioBuffer } = await request.json();

  if (!audioBuffer) {
    return NextResponse.json(
      { error: "Audio buffer is required" },
      { status: 400 }
    );
  }

  try {
    const transcript = await transcribeAudio(
      Buffer.from(audioBuffer, "base64")
    );
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
