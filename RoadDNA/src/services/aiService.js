// src/services/aiService.js
import axios from 'axios';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log("🔑 OpenRouter Key exists:", !!OPENROUTER_API_KEY);
console.log("🔑 Gemini Key exists:", !!GEMINI_API_KEY);

// Free working models on OpenRouter
const MODELS = {
  FREE: [
    "google/gemini-2.0-flash-lite-001",
    "meta-llama/llama-3.2-3b-instruct", 
    "microsoft/phi-3-mini-128k-instruct"
  ],
  BEST: "google/gemini-2.0-flash-lite-001"
};

// Rate limiting
let lastRequestTime = 0;
const MIN_DELAY = 3000;

export const askAI = async (question) => {
  // Rate limiting
  const now = Date.now();
  const timeSince = now - lastRequestTime;
  if (timeSince < MIN_DELAY) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY - timeSince));
  }
  lastRequestTime = Date.now();

  console.log("🤖 Asking:", question);
  
  // Try OpenRouter first
  if (OPENROUTER_API_KEY) {
    try {
      console.log("📡 Sending to OpenRouter...");
      
      const response = await axios({
        method: 'POST',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'RoadDNA AI'
        },
        data: {
          model: MODELS.BEST,
          messages: [
            {
              role: "system",
              content: "You are RoadDNA, Nepal's AI road expert. Give accurate, concise answers about Nepal roads. Max 3 sentences. If you don't know, say so."
            },
            {
              role: "user",
              content: question
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        },
        timeout: 30000
      });
      
      const text = response.data?.choices?.[0]?.message?.content;
      if (text) {
        console.log("✅ OpenRouter Response:", text.substring(0, 100) + "...");
        return text;
      } else {
        console.log("❌ No text in OpenRouter response");
        return await tryOtherModels(question);
      }
    } catch (error) {
      console.error("❌ OpenRouter Error:", error.response?.data?.error?.message || error.message);
      
      const fallbackResult = await tryOtherModels(question);
      if (fallbackResult) return fallbackResult;
      
      if (GEMINI_API_KEY) {
        console.log("🔄 Falling back to Gemini...");
        return await askGemini(question);
      }
      
      return "⚠️ Sorry, I'm having trouble connecting. Please try again.";
    }
  }
  
  // Try Gemini only
  if (GEMINI_API_KEY) {
    console.log("📡 Using Gemini only...");
    return await askGemini(question);
  }
  
  return "⚠️ No API keys found. Please check your .env file.";
};

// Try different models if one fails
const tryOtherModels = async (question) => {
  for (const model of MODELS.FREE) {
    if (model === MODELS.BEST) continue;
    try {
      console.log(`🔄 Trying model: ${model}`);
      const response = await axios({
        method: 'POST',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'RoadDNA AI'
        },
        data: {
          model: model,
          messages: [
            {
              role: "system",
              content: "You are RoadDNA, Nepal's AI road expert. Give concise answers."
            },
            {
              role: "user",
              content: question
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        },
        timeout: 30000
      });
      
      const text = response.data?.choices?.[0]?.message?.content;
      if (text) {
        console.log(`✅ Model ${model} responded`);
        return text;
      }
    } catch (error) {
      console.log(`❌ Model ${model} failed`);
    }
  }
  return null;
};

// Gemini fallback
const askGemini = async (question) => {
  try {
    if (!GEMINI_API_KEY) return null;
    
    console.log("📡 Sending to Gemini...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: question }] }]
        })
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      if (data.error.message?.includes('429')) {
        return "⏳ Quota limit reached. Please wait 1-2 minutes and try again.";
      }
      return `⚠️ Error: ${data.error.message}`;
    }
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      console.log("✅ Gemini Response received");
      return text;
    }
    return "⚠️ No response from AI. Please try again.";
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
    return null;
  }
};

export default { ask: askAI };