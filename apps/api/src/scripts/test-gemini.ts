import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await ai.models.generateContent({
  model: "gemini-3.8-flash",
  contents: "Explain what revenue means in a business database in one sentence.",
});

console.log(response.text);
