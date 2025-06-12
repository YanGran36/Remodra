import OpenAI from "openai";
import { log } from "./vite";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Check if the API key exists
if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING! The OpenAI API key is not defined in the environment variables.");
}

export interface JobCostAnalysisParams {
  serviceType: string;
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }>;
  laborHours?: number;
  propertySize?: {
    squareFeet?: number;
    linearFeet?: number;
    units?: number;
  };
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  difficulty?: "easy" | "medium" | "complex";
  additionalInfo?: string;
}

export interface JobCostAnalysisResult {
  recommendedTotal: number;
  breakdown: {
    materials: {
      total: number;
      items: Array<{
        name: string;
        estimatedCost: number;
        notes?: string;
      }>;
    };
    labor: {
      total: number;
      estimatedHours: number;
      hourlyRate: number;
      notes?: string;
    };
    overhead: {
      total: number;
      percentage: number;
      notes?: string;
    };
    profit: {
      total: number;
      percentage: number;
      notes?: string;
    };
    recommendations: string[];
    competitiveAnalysis?: {
      lowRange: number;
      highRange: number;
      notes: string;
      marketPosition: string;
    };
    potentialIssues: string[];
    salesPoints: string[];
    objectionHandling: string[];
    premiumUpgrades: string[];
    closingStrategy: string;
    testimonialTemplates: string[];
    presentationTips: string[];
  };
  summary: string;
}

// The main function to analyze and estimate job costs
export async function analyzeJobCost(params: JobCostAnalysisParams): Promise<JobCostAnalysisResult> {
  try {
    log("Analyzing job costs with OpenAI", "openai");
    console.log("Parameters received for analysis:", {
      serviceType: params.serviceType,
      materialsCount: params.materials?.length || 0,
      hasLaborHours: !!params.laborHours,
      hasAddress: !!(params.address || params.city || params.state || params.zip),
      hasDifficulty: !!params.difficulty,
      hasAdditionalInfo: !!params.additionalInfo
    });

    // Prepare the data to send to the API
    const prompt = `
    You are an expert sales consultant for professional contractors with 20+ years of experience selling high-end contracting services. Analyze the following job details and provide a sales-focused analysis with market comparison and professional selling points. Return your response ONLY in JSON format to facilitate processing by a computer system.

    JOB INFORMATION:
    - Service type: ${params.serviceType}
    - Materials: ${JSON.stringify(params.materials)}
    ${params.laborHours ? `- Estimated labor hours: ${params.laborHours}` : ''}
    ${params.propertySize?.squareFeet ? `- Property size (square feet): ${params.propertySize.squareFeet}` : ''}
    ${params.propertySize?.linearFeet ? `- Property size (linear feet): ${params.propertySize.linearFeet}` : ''}
    ${params.propertySize?.units ? `- Units: ${params.propertySize.units}` : ''}
    ${params.address || params.city || params.state || params.zip ? `- Project Address: ${[params.address, params.city, params.state, params.zip].filter(Boolean).join(', ')}` : ''}
    ${params.difficulty ? `- Job difficulty: ${params.difficulty}` : ''}
    ${params.additionalInfo ? `- Additional information: ${params.additionalInfo}` : ''}

    INSTRUCTIONS:
    1. Analyze the cost and pricing strategy for this project from a sales perspective.
    2. Compare this price to market rates (low, average, premium) and provide specific positioning guidance.
    3. Provide 3-5 professional selling points based on the service and materials that highlight value over price.
    4. Include 2-3 specific objection handling strategies for this type of service and price point.
    5. Suggest 2-3 premium upgrades or add-ons that could increase the project value.
    6. Recommend a specific closing strategy that fits this particular service and price point.
    7. Include 2-3 customer testimonial templates that would be effective for this type of project.
    8. Give specific advice on how to present the quote to maximize chances of acceptance.

    Please provide your response in JSON FORMAT ONLY with the following structure:
    {
      "recommendedTotal": number,
      "breakdown": {
        "materials": {
          "total": number,
          "items": [
            {
              "name": "string",
              "estimatedCost": number,
              "notes": "string (optional)"
            }
          ]
        },
        "labor": {
          "total": number,
          "estimatedHours": number,
          "hourlyRate": number,
          "notes": "string (optional)"
        },
        "overhead": {
          "total": number,
          "percentage": number,
          "notes": "string (optional)"
        },
        "profit": {
          "total": number,
          "percentage": number,
          "notes": "string (optional)"
        },
        "recommendations": ["string"],
        "competitiveAnalysis": {
          "lowRange": number,
          "highRange": number,
          "notes": "string",
          "marketPosition": "string"
        },
        "potentialIssues": ["string"],
        "salesPoints": ["string"],
        "objectionHandling": ["string"],
        "premiumUpgrades": ["string"],
        "closingStrategy": "string",
        "testimonialTemplates": ["string"],
        "presentationTips": ["string"]
      },
      "summary": "string"
    }
    `;

    console.log("Sending request to OpenAI for cost analysis...");

    // Call to the OpenAI API
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // The latest available version
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      console.log("Response received from OpenAI for analysis:", {
        status: "success",
        model: response.model,
        choicesCount: response.choices.length
      });

      // Process the response
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("Empty content in OpenAI analysis response");
        throw new Error("No response received from OpenAI API");
      }

      try {
        const result = JSON.parse(content) as JobCostAnalysisResult;
        console.log("Analysis completed successfully. Recommended total:", result.recommendedTotal);
        return result;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.error("Content received:", content);
        throw new Error("Error processing OpenAI response");
      }
    } catch (error: unknown) {
      const openaiError = error as { message?: string };
      console.error("Specific OpenAI error in analysis:", openaiError);
      
      // Check if it is an API key error
      if (openaiError.message && typeof openaiError.message === 'string' && openaiError.message.includes("api_key")) {
        throw new Error("Authentication error with OpenAI. Verify the API key.");
      }
      
      throw openaiError;
    }
  } catch (error) {
    console.error("Error analyzing costs with OpenAI:", error);
    throw error;
  }
}

