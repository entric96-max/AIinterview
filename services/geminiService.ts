import { GoogleGenAI, Type } from "@google/genai";
import type { MCQ, TechnicalSubject } from '../types';

// The API key must be obtained exclusively from the environment variable process.env.API_KEY

let aiInstance: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI | null => {
    if (aiInstance) {
        return aiInstance;
    }
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return aiInstance;
};

interface FileData {
    base64: string;
    mimeType: string;
}

export const generateQuestionsFromResume = async (fileData: FileData): Promise<string[]> => {
  const ai = getAi();
  if (!ai) {
    return ["Could not connect to the AI service. The API key is not configured correctly."];
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
            {
                inlineData: {
                    data: fileData.base64,
                    mimeType: fileData.mimeType,
                },
            },
            {
                text: `
                    Based on the provided resume document, generate exactly 10 in-depth technical and behavioral interview questions.
                    The questions should be challenging and directly relevant to the programming languages, projects, and certifications mentioned.
                    Return the questions as a JSON array of strings. For example: ["Question 1?", "Question 2?"].
                `
            }
        ]
      },
       config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
            }
        }
       }
    });

    const jsonString = response.text.trim();
    const questions = JSON.parse(jsonString);
    return Array.isArray(questions) ? questions : [];
  } catch (error) {
    console.error("Error generating questions from resume:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('400')) {
        return ["Could not process the uploaded file. It might be corrupted or in an unsupported format. Please try a different file (PDF, DOCX, TXT)."];
    }
    return ["Could not generate questions due to an API error. Please try again later."];
  }
};

export const evaluateAnswer = async (question: string, answer: string): Promise<{ feedback: string; score: number }> => {
    const ai = getAi();
    if (!ai) {
        return {
            feedback: "Could not connect to the AI service. The API key is not configured correctly.",
            score: 0
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As a senior technical interviewer, evaluate the following answer provided for the given interview question.
            
            Question: "${question}"
            Answer: "${answer}"

            Provide constructive feedback on the answer's technical accuracy, clarity, and depth. Then, give a score from 1 to 5, where 1 is poor and 5 is excellent.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        feedback: { type: Type.STRING },
                        score: { type: Type.NUMBER }
                    },
                    required: ["feedback", "score"]
                }
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (typeof result.feedback === 'string' && typeof result.score === 'number') {
            return result;
        } else {
            throw new Error("Generated data does not match evaluation format.");
        }

    } catch (error) {
        console.error(`Error evaluating answer:`, error);
        return {
            feedback: "An error occurred while evaluating the answer. Please try again.",
            score: 0
        };
    }
};

export const summarizeInterviewPerformance = async (results: { question: string; answer: string; score: number }[]): Promise<{ strengths: string; areasForImprovement: string; }> => {
    const ai = getAi();
    if (!ai) {
        return {
            strengths: "Could not connect to the AI service to generate a summary.",
            areasForImprovement: "API key is not configured correctly."
        };
    }

    const performanceData = results.map(r => `Question: ${r.question}\nAnswer: ${r.answer}\nScore: ${r.score}/5`).join('\n\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As an interview coach, analyze the following interview performance data.
            
            ${performanceData}

            Based on all the answers and scores, provide a high-level summary. Identify the candidate's key strengths and the main areas for improvement. Be constructive and provide actionable advice.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        strengths: { type: Type.STRING, description: "A paragraph summarizing the candidate's key strengths." },
                        areasForImprovement: { type: Type.STRING, description: "A paragraph identifying the main areas for improvement with actionable advice." }
                    },
                    required: ["strengths", "areasForImprovement"]
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error(`Error summarizing performance:`, error);
        return {
            strengths: "An error occurred while generating the performance summary.",
            areasForImprovement: "Please review the individual feedback for each question."
        };
    }
};


export const generateMcqTest = async (subject: TechnicalSubject): Promise<MCQ[]> => {
    const ai = getAi();
    if (!ai) {
        return [{
            question: `Could not connect to the AI service. The API key is not configured correctly.`,
            options: [],
            correctAnswer: ""
        }];
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 10 multiple-choice questions for a technical interview on the subject of ${subject}. Each question should have 4 options and one correct answer. Ensure the provided 'correctAnswer' is one of the strings in the 'options' array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            correctAnswer: { type: Type.STRING }
                        },
                        required: ["question", "options", "correctAnswer"]
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        const mcqs = JSON.parse(jsonString);

        if (Array.isArray(mcqs) && mcqs.every(item => 'question' in item && 'options' in item && 'correctAnswer' in item)) {
            return mcqs;
        } else {
            console.error("Generated data does not match MCQ format.", mcqs);
            throw new Error("Generated data does not match MCQ format.");
        }

    } catch (error) {
        console.error(`Error generating MCQs for ${subject}:`, error);
        return [{
            question: `An error occurred while fetching questions for ${subject}. Please try again.`,
            options: [],
            correctAnswer: ""
        }];
    }
};