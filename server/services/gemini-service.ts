import axios from "axios";
import fs from "fs";
import { AIAssessmentResult } from "./ai-service";

// Base URL for Gemini API
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Process multimodal input (images, text, audio) to generate first aid guidance using Gemini AI
 * @param images Array of image file paths
 * @param textDescription Text description of the injury/condition
 * @param audioFilePath Path to the audio file if available
 * @returns First aid assessment results
 */
export async function generateFirstAidGuidanceWithGemini(
  images: string[] = [],
  textDescription: string = "",
  audioFilePath?: string
): Promise<AIAssessmentResult> {
  try {
    let audioTranscription = "";
    
    // Gemini doesn't have built-in audio transcription - we'll just use the text
    // If we had audio, we'd include that in the description
    if (audioFilePath) {
      audioTranscription = "Audio description provided but transcription not available with Gemini.";
    }
    
    // Combine text and audio inputs
    const combinedText = [
      textDescription ? `Text Description: ${textDescription}` : "",
      audioTranscription ? `Voice Description: ${audioTranscription}` : ""
    ].filter(Boolean).join("\n\n");
    
    // Prepare content parts for Gemini
    const contentParts: any[] = [];
    
    // Add system message
    contentParts.push({
      text: `You are a first aid expert. Analyze the provided information about an injury or medical condition and provide:
      1. A clear assessment of the situation
      2. Step-by-step first aid instructions
      3. Warning signs that would indicate the need to seek professional medical attention

      Format your response as a JSON object with the following structure:
      {
        "assessment": "your assessment of the situation",
        "steps": ["step 1", "step 2", "step 3", ...],
        "warnings": ["warning 1", "warning 2", "warning 3", ...]
      }`
    });
    
    // Add text content if available
    if (combinedText) {
      contentParts.push({
        text: combinedText
      });
    }
    
    // Add images if available
    for (const imagePath of images) {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      contentParts.push({
        text: "Please analyze this image of the injury/condition:"
      });
      
      contentParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      });
    }
    
    // Call the Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}/models/gemini-pro-vision:generateContent`,
      {
        contents: [
          {
            parts: contentParts
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        params: {
          key: GEMINI_API_KEY
        }
      }
    );
    
    const content = response.data.candidates[0].content.parts[0].text;
    if (!content) {
      throw new Error("No content in the response");
    }
    
    try {
      // Try to extract JSON from the text (Gemini might wrap it in markdown code blocks)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/```\n([\s\S]*?)\n```/) || 
                         content.match(/\{[\s\S]*\}/);
                         
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      const parsedResponse = JSON.parse(jsonStr);
      
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
    console.error("Error generating first aid guidance with Gemini:", error);
    
    // If the error is related to API rate limits or authentication
    if (error?.response?.status === 429 || error?.response?.status === 401) {
      throw new Error(`Gemini API service unavailable. Please try again later or contact support to update API credentials.`);
    }
    
    throw new Error(`Failed to generate first aid guidance: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Extract structured data from text when JSON parsing fails
 * @param text Response text from Gemini
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