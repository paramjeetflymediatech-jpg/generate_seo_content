import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { title, keywords } = await req.json();

    if (!title || !keywords) {
      return NextResponse.json(
        { error: "Title and keywords are required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Generate an extensive, high-quality, professional blog post or article based on the following:
    Title: ${title}
    Keywords: ${keywords}
    
    CRITICAL REQUIREMENT: The content MUST be at least 1000 words long. Do not be concise; provide deep insights, detailed explanations, and thorough analysis.

    The content should follow this structure to ensure length and quality:
    1. Introduction: A hook, background information, and a clear thesis statement (approx. 150 words).
    2. Multiple Body Sections (H2 and H3): Break down the topic into 5-7 detailed sections. Each section should explore a specific sub-topic related to the keywords (approx. 150-200 words each).
    3. Case Studies or Examples: Include hypothetical or real-world examples to illustrate points.
    4. Actionable Tips/Advice: A section dedicated to practical steps the reader can take.
    5. SEO-friendly: Naturally integrate the keywords: ${keywords}.
    6. Tone: Professional, authoritative, yet conversational.
    7. Conclusion: Summarize key takeaways and provide a strong call to action (approx. 150 words).
    
    Please ensure the output is well-formatted with markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content", details: error.message },
      { status: 500 }
    );
  }
}
