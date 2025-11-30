import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../firebase';

interface HistoryProps {
  user: User;
  onClose: () => void;
  onSelectImage: (imageUrl: string, prompt: string) => void;
}

interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: number;
}

export const History: React.FC<HistoryProps> = ({ user, onClose, onSelectImage }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const historyRef = ref(db, `history/${user.uid}`);
    const historyQuery = query(historyRef, orderByChild('createdAt'), limitToLast(50));
    
    // onValue receives a snapshot callback AND an error callback
    const unsubscribe = onValue(historyQuery, 
      (snapshot) => {
        try {
            const data = snapshot.val();
            if (data) {
                const loadedHistory: HistoryItem[] = Object.entries(data)
                .map(([id, value]) => ({ id, ...(value as Omit<HistoryItem, 'id'>) }))
                .sort((a, b) => b.createdAt - a.createdAt); // Sort descending by time
                setHistory(loadedHistory);
            } else {
                setHistory([]);
            }
            setError(null);
        } catch (e) {
            console.error("Error processing history data:", e);
            setError("Failed to process history data.");
        } finally {
            setLoading(false);
        }
      }, 
      (err) => {
        console.error("Firebase history read failed:", err);
        setError("Could not load history. Please check your connection.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm h-[80vh] bg-gray-800 border-4 border-gray-900 rounded-2xl p-4 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="font-orbitron text-xl font-bold text-yellow-300">HISTORY</h2>
            <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400">&times;</button>
        </div>
        <div className="flex-grow bg-gray-900/50 rounded-lg p-2 overflow-y-auto">
          {loading ? (
             <div className="flex items-center justify-center h-full text-green-300">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-300"></div>
             </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 text-center p-4">
                <p className="font-bold mb-2">Error</p>
                <p className="text-sm">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center h-full text-green-400 text-center">
                <p>No images generated yet.<br/>Your history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="bg-black/20 rounded-lg p-2 flex items-center gap-3 cursor-pointer hover:bg-black/40" onClick={() => onSelectImage(item.imageUrl, item.prompt)}>
                  <img src={item.imageUrl} alt={item.prompt} className="w-16 h-16 object-cover rounded-md flex-shrink-0" loading="lazy" />
                  <div className="overflow-hidden">
                    <p className="text-green-300 text-sm truncate" title={item.prompt}>{item.prompt}</p>
                    <p className="text-green-500 text-xs">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};