import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptTurn } from "../types";

const processAudioTranscript = async (audioData: {mimeType: string, data: string}): Promise<TranscriptTurn[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const audioPart = {
    inlineData: {
      mimeType: audioData.mimeType,
      data: audioData.data,
    },
  };

  const textPart = {
    text: `You are an expert transcription service. Your task is to take this audio file and convert it into a structured, speaker-diarized format with timestamps.

- Transcribe the audio verbatim.
- Identify each distinct speaker.
- For each speaker's turn, provide a start timestamp in HH:MM:SS format.
- Group consecutive lines from the same speaker into a single turn.
- The output must be a clean, verbatim transcript.
- Ensure the output is a valid JSON array matching the provided schema.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [audioPart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              speaker: {
                type: Type.STRING,
                description: "The identifier for the speaker (e.g., Speaker 1, Speaker 2, Speaker 3)."
              },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  description: "A single line of verbatim text spoken by the speaker."
                },
                description: "An array of verbatim text lines spoken by this speaker in this turn."
              },
              timestamp: {
                type: Type.STRING,
                description: "The start timestamp of the speaker's turn in HH:MM:SS format."
              }
            },
            required: ["speaker", "lines", "timestamp"]
          }
        }
      }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    return parsedJson as TranscriptTurn[];

  } catch (error) {
    console.error("Error processing transcript with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to process transcript. API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while processing the transcript.");
  }
};

export default processAudioTranscript;
