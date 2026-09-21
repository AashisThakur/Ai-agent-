import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
import { getOrder } from "./agent/tools";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const getOrderTool = {
    name: "getOrder",
    description: "Get the current status and details of a customer's order.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            orderId: {
                type: Type.STRING,
                description: "The ID of the order",
            },
        },
        required: ["orderId"],
    },
};

async function generateWithFallback(
    contents: string,
    models = ["gemini-3.8-flash", "gemini-2.5-flash"],
    maxRetriesPerModel = 2
) {
    for (const model of models) {
        for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
            try {
                return await ai.models.generateContent({
                    model,
                    contents,
                    config: {
                        tools: [
                            {
                                functionDeclarations: [getOrderTool],
                            },
                        ],
                    },
                });
            } catch (error: any) {
                const isTransient = error?.status === 503 || error?.status === 429;
                if (isTransient && attempt < maxRetriesPerModel) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.warn(`[${model}] Received ${error.status}. Retrying in ${delay / 1000}s (attempt ${attempt}/${maxRetriesPerModel})...`);
                    await new Promise((res) => setTimeout(res, delay));
                    continue;
                }
                console.warn(`[${model}] Attempt failed: ${error?.message || error}`);
                break; // move to next model fallback
            }
        }
    }
    throw new Error("All candidate models failed to generate content.");
}

async function main() {
    try {
        const response = await generateWithFallback(
            "Where is my order 123?"
        );

        const functionCall = response.functionCalls?.[0];

        console.log("\nFunction call:");
        console.log(functionCall);

        if (functionCall?.name === "getOrder") {
            const orderId = functionCall.args?.orderId as string;

            const result = getOrder(orderId);

            console.log("\nTool result:");
            console.log(result);
        }
    } catch (err) {
        console.error("Execution failed:", err);
    }
}

main(); 