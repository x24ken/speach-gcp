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
      encoding: "WEBM_OPUS", // 実際の音声データフォーマットに応じて適切に設定
      languageCode: "ja-JP", // 日本語を指定
      // sampleRateHertz: 16000, // APIにサンプルレートを自動検出させる
    },
  });

  if (!response.results) {
    throw new Error("No transcription results");
  }

  const transcript = response.results
    .map((result) => {
      if (result.alternatives && result.alternatives.length > 0) {
        return result.alternatives[0].transcript;
      } else {
        throw new Error("No alternatives found in result");
      }
    })
    .join("\n");

  return transcript;
}

export async function POST(request: NextRequest) {
  try {
    const { audioBuffer } = await request.json();
    console.debug("audioBuffer:", audioBuffer); // ログ出力

    if (!audioBuffer) {
      return NextResponse.json(
        { error: "Audio buffer is required" },
        { status: 400 }
      );
    }

    const transcript = await transcribeAudio(
      Buffer.from(audioBuffer, "base64")
    );
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Error during transcription:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
