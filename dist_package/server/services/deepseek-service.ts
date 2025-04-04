import axios from "axios";
import fs from "fs";
import { AIAssessmentResult } from "./ai-service";

// Base URL for DeepSeek API
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * Process multimodal input (images, text, audio) to generate first aid guidance using DeepSeek AI
 * @param images Array of image file paths
 * @param textDescription Text description of the injury/condition
 * @param audioFilePath Path to the audio file if available
 * @returns First aid assessment results
 */
export async function generateFirstAidGuidanceWithDeepSeek(
  images: string[] = [],
  textDescription: string = "",
  audioFilePath?: string
): Promise<AIAssessmentResult> {
  try {
    let audioTranscription = "";
    
    // Transcribe audio if provided
    if (audioFilePath) {
      audioTranscription = await transcribeAudioWithDeepSeek(audioFilePath);
    }
    
    // Combine text and audio inputs
    const combinedText = [
      textDescription ? `Text Description: ${textDescription}` : "",
      audioTranscription ? `Voice Description: ${audioTranscription}` : ""
    ].filter(Boolean).join("\n\n");
    
    // Prepare messages for DeepSeek
    const messages: any[] = [
      {
        role: "system",
        content: `You are a first aid expert. Analyze the provided information about an injury or medical condition and provide:
        1. A clear assessment of the situation
        2. Step-by-step first aid instructions
        3. Warning signs that would indicate the need to seek professional medical attention

        Format your response as a JSON object with the following structure:
        {
          "assessment": "your assessment of the situation",
          "steps": ["step 1", "step 2", "step 3", ...],
          "warnings": ["warning 1", "warning 2", "warning 3", ...]
        }`
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
      for (const imagePath of images) {
        const base64Image = fs.readFileSync(imagePath).toString('base64');
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this image of the injury/condition and provide appropriate first aid guidance."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        });
      }
    }
    
    // Call the DeepSeek API
    const response = await axios.post(
      `${DEEPSEEK_API_URL}/chat/completions`,
      {
        model: "deepseek-vision",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );
    
    const content = response.data.choices[0].message.content;
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
    console.error("Error generating first aid guidance with DeepSeek:", error);
    
    // If the error is related to API rate limits or authentication
    if (error?.response?.status === 429 || error?.response?.status === 401) {
      throw new Error(`DeepSeek API service unavailable. Please try again later or contact support to update API credentials.`);
    }
    
    throw new Error(`Failed to generate first aid guidance: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Transcribe audio file to text using DeepSeek
 * @param audioFilePath Path to the audio file
 * @returns Transcribed text
 */
async function transcribeAudioWithDeepSeek(audioFilePath: string): Promise<string> {
  try {
    const base64Audio = fs.readFileSync(audioFilePath).toString('base64');
    
    const response = await axios.post(
      `${DEEPSEEK_API_URL}/audio/transcriptions`,
      {
        file: base64Audio,
        model: "deepseek-audio-transcribe",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );
    
    return response.data.text;
  } catch (error: any) {
    console.error("Error transcribing audio with DeepSeek:", error);
    return "";
  }
}

/**
 * Extract structured data from text when JSON parsing fails
 * @param text Response text from DeepSeek
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