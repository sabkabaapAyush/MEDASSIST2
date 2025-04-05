import OpenAI from "openai";
import fs from "fs";
import { AIAssessmentResult } from "./ai-service";

// Create OpenAI client using the API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Process multimodal input (images, text, audio) to generate first aid guidance using OpenAI
 * @param images Array of image file paths
 * @param textDescription Text description of the injury/condition
 * @param audioFilePath Path to the audio file if available
 * @returns First aid assessment results
 */
export async function generateFirstAidGuidanceWithOpenAI(
  images: string[], 
  textDescription: string,
  audioFilePath?: string
): Promise<AIAssessmentResult> {
  try {
    // Create content array for multimodal inputs
    const content: Array<any> = [];
    
    // Add system message to guide the AI
    content.push({
      type: "text",
      text: `You are a medical first aid assistant. 
      Analyze the provided information (images, text description, and/or audio transcription) 
      and provide first aid guidance. Structure your response as a JSON object with the following properties:
      {
        "assessment": "Brief description of the injury or condition based on the provided inputs",
        "steps": ["Step 1 of first aid treatment", "Step 2", "..."],
        "warnings": ["Important warning or caution", "..."]
      }`
    });
    
    // Add user text input as context
    content.push({
      type: "text",
      text: `Situation description: ${textDescription}`
    });

    // Process audio if available 
    let audioTranscription = "";
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      audioTranscription = await transcribeAudioWithOpenAI(audioFilePath);
      content.push({
        type: "text",
        text: `Additional voice information: ${audioTranscription}`
      });
    }

    // Add images if available
    for (const imagePath of images) {
      if (fs.existsSync(imagePath)) {
        const base64Image = fs.readFileSync(imagePath, { encoding: "base64" });
        content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        });
      }
    }

    // Make API call to OpenAI with multimodal content
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: content
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    // Parse and return the response
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }

    try {
      return JSON.parse(responseContent) as AIAssessmentResult;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      return extractStructuredDataFromText(responseContent);
    }
  } catch (error: any) {
    console.error("Error generating first aid guidance with OpenAI:", error);
    throw new Error(`OpenAI Service Error: ${error.message || "Unknown error"}`);
  }
}

/**
 * Transcribe audio file to text using OpenAI Whisper API
 * @param audioFilePath Path to the audio file
 * @returns Transcribed text
 */
async function transcribeAudioWithOpenAI(audioFilePath: string): Promise<string> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error: any) {
    console.error("Error transcribing audio with OpenAI:", error);
    return ""; // Return empty string on error to allow the process to continue
  }
}

/**
 * Extract structured data from text when JSON parsing fails
 * @param text Response text from OpenAI
 * @returns Structured assessment data
 */
function extractStructuredDataFromText(text: string): AIAssessmentResult {
  console.log("Extracting structured data from OpenAI text response");
  
  // Default result structure
  const result: AIAssessmentResult = {
    assessment: "Unable to parse response properly. Please try again.",
    steps: [],
    warnings: ["The system encountered an issue processing the response."]
  };

  // Extract assessment (look for a paragraph that seems to be describing the condition)
  const assessmentMatch = text.match(/assessment[:\s]+([^\n]+)/i) || 
                          text.match(/situation[:\s]+([^\n]+)/i) ||
                          text.match(/condition[:\s]+([^\n]+)/i);
  if (assessmentMatch && assessmentMatch[1]) {
    result.assessment = assessmentMatch[1].trim();
  }

  // Extract steps
  const stepsMatch = text.match(/steps[:\s]+([\s\S]+?)(?=warnings|$)/i);
  if (stepsMatch && stepsMatch[1]) {
    const stepsText = stepsMatch[1].trim();
    // Look for numbered steps or bullet points
    const steps = stepsText.split(/\n+/).map(step => {
      return step.replace(/^[0-9#\-*.\s]+/, '').trim();
    }).filter(Boolean);
    
    if (steps.length > 0) {
      result.steps = steps;
    }
  }

  // Extract warnings
  const warningsMatch = text.match(/warnings[:\s]+([\s\S]+?)(?=\n\n|$)/i);
  if (warningsMatch && warningsMatch[1]) {
    const warningsText = warningsMatch[1].trim();
    const warnings = warningsText.split(/\n+/).map(warning => {
      return warning.replace(/^[0-9#\-*.\s]+/, '').trim();
    }).filter(Boolean);
    
    if (warnings.length > 0) {
      result.warnings = warnings;
    }
  }

  return result;
}