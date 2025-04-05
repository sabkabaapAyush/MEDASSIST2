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
        4. Severity assessment of the condition

        Format your response as a JSON object with the following structure:
        {
          "assessment": "your assessment of the situation",
          "steps": ["step 1", "step 2", "step 3", ...],
          "warnings": ["warning 1", "warning 2", "warning 3", ...],
          "severity": {
            "level": "minor" | "requires_attention" | "emergency",
            "description": "explanation of why this severity level was assigned"
          }
        }
        
        For severity levels:
        - "minor": Injuries that can be safely treated at home (cuts, scrapes, minor burns, etc.)
        - "requires_attention": Conditions that need medical care soon but are not immediately life-threatening
        - "emergency": Conditions requiring immediate emergency medical services (severe bleeding, loss of consciousness, chest pain, etc.)`
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
        warnings: parsedResponse.warnings || [],
        severity: parsedResponse.severity || {
          level: "requires_attention",
          description: "Unable to determine severity level from provided information. Seeking medical advice is recommended as a precaution."
        }
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
    warnings: [],
    severity: {
      level: "requires_attention",
      description: "Unable to determine severity from the response. Seeking medical advice is recommended as a precaution."
    }
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
  const warningsRegex = new RegExp("warnings:?\\s*(.*?)(?=severity:|$)", "i");
  const warningsMatch = text.match(warningsRegex);
  if (warningsMatch && warningsMatch[1]) {
    result.warnings = warningsMatch[1]
      .split(/\d+\.\s+|\*\s+|-\s+/)
      .filter(Boolean)
      .map(warning => warning.trim());
  }
  
  // Try to extract severity level
  const severityLevelRegex = new RegExp("severity:?[^:]*level:?\\s*\"?([^\"\\n]+)\"?", "i");
  const severityLevelMatch = text.match(severityLevelRegex);
  if (severityLevelMatch && severityLevelMatch[1]) {
    const levelText = severityLevelMatch[1].toLowerCase().trim();
    
    if (levelText.includes("minor")) {
      result.severity = {
        level: "minor",
        description: result.severity?.description || "This condition can be safely treated at home with basic first aid."
      };
    } else if (levelText.includes("requires_attention") || levelText.includes("requires attention") || levelText.includes("attention")) {
      result.severity = {
        level: "requires_attention",
        description: result.severity?.description || "This condition needs medical attention, but is not immediately life-threatening."
      };
    } else if (levelText.includes("emergency")) {
      result.severity = {
        level: "emergency",
        description: result.severity?.description || "This is a medical emergency requiring immediate professional medical care."
      };
    }
  }
  
  // Try to extract severity description
  const severityDescRegex = new RegExp("severity:?[^:]*description:?\\s*\"?([^\"\\n]+)\"?", "i");
  const severityDescMatch = text.match(severityDescRegex);
  if (severityDescMatch && severityDescMatch[1] && result.severity) {
    result.severity.description = severityDescMatch[1].trim();
  }
  
  return result;
}