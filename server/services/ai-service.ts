import { generateFirstAidGuidance } from "./openai-service";
import { generateFirstAidGuidanceWithDeepSeek } from "./deepseek-service";

// Interface for assessment results
export interface AIAssessmentResult {
  assessment: string;
  steps: string[];
  warnings: string[];
}

/**
 * Unified service that attempts to use OpenAI first, falling back to DeepSeek if OpenAI fails
 * @param images Array of image file paths
 * @param textDescription Text description of the injury/condition
 * @param audioFilePath Path to the audio file if available
 * @returns First aid assessment results
 */
export async function generateFirstAidGuidanceUnified(
  images: string[] = [],
  textDescription: string = "",
  audioFilePath?: string
): Promise<AIAssessmentResult> {
  // Check if an API preference was set in environment
  const preferredApi = process.env.PREFERRED_AI_API?.toLowerCase();
  
  try {
    // Try DeepSeek first if preferred or if OpenAI key is not available
    if (preferredApi === "deepseek" || (!process.env.OPENAI_API_KEY && process.env.DEEPSEEK_API_KEY)) {
      return await generateFirstAidGuidanceWithDeepSeek(images, textDescription, audioFilePath);
    }
    
    // Default: Try OpenAI first
    return await generateFirstAidGuidance(images, textDescription, audioFilePath);
  } catch (error) {
    console.log("Primary API service failed, attempting fallback...");
    
    // If primary API fails, try the fallback API
    try {
      if (preferredApi === "deepseek" && process.env.OPENAI_API_KEY) {
        return await generateFirstAidGuidance(images, textDescription, audioFilePath);
      } else if (process.env.DEEPSEEK_API_KEY) {
        return await generateFirstAidGuidanceWithDeepSeek(images, textDescription, audioFilePath);
      } else {
        throw error; // No fallback available, rethrow original error
      }
    } catch (fallbackError) {
      console.error("Both primary and fallback AI services failed:", fallbackError);
      throw new Error("All AI services are currently unavailable. Please try again later.");
    }
  }
}

// No need to re-export the interface as it's already exported above