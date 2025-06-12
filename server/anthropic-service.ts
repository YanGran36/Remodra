import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Interface for PDF document analysis requests
 */
interface PdfDocumentAnalysisRequest {
  documentType: 'estimate' | 'invoice';
  documentContent: string;
  clientName?: string;
  documentId?: string;
  additionalContext?: string;
}

/**
 * Interface for PDF document analysis response
 */
interface PdfDocumentAnalysisResponse {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  contentAnalysis: {
    completeness: number; // 0-100 percentage
    clarity: number; // 0-100 percentage
    professionalismScore: number; // 0-100 percentage
    suggestedImprovements: string[];
  };
  clientPerspective: {
    comprehensibilityScore: number; // 0-100 percentage
    potentialQuestions: string[];
    impressionScore: number; // 0-100 percentage
  };
}

/**
 * Analyzes a PDF document content using Anthropic Claude
 * @param data The document data and context
 * @returns Analysis results
 */
export async function analyzePdfDocument(data: PdfDocumentAnalysisRequest): Promise<PdfDocumentAnalysisResponse> {
  try {
    const prompt = `
      You are a professional document analyst specialized in construction and contractor documents.
      Please analyze the following ${data.documentType} document and provide an in-depth analysis.
      
      DOCUMENT:
      ${data.documentContent}
      
      CONTEXT:
      Document Type: ${data.documentType}
      ${data.clientName ? `Client: ${data.clientName}` : ''}
      ${data.documentId ? `Document ID: ${data.documentId}` : ''}
      ${data.additionalContext ? `Additional Context: ${data.additionalContext}` : ''}
      
      INSTRUCTIONS:
      1. Generate a concise summary of the document
      2. Identify key findings from the document content
      3. Provide practical recommendations for improving the document
      4. Analyze the content quality based on:
         - Completeness (are all necessary elements present?)
         - Clarity (how easy is it to understand?)
         - Professionalism (does it present a professional image?)
      5. Analyze from the client's perspective:
         - How easy is it for a client to understand? (comprehensibility)
         - What questions might a client have after receiving this?
         - What impression does this document make on clients?
      
      Respond with JSON in this format:
      {
        "summary": "A brief summary of the document",
        "keyFindings": ["finding 1", "finding 2", ...],
        "recommendations": ["recommendation 1", "recommendation 2", ...],
        "contentAnalysis": {
          "completeness": 85,
          "clarity": 90,
          "professionalismScore": 88,
          "suggestedImprovements": ["improvement 1", "improvement 2", ...]
        },
        "clientPerspective": {
          "comprehensibilityScore": 75,
          "potentialQuestions": ["question 1", "question 2", ...],
          "impressionScore": 82
        }
      }
    `;

    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
      system: "You are a professional document analysis expert specializing in contractor documents like estimates and invoices. Provide detailed, actionable feedback to help contractors improve their documents.",
    });

    if (!message.content[0].text) {
      throw new Error("No response received from Anthropic");
    }

    return JSON.parse(message.content[0].text);
  } catch (error) {
    console.error("Error in Anthropic PDF analysis:", error);
    throw new Error(`Error analyzing PDF document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Interface for PDF template improvement requests
 */
interface TemplateImprovementRequest {
  templateSettings: Record<string, any>;
  templateType: 'estimate' | 'invoice';
  currentIssues?: string[];
  targetAudience?: string;
  industryContext?: string;
}

/**
 * Interface for PDF template improvement response
 */
interface TemplateImprovementResponse {
  improvedSettings: Record<string, any>;
  designRationale: string;
  improvements: {
    visual: string[];
    content: string[];
    layout: string[];
  };
  industryBestPractices: string[];
  furtherRecommendations: string[];
}

/**
 * Gets suggestions for improving a PDF template
 * @param data Template data and improvement context
 * @returns Improvement recommendations
 */
export async function suggestTemplateImprovements(data: TemplateImprovementRequest): Promise<TemplateImprovementResponse> {
  try {
    const prompt = `
      As a professional document design expert, please analyze the following template configuration
      for a ${data.templateType} PDF and suggest improvements.
      
      CURRENT TEMPLATE SETTINGS:
      ${JSON.stringify(data.templateSettings, null, 2)}
      
      CONTEXT:
      Template Type: ${data.templateType}
      ${data.currentIssues ? `Current Issues: ${JSON.stringify(data.currentIssues)}` : ''}
      ${data.targetAudience ? `Target Audience: ${data.targetAudience}` : ''}
      ${data.industryContext ? `Industry Context: ${data.industryContext}` : ''}
      
      INSTRUCTIONS:
      1. Analyze the current template configuration
      2. Suggest improvements to the template settings
      3. Explain the rationale behind your suggestions
      4. Provide specific improvements for:
         - Visual aspects (colors, fonts, spacing, etc.)
         - Content elements (what to show or hide)
         - Layout recommendations
      5. Include industry best practices for ${data.templateType} documents
      6. Add any further recommendations
      
      Respond with JSON in this format:
      {
        "improvedSettings": {
          // Modified version of the input settings with improvements
        },
        "designRationale": "Explanation of overall design approach",
        "improvements": {
          "visual": ["improvement 1", "improvement 2", ...],
          "content": ["improvement 1", "improvement 2", ...],
          "layout": ["improvement 1", "improvement 2", ...]
        },
        "industryBestPractices": ["practice 1", "practice 2", ...],
        "furtherRecommendations": ["recommendation 1", "recommendation 2", ...]
      }
    `;

    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
      system: "You are a professional document design expert specializing in creating beautiful, effective business documents. Provide detailed, practical advice to improve document templates.",
    });

    if (!message.content[0].text) {
      throw new Error("No response received from Anthropic");
    }

    return JSON.parse(message.content[0].text);
  } catch (error) {
    console.error("Error in Anthropic template improvement analysis:", error);
    throw new Error(`Error analyzing template improvements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}