'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { User } from '@/types/user.type';
import { getMe } from '@/services/user.service';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

type AuthAction = 
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: { user: User } }
  | { type: 'UPDATE_USER'; payload: { user: User } };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

const AuthReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.token);
      // We only store the token now, user profile will be fetched
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user, // Keep initial user data
        token: action.payload.token,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'SET_USER':
        return {
            ...state,
            isAuthenticated: true,
            user: action.payload.user,
        };
    case 'UPDATE_USER':
      if (state.user) {
        return {
          ...state,
          user: { ...state.user, ...action.payload.user }
        };
      }
      return state;
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  loading: boolean; // Add loading to context
} | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(AuthReducer, initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const user = await getMe();
                dispatch({ type: 'SET_USER', payload: { user } });
            } catch (error) {
                console.error("Failed to fetch user profile, logging out.", error);
                dispatch({ type: 'LOGOUT' });
            }
        }
        setLoading(false);
    };
    
    initializeAuth();
  }, []);

  // We don't need to render a spinner here anymore, the consumer will do it.
  // if (isLoading) {
  //   return null; // Or a loading spinner
  // }

  return (
    <AuthContext.Provider value={{ state, dispatch, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 