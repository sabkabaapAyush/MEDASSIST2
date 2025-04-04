import OpenAI from "openai";
import fs from "fs";
import { promisify } from "util";
import stream from "stream";

// Initialize OpenAI client with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to convert readable stream to buffer
const pipeline = promisify(stream.pipeline);

export interface AIAssessmentResult {
  assessment: string;
  steps: string[];
  warnings: string[];
}

/**
 * Process multimodal input (images, text, audio) to generate first aid guidance
 * @param images Array of image file paths
 * @param textDescription Text description of the injury/condition
 * @param audioFilePath Path to the audio file if available
 * @returns First aid assessment results
 */
export async function generateFirstAidGuidance(
  images: string[] = [],
  textDescription: string = "",
  audioFilePath?: string
): Promise<AIAssessmentResult> {
  try {
    let audioTranscription = "";
    
    // Transcribe audio if provided
    if (audioFilePath) {
      audioTranscription = await transcribeAudio(audioFilePath);
    }
    
    // Combine text and audio inputs
    const combinedText = [
      textDescription ? `Text Description: ${textDescription}` : "",
      audioTranscription ? `Voice Description: ${audioTranscription}` : ""
    ].filter(Boolean).join("\n\n");
    
    // Prepare messages for OpenAI
    const messages: any[] = [
      {
        role: "system",
        content: `You are a first aid expert. Analyze the provided information about an injury or medical condition and provide:
        1. A clear assessment of the situation
        2. Step-by-step first aid instructions
        3. Warning signs that would indicate the need to seek professional medical attention`
      }
    ];
    
    // Add text content if available
    if (combinedText) {
      messages.push({
        role: "user",
        content: combinedText
      });
    }
    
    // Add images if available
    if (images.length > 0) {
      const imageContents = images.map(imagePath => ({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${fs.readFileSync(imagePath).toString('base64')}`
        }
      }));
      
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze these images of the injury/condition and provide appropriate first aid guidance."
          },
          ...imageContents
        ]
      });
    }
    
    // Call the API with gpt-4o (the most advanced model)
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in the response");
    }
    
    try {
      const parsedResponse = JSON.parse(content);
      
      return {
        assessment: parsedResponse.assessment || "Unable to provide assessment with given information.",
        steps: parsedResponse.steps || [],
        warnings: parsedResponse.warnings || []
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      
      // If JSON parsing fails, attempt to extract structured data from text
      return extractStructuredDataFromText(content);
    }
  } catch (error: any) {
    console.error("Error generating first aid guidance:", error);
    
    // If the error is related to API rate limits or authentication
    if (error?.status === 429 || error?.status === 401) {
      throw new Error(`API service unavailable. Please try again later or contact support to update API credentials.`);
    }
    
    throw new Error(`Failed to generate first aid guidance: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Transcribe audio file to text
 * @param audioFilePath Path to the audio file
 * @returns Transcribed text
 */
async function transcribeAudio(audioFilePath: string): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
    });
    
    return transcription.text;
  } catch (error: any) {
    console.error("Error transcribing audio:", error);
    return "";
  }
}

/**
 * Extract structured data from text when JSON parsing fails
 * @param text Response text from OpenAI
 * @returns Structured assessment data
 */
function extractStructuredDataFromText(text: string): AIAssessmentResult {
  // Default values
  const result: AIAssessmentResult = {
    assessment: "",
    steps: [],
    warnings: []
  };
  
  // Try to extract assessment section
  const assessmentRegex = new RegExp("assessment:?\\s*(.*?)(?=steps:|warnings:|$)", "i");
  const assessmentMatch = text.match(assessmentRegex);
  if (assessmentMatch && assessmentMatch[1]) {
    result.assessment = assessmentMatch[1].trim();
  }
  
  // Try to extract steps
  const stepsRegex = new RegExp("steps:?\\s*(.*?)(?=warnings:|$)", "i");
  const stepsMatch = text.match(stepsRegex);
  if (stepsMatch && stepsMatch[1]) {
    result.steps = stepsMatch[1]
      .split(/\d+\.\s+/)
      .filter(Boolean)
      .map(step => step.trim());
  }
  
  // Try to extract warnings
  const warningsRegex = new RegExp("warnings:?\\s*(.*?)(?=$)", "i");
  const warningsMatch = text.match(warningsRegex);
  if (warningsMatch && warningsMatch[1]) {
    result.warnings = warningsMatch[1]
      .split(/\d+\.\s+|\*\s+|-\s+/)
      .filter(Boolean)
      .map(warning => warning.trim());
  }
  
  return result;
}