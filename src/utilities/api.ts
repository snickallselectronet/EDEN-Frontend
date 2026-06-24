/**
 * Authenticated API client using axios with Auth0 token integration
 * 
 * This module provides:
 * - Pre-configured axios instance with authentication
 * - Automatic token attachment to requests
 * - Error handling for authentication failures
 * - Request/response interceptors
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthState, useAuthError } from '../hooks/useAuth';
import { useCallback, useMemo } from 'react';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_BASE_URL_BACKEND;

// Create base axios instance
const createBaseAxiosInstance = (): AxiosInstance => {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 second timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Hook that provides an authenticated axios instance
 */
export const useAuthenticatedApi = () => {
  const { isAuthenticated, getAccessToken } = useAuthState();
  const { handleAuthError, resetRetryCount } = useAuthError();

  const apiClient = useMemo(() => {
    const instance = createBaseAxiosInstance();

    // Request interceptor to add authentication token
    instance.interceptors.request.use(
      async (config) => {
        if (isAuthenticated) {
          try {
            const token = await getAccessToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } catch (error) {
            console.error('Failed to get access token:', error);
            // Let the request proceed without token - the backend will handle the 401
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle authentication errors
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Reset retry count on successful response
        resetRetryCount();
        return response;
      },
      (error: AxiosError) => {
        // Handle authentication errors
        const wasHandled = handleAuthError(error);
        
        if (!wasHandled) {
          // If the error wasn't handled by auth error handler, proceed normally
          return Promise.reject(error);
        }
        
        // If the error was handled (e.g., triggering re-authentication), 
        // we could optionally retry the request here or let the UI handle it
        return Promise.reject(error);
      }
    );

    return instance;
  }, [isAuthenticated, getAccessToken, handleAuthError, resetRetryCount]);

  return apiClient;
};

/**
 * Hook that provides common API methods with authentication
 */
export const useApi = () => {
  const apiClient = useAuthenticatedApi();

  const get = useCallback(
    async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    },
    [apiClient]
  );

  const post = useCallback(
    async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    },
    [apiClient]
  );

  const put = useCallback(
    async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    },
    [apiClient]
  );

  const del = useCallback(
    async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    },
    [apiClient]
  );

  return useMemo(() => ({
    get,
    post,
    put,
    delete: del,
    client: apiClient, // Direct access to axios instance if needed
  }), [get, post, put, del, apiClient]);
};

/**
 * Standard API client without authentication (for public endpoints)
 */
export const publicApiClient = createBaseAxiosInstance();

/**
 * Legacy support - provides direct axios instance
 * This can be used to gradually migrate existing code
 */
export const createAuthenticatedAxiosInstance = (getAccessToken: () => Promise<string | null>) => {
  const instance = createBaseAxiosInstance();

  instance.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get access token:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

// Export types for TypeScript support
export type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
};