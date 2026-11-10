import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const TOKEN_KEY = 'annaseva_token';
const USER_KEY = 'annaseva_user';

// createContext makes the "shared backpack". null is the default when no provider exists.
const AuthContext = createContext(null);

// Read the saved user from the browser's storage (it may be missing or corrupted).
function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // Passing a FUNCTION to useState means it runs only once, on the first render.
  const [user, setUser] = useState(readSavedUser);
  // "loading" is true until we've double-checked the saved token with the server.
  const [loading, setLoading] = useState(true);

  function saveSession({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user)); // storage only holds text, hence stringify
    setUser(user);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  // On first load: if a token exists, ask the server "who am I?" to confirm it's still valid.
  useEffect(() => {
    async function confirmSession() {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        clearSession(); // token expired or tampered with
      } finally {
        setLoading(false); // finally runs whether it worked or failed
      }
    }
    confirmSession();
  }, []); // [] = run once, when the app first appears

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data);
    return data.user;
  }

  async function register(form) {
    const { data } = await api.post('/auth/register', form);
    saveSession(data);
    return data.user;
  }

  // Everything inside value={...} becomes available to any component calling useAuth().
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout: clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// A small custom hook so components write useAuth() instead of useContext(AuthContext).
export function useAuth() {
  return useContext(AuthContext);
}
