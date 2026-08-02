// src/components/AIAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import { askAI } from '../services/aiService';

const AIAssistant = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const speechSynthRef = useRef(null);

  // Check voice support
  useEffect(() => {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSpeech = 'speechSynthesis' in window;
    const supported = hasRecognition && hasSpeech;
    setIsVoiceSupported(supported);
    
    if (hasSpeech) {
      speechSynthRef.current = window.speechSynthesis;
      // Pre-load voices
      window.speechSynthesis.getVoices();
      setTimeout(() => {
        window.speechSynthesis.getVoices();
      }, 100);
    }
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  // Initialize speech recognition
  const initRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        setQuestion(finalTranscript);
        setIsListening(false);
        setShowVoicePrompt(false);
        setInterimText('');
        // Auto-submit after voice input
        setTimeout(() => handleAsk(), 300);
      } else if (interimTranscript) {
        setInterimText(interimTranscript);
        setQuestion(interimTranscript + '...');
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setShowVoicePrompt(false);
      setInterimText('');
      if (event.error === 'not-allowed') {
        setQuestion('⚠️ Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        setQuestion('No speech detected. Please try again.');
        setTimeout(() => setQuestion(''), 2000);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setShowVoicePrompt(false);
      setInterimText('');
    };
    
    return recognition;
  };

  // Enable voice
  const enableVoice = () => {
    if (!isVoiceSupported) {
      alert('Voice features are not supported in this browser. Please use Safari on iOS or Chrome.');
      return;
    }
    
    setVoiceEnabled(true);
    setShowVoicePrompt(false);
    
    // Trigger silent speech to enable audio on iOS
    if (speechSynthRef.current) {
      const dummyUtterance = new SpeechSynthesisUtterance(' ');
      dummyUtterance.volume = 0;
      dummyUtterance.onend = () => {
        console.log('🔊 Voice enabled successfully');
      };
      speechSynthRef.current.speak(dummyUtterance);
      
      setTimeout(() => {
        speakText('Voice assistant activated. You can now speak to me.');
      }, 500);
    }
  };

  const disableVoice = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setVoiceEnabled(false);
    setIsSpeaking(false);
    setIsListening(false);
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (!voiceEnabled) {
      setShowVoicePrompt(true);
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setShowVoicePrompt(false);
      setInterimText('');
      return;
    }
    
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setShowVoicePrompt(true);
        setQuestion('🎤 Listening...');
        setInterimText('');
      } catch (error) {
        console.error('Voice recognition error:', error);
        setIsListening(false);
        setShowVoicePrompt(false);
        if (error.message.includes('already started')) {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
              setShowVoicePrompt(true);
            } catch (e) {
              console.error('Restart error:', e);
            }
          }, 100);
        }
      }
    }
  };

  // Speak text
  const speakText = (text) => {
    if (!voiceEnabled || !speechSynthRef.current) {
      return;
    }
    
    // Cancel any ongoing speech
    if (speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    
    // Try to get a female voice
    const voices = speechSynthRef.current.getVoices();
    if (voices.length > 0) {
      const femaleVoice = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('female'));
      utterance.voice = femaleVoice || voices[0];
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setTimeout(() => {
      try {
        speechSynthRef.current.speak(utterance);
      } catch (e) {
        console.warn('Speak error:', e);
        setIsSpeaking(false);
      }
    }, 100);
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  const handleAsk = async () => {
    if (!question.trim() || isListening) return;
    if (isRateLimited) {
      setConversation(prev => [...prev, { 
        type: 'ai', 
        content: '⏳ Please wait a moment before asking another question.' 
      }]);
      return;
    }
    
    const userQuestion = question;
    setConversation(prev => [...prev, { type: 'user', content: userQuestion }]);
    setLoading(true);
    setQuestion('');
    setInterimText('');
    
    try {
      const result = await askAI(userQuestion);
      
      if (result.includes('Quota limit') || result.includes('rate limit')) {
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), 60000);
      }
      
      setConversation(prev => [...prev, { type: 'ai', content: result }]);
      
      // Speak the response if voice is enabled
      if (voiceEnabled && result && !result.includes('Quota limit')) {
        speakText(result);
      }
    } catch (error) {
      setConversation(prev => [...prev, { 
        type: 'ai', 
        content: `⚠️ ${error.message || 'Something went wrong. Please try again.'}` 
      }]);
    }
    
    setLoading(false);
  };

  const quickQuestions = [
    { label: '🛣️ Route', question: "Best route from Kathmandu to Pokhara?" },
    { label: '🛡️ Safety', question: "Is Prithvi Highway safe today?" },
    { label: '🚦 Traffic', question: "Traffic in Kathmandu right now?" },
    { label: '⏰ Time', question: "Best time to travel Kathmandu to Pokhara?" },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <h3 className="text-white font-semibold">RoadDNA AI</h3>
          {isVoiceSupported && (
            <button
              onClick={voiceEnabled ? disableVoice : enableVoice}
              className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                voiceEnabled 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
              }`}
            >
              {voiceEnabled ? '🔊 Voice ON' : '🎤 Voice OFF'}
            </button>
          )}
          {isSpeaking && (
            <span className="text-xs text-purple-400 flex items-center gap-1 animate-pulse">
              🔊 Speaking...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRateLimited && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
              Waiting...
            </span>
          )}
          <span className={`text-xs flex items-center gap-1 ${
            loading ? 'text-yellow-400' : 'text-green-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
            }`}></span>
            {loading ? 'Thinking...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Voice Prompt */}
      {showVoicePrompt && (
        <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg animate-pulse">🎤</span>
              <div>
                <div className="text-yellow-400 text-sm font-semibold">
                  {isListening ? 'Listening...' : 'Tap to speak'}
                </div>
                <div className="text-gray-400 text-xs">
                  {isListening ? 'Speak your question now' : 'Click mic button to start'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                recognitionRef.current?.stop();
                setIsListening(false);
                setShowVoicePrompt(false);
                setQuestion('');
                setInterimText('');
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          {interimText && (
            <div className="mt-2 text-blue-400 text-sm italic">
              "{interimText}"
            </div>
          )}
        </div>
      )}

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-3 bg-[#0d1117] rounded-xl p-4 border border-white/5"
      >
        {conversation.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-10">
            <div className="text-4xl mb-3">🚗</div>
            <p className="text-white font-medium">Ask me about Nepal roads!</p>
            <p className="text-xs mt-2 text-gray-600">Try: "Best route from Kathmandu to Pokhara?"</p>
            {isVoiceSupported && voiceEnabled && (
              <p className="text-xs mt-1 text-green-400 animate-pulse">🎤 Tap the mic and speak your question</p>
            )}
            {isVoiceSupported && !voiceEnabled && (
              <p className="text-xs mt-1 text-blue-400">🎤 Tap "Voice ON" to enable voice input</p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuestion(q.question);
                    setTimeout(handleAsk, 200);
                  }}
                  className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversation.map((msg, index) => (
            <div key={index}>
              {msg.type === 'user' ? (
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-3 text-right">
                  <div className="text-xs text-blue-400">You</div>
                  <div className="text-white text-sm">{msg.content}</div>
                </div>
              ) : (
                <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-green-400 flex items-center gap-2">
                      RoadDNA AI
                      {voiceEnabled && isSpeaking && (
                        <span className="text-purple-400 text-[10px] animate-pulse">🔊 Speaking...</span>
                      )}
                    </div>
                    {voiceEnabled && (
                      <button
                        onClick={() => {
                          if (isSpeaking) stopSpeaking();
                          else speakText(msg.content);
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        title={isSpeaking ? "Stop speaking" : "Speak this response"}
                      >
                        {isSpeaking ? '🔇' : '🔊'}
                      </button>
                    )}
                  </div>
                  <div className="text-gray-300 text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-3">
            <div className="text-xs text-green-400">RoadDNA AI</div>
            <div className="text-gray-300 text-sm">⏳ Thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <div className="flex gap-2 w-full">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder={
              isListening ? "🎤 Listening..." : 
              isRateLimited ? "⏳ Please wait..." : 
              "Ask about Nepal roads..."
            }
            className={`flex-1 min-w-0 bg-[#0d1117] border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-all text-sm disabled:opacity-50 ${
              isListening ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 focus:border-blue-500/50'
            }`}
            disabled={loading || isRateLimited || isListening}
          />
          
          {/* Voice Input Button */}
          {isVoiceSupported && (
            <button
              onClick={toggleVoiceInput}
              disabled={loading || isRateLimited}
              className={`flex-shrink-0 px-3 py-3 rounded-xl transition-all ${
                isListening 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : voiceEnabled 
                    ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/50' 
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={voiceEnabled ? "Click to speak" : "Enable voice first"}
            >
              {isListening ? '🎤' : '🎙️'}
            </button>
          )}
          
          {/* Send Button */}
          <button
            onClick={handleAsk}
            disabled={loading || isRateLimited || !question.trim() || isListening}
            className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-80 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
          >
            {loading ? '⏳' : '🚀'}
          </button>
        </div>

        {/* Quick Buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(q.question);
                setTimeout(handleAsk, 200);
              }}
              disabled={isRateLimited}
              className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {q.label}
            </button>
          ))}
          {voiceEnabled && (
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                else {
                  const lastAI = conversation.filter(m => m.type === 'ai').pop();
                  if (lastAI) speakText(lastAI.content);
                }
              }}
              className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-purple-400 hover:text-white hover:bg-white/10 transition-all"
            >
              🔊 Repeat
            </button>
          )}
        </div>

        {/* Voice Status */}
        {isListening && (
          <div className="mt-2 text-center">
            <span className="text-xs text-blue-400 animate-pulse">🎤 Listening... Speak your question</span>
            <button 
              onClick={() => {
                recognitionRef.current?.stop();
                setIsListening(false);
                setShowVoicePrompt(false);
                setQuestion('');
                setInterimText('');
              }}
              className="ml-2 text-xs text-red-400 hover:text-red-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Voice Status Indicator */}
      {voiceEnabled && (
        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-2">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Voice enabled
          </span>
          <span>
            {isSpeaking ? '🔊 Speaking' : '🎤 Tap mic to speak'}
          </span>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;