/**
 * AUDIO-LOG BACKEND (SERVERLESS)
 * * This code runs on Google's servers (Firebase Cloud Functions).
 * It securely holds your GEMINI_API_KEY and processes requests from the frontend.
 * * Setup:
 * 1. firebase init functions
 * 2. npm install
 * 3. firebase functions:secrets:set GEMINI_API_KEY
 * 4. firebase deploy
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Helper to get Gemini Model
const getModel = (apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

// --- 1. Transcribe & Analyze Audio ---
exports.processAudioLog = onCall({ secrets: [geminiApiKey] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

  const { audioBase64, mimeType } = request.data;
  
  try {
    const model = getModel(geminiApiKey.value());
    const prompt = `Transcribe this audio log exactly. Also, generate a short 1-sentence summary and determine if it's a 'Milestone' breakthrough. 
    Format strictly as JSON: { "transcript": string, "milestone": boolean, "summary": string }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: mimeType || 'audio/webm', data: audioBase64 } }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown code blocks if Gemini adds them
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Transcription Error:", error);
    throw new HttpsError('internal', 'Failed to process audio.');
  }
});

// --- 2. Generate Magic Title ---
exports.generateMagicTitle = onCall({ secrets: [geminiApiKey] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

  const { logs } = request.data; // Expecting a string of recent transcripts
  
  try {
    const model = getModel(geminiApiKey.value());

    const result = await model.generateContent(
      `Based on these voice logs, suggest a creative 2-3 word title and a 4-5 word subtitle for this person's learning journey. 
      Logs: ${logs}
      Format strictly as JSON: { "title": string, "subtitle": string }`
    );

    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Title Generation Error:", error);
    throw new HttpsError('internal', 'Failed to generate title.');
  }
});

// --- 3. Generate Weekly Recap ---
exports.generateRecap = onCall({ secrets: [geminiApiKey] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

  const { logs } = request.data;
  
  try {
    const model = getModel(geminiApiKey.value());

    const result = await model.generateContent(
      `Summarize the following learning journey logs into a single inspirational "Weekly Recap" paragraph. 
      Focus on the narrative arc of their effort. 
      Logs: ${logs}`
    );

    const response = await result.response;
    return { text: response.text() };
  } catch (error) {
    console.error("Recap Generation Error:", error);
    throw new HttpsError('internal', 'Failed to generate recap.');
  }
});

// --- 4. Get Gentle Nudge (Insight) ---
exports.getAIInsight = onCall({ secrets: [geminiApiKey] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

  const { transcript } = request.data;
  
  try {
    const model = getModel(geminiApiKey.value());

    const result = await model.generateContent(
      `The user recorded this log: "${transcript}". 
      Give them a one-sentence piece of personalized encouragement or a relevant "next step" tip. 
      Be warm, human, and specific.`
    );

    const response = await result.response;
    return { text: response.text() };
  } catch (error) {
    console.error("Insight Generation Error:", error);
    throw new HttpsError('internal', 'Failed to generate insight.');
  }
});

// --- 5. Analyze Persona ---
exports.analyzePersona = onCall({ secrets: [geminiApiKey] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

  const { logs } = request.data;
  
  try {
    const model = getModel(geminiApiKey.value());

    const result = await model.generateContent(
      `Based on these learning journals, describe the user's "Learning Persona" in 3 sentences. 
      Focus on their attitude, their strengths in overcoming obstacles, and their emotional tone. 
      Logs: ${logs}`
    );

    const response = await result.response;
    return { text: response.text() };
  } catch (error) {
    console.error("Persona Analysis Error:", error);
    throw new HttpsError('internal', 'Failed to analyze persona.');
  }
});
