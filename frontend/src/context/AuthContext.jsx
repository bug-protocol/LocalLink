import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const initialState = {
  user: null,
  vendorProfile: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null,
};

const AUTH_ACTIONS = {
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_SUCCESS:
    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      if (action.payload.token) localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        vendorProfile: action.payload.vendorProfile || null,
        token: action.payload.token || state.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.AUTH_FAILURE:
      localStorage.removeItem('token');
      return { ...state, user: null, vendorProfile: null, token: null, isAuthenticated: false, loading: false, error: action.payload };

    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      localStorage.removeItem('token');
      return { ...state, user: null, vendorProfile: null, token: null, isAuthenticated: false, loading: false, error: null };

    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return { ...state, user: null, vendorProfile: null, token: null, isAuthenticated: false, loading: false, error: null };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return { ...state, user: { ...state.user, ...action.payload } };

    default:
      return state;
  }
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE });
        return;
      }
      try {
        const response = await authService.getProfile();
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: response.data });
      } catch {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE });
      }
    };
    loadUser();
  }, []);

  // Register — creates account and logs in immediately
  const register = useCallback(async (userData) => {
    try {
      const response = await authService.register(userData);
      dispatch({ type: AUTH_ACTIONS.AUTH_SUCCESS, payload: response.data });
      return { success: true, user: response.data.user };
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const errorMessage = validationErrors?.length
        ? validationErrors[0].msg
        : error.response?.data?.message || 'Registration failed.';
      dispatch({ type: AUTH_ACTIONS.AUTH_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Login
  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials);
      dispatch({ type: AUTH_ACTIONS.AUTH_SUCCESS, payload: response.data });
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed.';
      dispatch({ type: AUTH_ACTIONS.AUTH_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE, payload: response.data.user });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Profile update failed.' };
    }
  }, []);

  const value = { ...state, login, register, logout, clearError, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