export async function generateJobDescription(params: JobCostAnalysisParams): Promise<string> {
  try {
    log("Generating job description with OpenAI", "openai");
    console.log("Parameters received:", {
      serviceType: params.serviceType,
      materialsCount: params.materials?.length || 0,
      hasAddress: !!(params.address || params.city || params.state || params.zip),
      hasDifficulty: !!params.difficulty,
      hasAdditionalInfo: !!params.additionalInfo
    });

    // Prepare the data to send to the API
    const prompt = `
    You are a professional contractor. Create a concise, direct, and easy-to-understand description for this project:

    JOB INFORMATION:
    - Service type: ${params.serviceType}
    - Main materials: ${params.materials.map(m => m.name).join(", ")}
    ${params.propertySize?.squareFeet ? `- Property size (square feet): ${params.propertySize.squareFeet}` : ''}
    ${params.propertySize?.linearFeet ? `- Property size (linear feet): ${params.propertySize.linearFeet}` : ''}
    ${params.propertySize?.units ? `- Units: ${params.propertySize.units}` : ''}
    ${params.address || params.city || params.state || params.zip ? `- Project Address: ${[params.address, params.city, params.state, params.zip].filter(Boolean).join(', ')}` : ''}
    ${params.difficulty ? `- Job difficulty: ${params.difficulty}` : ''}
    ${params.additionalInfo ? `- Additional information: ${params.additionalInfo}` : ''}

    The description should be:
    1. Short and direct (maximum 150 words)
    2. Structured in a bulleted list format (•)
    3. Easy to read for clients without technical knowledge
    4. Include exactly these 4 points, each as a separate paragraph with a bullet point (•):
      • What service will be performed exactly
      • What materials will be used and why they are good
      • Approximately how long the job will take
      • What main benefit the client will receive

    Use a professional but simple tone, as if you were speaking directly to a client. Do not include specific prices.
    `;

    console.log("Sending prompt to OpenAI:", prompt);

    // Call to the OpenAI API
    try {
      console.log("Starting OpenAI API call...");
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });
      console.log("Response received from OpenAI:", {
        status: "success",
        model: response.model,
        choicesCount: response.choices.length
      });

      // Process the response
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("Empty content in OpenAI response");
        throw new Error("No response received from OpenAI API");
      }

      console.log("Description generated successfully. Length:", content.length);
      return content;
    } catch (error: unknown) {
      const openaiError = error as { message?: string };
      console.error("Specific OpenAI error:", openaiError);
      
      // Check if it is an API key error
      if (openaiError.message && typeof openaiError.message === 'string' && openaiError.message.includes("api_key")) {
        throw new Error("Authentication error with OpenAI. Verify the API key.");
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error generating job description with OpenAI:", error);
    throw error;
  }
}