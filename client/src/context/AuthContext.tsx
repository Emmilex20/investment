/* eslint-disable no-irregular-whitespace */
// client/src/context/AuthContext.tsx (NO CHANGES NEEDED, it correctly handles Partial<User> update)

import React, { 
    createContext, 
    useReducer, 
    useContext, 
    useMemo, // <-- NEW IMPORT
    useCallback, // <-- NEW IMPORT
    type ReactNode 
} from 'react';
import type { User, AuthState } from '../types/userTypes'; 

// --- 1. Initial State and Reducer ---

const initialUserInfo: User | null = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo')!) as User
  : null;

const initialState: AuthState = {
  userInfo: initialUserInfo,
  loading: false,
  error: null,
};

type Action = 
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }; 

const authReducer = (state: AuthState, action: Action): AuthState => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('userInfo', JSON.stringify(action.payload)); 
      return { ...state, loading: false, userInfo: action.payload, error: null };
    case 'LOGIN_FAIL':
      return { ...state, loading: false, error: action.payload, userInfo: null };
    case 'LOGOUT':
      localStorage.removeItem('userInfo'); 
      return { ...state, userInfo: null, error: null };
    case 'UPDATE_PROFILE': {
        if (!state.userInfo) return state;
        
        const updatedUserInfo = {
            ...state.userInfo, 
            ...action.payload 
        } as User;
        
        localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        
        return {
            ...state,
            userInfo: updatedUserInfo,
        };
    }
    default:
      return state;
  }
};

// --- 2. Context Creation ---

interface AuthContextType extends AuthState {
    dispatch: React.Dispatch<Action>;
    login: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 3. Provider Component (UPDATED with Memoization) ---

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 1. Memoize functions with useCallback
  // dispatch is guaranteed stable by React, so we use an empty dependency array.
  const login = useCallback((user: User) => {
    dispatch({ type: 'LOGIN_SUCCESS', payload: user });
  }, [dispatch]); // Include dispatch in deps, though it's technically stable

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, [dispatch]); // Include dispatch in deps, though it's technically stable

  // 2. Memoize the entire context value object with useMemo
  // This ensures the object reference only changes when 'state' or the memoized functions change.
  const contextValue = useMemo(() => ({
      ...state, 
      dispatch, 
      login, 
      logout 
  }), [state, dispatch, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- 4. Custom Hook for easy access ---

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};