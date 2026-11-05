import Groq from "groq-sdk";

export async function transcribeAudio(audioFile: File): Promise<{
  text: string;
  language?: string;
  success: boolean;
}> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      text: "",
      success: false,
    };
  }

  try {
    const groq = new Groq({ apiKey });

    // Use whisper-large-v3 or whisper-large-v3-turbo
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      response_format: "json",
    });

    return {
      text: transcription.text || "",
      success: true,
    };
  } catch (error) {
    return {
      text: "",
      success: false,
    };
  }
}
