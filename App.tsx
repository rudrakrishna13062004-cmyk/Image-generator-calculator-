import React, { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, push, serverTimestamp } from 'firebase/database';
// FIX: Import GoogleGenAI for image generation.
import { GoogleGenAI } from '@google/genai';

import { CalculatorDisplay } from './components/CalculatorDisplay';
import { CalculatorButton } from './components/CalculatorButton';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { STYLE_KEYWORDS } from './constants';
import { auth, db } from './firebase';
import { Auth } from './components/Auth';
import { History } from './components/History';

// FIX: Initialize Gemini API client. API key is expected to be in environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  // FIX: Removed generationTimeoutRef as it's no longer needed with async/await and API error handling.

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // FIX: Removed useEffect for clearing timeout, as timeout logic is removed.
  
  const handleLogout = () => {
    signOut(auth);
  };

  // FIX: Refactored to use Gemini API for image generation.
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 820);
      return;
    }
    
    if (!navigator.onLine) {
      setError("You're offline. Please check your connection.");
      return;
    }

    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      let foundImage = false;
      if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const base64EncodeString: string = part.inlineData.data;
            const newImageUrl = `data:image/png;base64,${base64EncodeString}`;
            setImageUrl(newImageUrl);
            foundImage = true;
            
            // Save to history (non-blocking)
            if (user) {
              try {
                const historyRef = ref(db, `history/${user.uid}`);
                push(historyRef, {
                  prompt: prompt,
                  imageUrl: newImageUrl,
                  createdAt: serverTimestamp()
                });
              } catch (dbErr) {
                console.error("Failed to save to history:", dbErr);
                // Do not show error to user if image generated successfully but history save failed
              }
            }
            break; 
          }
        }
      }

      if (!foundImage) {
        // Check for finishReason to give a better error
        const candidate = response.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
             setError('Safety Block: Prompt violated content policies.');
        } else {
             setError('No image generated. Please try a different prompt.');
        }
      }
    } catch (e: any) {
      console.error('Gemini API call failed:', e);
      const errString = e.toString().toLowerCase();
      
      if (errString.includes('401') || errString.includes('api key')) {
        setError('Configuration Error: Invalid API Key.');
      } else if (errString.includes('429') || errString.includes('quota')) {
        setError('Quota Exceeded: Too many requests. Try again later.');
      } else if (errString.includes('503') || errString.includes('overloaded')) {
        setError('Service Overloaded: Please wait a moment.');
      } else if (errString.includes('safety') || errString.includes('blocked')) {
        setError('Safety Block: Prompt violated content policies.');
      } else if (errString.includes('network') || errString.includes('fetch')) {
        setError('Network Error: Check your internet connection.');
      } else {
        setError('Generation failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, user, aspectRatio]);

  const handleClear = () => {
    setPrompt('');
    setImageUrl(null);
    setIsLoading(false);
    setError(null);
  };

  const handleAppendKeyword = (keyword: string, key: string) => {
    setPrompt(prev => `${prev} ${keyword}`.trim());
    if (error) setError(null);
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 200);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    if (error) {
      setError(null);
    }
  };

  const handleDownload = useCallback(() => {
    if (!imageUrl) {
        setError("Cannot download, no image has been generated.");
        return;
    }
    setError(null);

    try {
        const link = document.createElement('a');
        link.href = imageUrl;
        const fileName = `imagen82_${prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.png`;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error('Download failed:', err);
        setError('Could not initiate download.');
    }
  }, [imageUrl, prompt]);
  
  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="font-orbitron text-yellow-300 text-xl animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      {showHistory && <History user={user} onClose={() => setShowHistory(false)} onSelectImage={(imgUrl, p) => { setImageUrl(imgUrl); setPrompt(p); setShowHistory(false); }} />}
      <div className="min-h-screen bg-gray-300 flex items-center justify-center p-4">
        <div className="w-full max-w-sm mx-auto bg-gray-800 border-4 border-gray-900 rounded-2xl p-4 shadow-2xl space-y-4">
          <div className="flex justify-between items-center px-2">
            <h1 className="font-orbitron text-xl font-bold text-yellow-300">IMAGEN-82</h1>
            <div className="text-right">
              <p className="text-xs text-green-400 truncate" title={user.email ?? ''}>{user.email}</p>
              <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto">
                <LogoutIcon className="h-3 w-3" />
                Logout
              </button>
            </div>
          </div>

          <div className="bg-black/30 p-2 rounded-lg">
            <CalculatorDisplay imageUrl={imageUrl} isLoading={isLoading} error={error} />
            
            <div className="flex justify-end items-center mt-2 px-1">
              <label htmlFor="aspect-ratio" className="text-green-600 font-orbitron text-[10px] mr-2">RATIO:</label>
              <select
                id="aspect-ratio"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="bg-gray-900 text-green-400 border border-green-800 font-orbitron text-xs rounded px-1 py-0.5 focus:outline-none focus:border-green-500 cursor-pointer uppercase shadow-sm"
              >
                <option value="1:1">1:1 (SQ)</option>
                <option value="16:9">16:9 (L)</option>
                <option value="4:3">4:3 (L)</option>
                <option value="3:4">3:4 (P)</option>
                <option value="9:16">9:16 (P)</option>
              </select>
            </div>

            <div className={`mt-2 p-2 bg-gray-900 rounded-md shadow-inner transition-all duration-100 ${error ? 'ring-2 ring-red-500' : ''} ${isShaking ? 'animate-shake' : ''}`}>
              <input
                type="text"
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Type your prompt..."
                className="w-full bg-transparent text-green-300 placeholder-green-700/80 border-0 focus:ring-0 text-sm"
                aria-invalid={!!error}
                aria-describedby="prompt-error"
              />
              <div className="h-1 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 mt-1 rounded-full opacity-50"></div>
            </div>
            {error && <p id="prompt-error" className="text-red-400 text-xs text-center mt-2 font-bold">{error}</p>}
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            <CalculatorButton onClick={handleClear} className="bg-red-700 hover:bg-red-600"> C </CalculatorButton>
            <CalculatorButton onClick={() => setShowHistory(true)} className="bg-purple-600 hover:bg-purple-500">
               <HistoryIcon className="h-6 w-6 text-white"/>
            </CalculatorButton>
            <CalculatorButton onClick={handleDownload} disabled={!imageUrl} className={imageUrl ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700'}>
              <DownloadIcon className="h-6 w-6 text-white"/>
            </CalculatorButton>
            <CalculatorButton onClick={() => handleAppendKeyword('Photorealistic', 'P')} isPressed={pressedKey === 'P'} className="bg-gray-700">P</CalculatorButton>
            
            {['7', '8', '9'].map(num => (
              <CalculatorButton key={num} onClick={() => handleAppendKeyword(STYLE_KEYWORDS[num], num)} isPressed={pressedKey === num}> {num} </CalculatorButton>
            ))}
            <CalculatorButton onClick={() => handleAppendKeyword('Anime', 'A')} isPressed={pressedKey === 'A'} className="bg-gray-700">A</CalculatorButton>

            {['4', '5', '6'].map(num => (
              <CalculatorButton key={num} onClick={() => handleAppendKeyword(STYLE_KEYWORDS[num], num)} isPressed={pressedKey === num}> {num} </CalculatorButton>
            ))}
            <CalculatorButton onClick={() => handleAppendKeyword('Oil Painting', 'O')} isPressed={pressedKey === 'O'} className="bg-gray-700">O</CalculatorButton>
            
            {['1', '2', '3'].map(num => (
              <CalculatorButton key={num} onClick={() => handleAppendKeyword(STYLE_KEYWORDS[num], num)} isPressed={pressedKey === num}> {num} </CalculatorButton>
            ))}
            <div className="row-span-2">
              <CalculatorButton onClick={handleGenerate} className="bg-orange-600 hover:bg-orange-500 h-full w-full"> = </CalculatorButton>
            </div>

            {['0'].map(num => (
              <CalculatorButton key={num} onClick={() => handleAppendKeyword(STYLE_KEYWORDS[num], num)} isPressed={pressedKey === num}> {num} </CalculatorButton>
            ))}
            <CalculatorButton onClick={() => handleAppendKeyword('Watercolor', 'W')} isPressed={pressedKey === 'W'} className="bg-gray-700">W</CalculatorButton>
            <CalculatorButton onClick={() => handleAppendKeyword('Vector', 'V')} isPressed={pressedKey === 'V'} className="bg-gray-700">V</CalculatorButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;