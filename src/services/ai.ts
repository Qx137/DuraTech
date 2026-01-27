
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with a key
export const getAIClient = (apiKey: string) => {
    return new GoogleGenerativeAI(apiKey);
};

export interface CropRecommendation {
    crop: string;
    confidence: number;
    reason: string;
    price: string;
}

export interface PriceAnalysis {
    current: string;
    prediction: string;
    trend: "increasing" | "decreasing" | "stable";
    confidence: number;
    factors: string[];
}

export const generateCropRecommendations = async (
    apiKey: string,
    location: string,
    season: string,
    soilType: string
): Promise<CropRecommendation[]> => {
    try {
        const genAI = getAIClient(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as an agricultural expert. Suggest 4 crops suitable for farming in ${location} during ${season} season with ${soilType} soil. 
    Return the response ONLY as a JSON array with the following structure:
    [
      { "crop": "Crop Name", "confidence": 85, "reason": "Brief reason why", "price": "Estimated price per unit" }
    ]
    Do not include markdown formatting or code blocks. Just the raw JSON string.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up any potential markdown formatting
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error generating recommendations:", error);
        throw new Error("Failed to generate recommendations");
    }
};

export const analyzePriceTrends = async (
    apiKey: string,
    crop: string,
    period: string
): Promise<PriceAnalysis> => {
    try {
        const genAI = getAIClient(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as an agricultural economist. Analyze price trends for ${crop} over the next ${period}.
    Return the response ONLY as a JSON object with the following structure:
    {
      "current": "Current average market price",
      "prediction": "Predicted price in ${period}",
      "trend": "increasing" (or "decreasing" or "stable"),
      "confidence": 85,
      "factors": ["Factor 1", "Factor 2", "Factor 3"]
    }
    Do not include markdown formatting or code blocks. Just the raw JSON string.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error analyzing prices:", error);
        throw new Error("Failed to analyze prices");
    }
};

export const smartSearch = async (
    apiKey: string,
    query: string
): Promise<string> => {
    try {
        const genAI = getAIClient(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as a smart search assistant for an agricultural marketplace. 
    The user is searching for: "${query}".
    Suggest 3 categories or types of products they should look for, and explain why.
    Keep it brief and helpful.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Error performing smart search:", error);
        throw new Error("Failed to perform search");
    }
};
