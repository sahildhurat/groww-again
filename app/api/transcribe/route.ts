import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400 }
      );
    }

    const result = await transcribeAudio(audioFile);

    if (!result.success) {
      return NextResponse.json(
        { text: "", language: "en", fallback: true },
        { status: 200 }
      );
    }

    return NextResponse.json({
      text: result.text,
      language: result.language || "en",
      fallback: false,
    });
  } catch (error) {
    return NextResponse.json(
      { text: "", language: "en", fallback: true },
      { status: 200 }
    );
  }
}
