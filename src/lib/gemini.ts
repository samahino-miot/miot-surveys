import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../store";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const surveyConfig = {
  systemInstruction: "You are an expert survey creator for a hospital. Generate a structured survey with a title, description, and a list of questions. Questions can be 'text', 'rating', 'multiple_choice', or 'checkbox'. For multiple choice and checkbox, provide 'options'.",
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Survey title" },
      description: { type: Type.STRING, description: "Survey description" },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The question text" },
            type: { type: Type.STRING, description: "One of: text, rating, multiple_choice, checkbox" },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Options for multiple_choice or checkbox"
            },
            required: { type: Type.BOOLEAN, description: "Whether the question is required" }
          },
          required: ["text", "type", "required"]
        }
      }
    },
    required: ["title", "description", "questions"]
  }
};

export const generateSurveyFromText = async (text: string): Promise<{ title: string; description: string; questions: Omit<Question, 'id'>[] }> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following text from a hospital document and generate a survey based on it. The hospital is MIOT International. Extract relevant topics to ask patients about.
    
    Text:
    ${text}`,
    config: surveyConfig as any
  });

  if (!response.text) {
    throw new Error("Failed to generate survey");
  }

  return JSON.parse(response.text);
};

export const generateSurveyFromFile = async (base64Data: string, mimeType: string): Promise<{ title: string; description: string; questions: Omit<Question, 'id'>[] }> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: "Analyze the attached document and generate a survey based on it. The hospital is MIOT International. Extract relevant topics to ask patients about."
        }
      ]
    },
    config: surveyConfig as any
  });

  if (!response.text) {
    throw new Error("Failed to generate survey");
  }

  return JSON.parse(response.text);
};
