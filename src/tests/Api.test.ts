// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import axios from 'axios';
import { useAuthenticatedApi, useApi } from '../utilities/api';
import { useAuthState, useAuthError } from '../hooks/useAuth';

// 1. Mock External Dependencies
vi.mock('axios');
vi.mock('../hooks/useAuth');

describe('API Utilities', () => {
  // Mocks for Auth Hooks
  const mockGetAccessToken = vi.fn();
  const mockHandleAuthError = vi.fn();
  const mockResetRetryCount = vi.fn();

  // Mocks for Axios
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default Axios Create behavior
    (axios.create as Mock).mockReturnValue(mockAxiosInstance);

    // Setup default Auth Hook behavior
    (useAuthState as Mock).mockReturnValue({
      isAuthenticated: true,
      getAccessToken: mockGetAccessToken,
    });

    (useAuthError as Mock).mockReturnValue({
      handleAuthError: mockHandleAuthError,
      resetRetryCount: mockResetRetryCount,
    });
  });

  describe('useAuthenticatedApi', () => {
    it('creates an axios instance with the correct configuration', async () => {
      // 1. Reset modules to clear the "undefined" value cached at startup
      vi.resetModules();

      // 2. Set the env var
      import.meta.env.VITE_BASE_URL_BACKEND = 'https://api.test.com';

      // 3. Dynamically import the hook so it reads the Env Var *now*
      const { useAuthenticatedApi } = await import('../utilities/api');

      renderHook(() => useAuthenticatedApi());

      expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
        baseURL: 'https://api.test.com',
        timeout: 30000,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }));
    });

    it('INTERCEPTOR: Attaches Bearer token to requests when authenticated', async () => {
      // 1. Setup
      mockGetAccessToken.mockResolvedValue('fake-token-123');
      renderHook(() => useAuthenticatedApi());

      // 2. Capture the interceptor function registered by your code
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];

      // 3. Execute the interceptor manually with a fake config
      const config = await requestInterceptor({ headers: {} });

      // 4. Assert behavior
      expect(config.headers.Authorization).toBe('Bearer fake-token-123');
    });

    it('INTERCEPTOR: Does NOT attach token if user is not authenticated', async () => {
      // 1. Setup: User logged out
      (useAuthState as Mock).mockReturnValue({
        isAuthenticated: false,
        getAccessToken: mockGetAccessToken,
      });
      renderHook(() => useAuthenticatedApi());

      // 2. Capture interceptor
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];

      // 3. Execute
      const config = await requestInterceptor({ headers: {} });

      // 4. Assert
      expect(config.headers.Authorization).toBeUndefined();
      expect(mockGetAccessToken).not.toHaveBeenCalled();
    });

    it('INTERCEPTOR: Resets retry count on successful response', () => {
      renderHook(() => useAuthenticatedApi());

      // Capture Response Interceptor (success handler is the first arg)
      const responseSuccessInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];

      // Execute with a fake response
      const fakeResponse = { status: 200, data: 'ok' };
      const result = responseSuccessInterceptor(fakeResponse);

      expect(mockResetRetryCount).toHaveBeenCalled();
      expect(result).toBe(fakeResponse);
    });

    it('INTERCEPTOR: Delegates 401 errors to handleAuthError', async () => {
      renderHook(() => useAuthenticatedApi());

      // Capture Response Interceptor (error handler is the second arg)
      const responseErrorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

      // Fake 401 Error
      const fakeError = { response: { status: 401 } };
      
      // Setup handler to return TRUE (meaning it handled the error/retry)
      mockHandleAuthError.mockReturnValue(true);

      // Execute
      try {
        await responseErrorInterceptor(fakeError);
      } catch (e) {
        // Your code returns Promise.reject(error) even if handled, 
        // so we expect it to throw.
        expect(mockHandleAuthError).toHaveBeenCalledWith(fakeError);
      }
    });
  });

  describe('useApi (Helper Methods)', () => {
    it('unwraps the response data on GET requests', async () => {
      // Setup the underlying axios mock to return a full AxiosResponse
      mockAxiosInstance.get.mockResolvedValue({ 
        data: { id: 1, name: 'Test Data' }, 
        status: 200, 
        statusText: 'OK' 
      });

      const { result } = renderHook(() => useApi());

      // Call the helper
      const data = await result.current.get('/users');

      // Assert it called axios correctly
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users', undefined);
      
      // Assert it returned ONLY the data object (Behavior check)
      expect(data).toEqual({ id: 1, name: 'Test Data' });
    });

    it('passes data correctly on POST requests', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useApi());

      const payload = { name: 'New Item' };
      await result.current.post('/items', payload);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/items', payload, undefined);
    });
  });
});