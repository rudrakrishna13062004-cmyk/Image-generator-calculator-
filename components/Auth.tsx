import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (errCode: string) => {
    switch (errCode) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'Account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setLoading(false);
        return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto bg-gray-800 border-4 border-gray-900 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="text-center">
            <h1 className="font-orbitron text-2xl font-bold text-yellow-300">IMAGEN-82</h1>
            <p className="text-green-400 text-sm mt-1">{isLogin ? 'Login to continue' : 'Create an account'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-gray-900 text-green-300 placeholder-green-700/80 border-2 border-gray-700 rounded-md p-2 focus:ring-yellow-400 focus:border-yellow-400 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-gray-900 text-green-300 placeholder-green-700/80 border-2 border-gray-700 rounded-md p-2 focus:ring-yellow-400 focus:border-yellow-400 focus:outline-none"
          />
          
          {error && <p className="text-red-400 text-xs text-center font-bold bg-red-900/30 p-1 rounded">{error}</p>}
          
          <button type="submit" disabled={loading} className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xl rounded-lg shadow-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
            {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div> : (isLogin ? '=' : '+')}
          </button>
        </form>

        <div className="text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-green-400 hover:text-yellow-300 text-sm">
            {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};