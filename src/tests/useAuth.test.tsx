// @vitest-environment jsdom
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useAuth0 } from '@auth0/auth0-react';
import { jwtDecode } from 'jwt-decode';
import { useAuthState, useAuthenticatedApi, useAuthError } from '../hooks/useAuth';

// 1. Mock External Modules
vi.mock('@auth0/auth0-react');
vi.mock('jwt-decode');

describe('Auth Hooks Behavior', () => {
  const mockGetTokenSilently = vi.fn();
  const mockLoginWithRedirect = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: NOT authenticated
    (useAuth0 as Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      loginWithRedirect: mockLoginWithRedirect,
      logout: mockLogout,
      getAccessTokenSilently: mockGetTokenSilently,
    });

    (jwtDecode as Mock).mockReturnValue({});
  });

  // ==========================================================
  // 1. useAuthState (Core Logic)
  // ==========================================================
  describe('useAuthState', () => {
    it('defaults to safe values when not authenticated', async () => {
      const { result } = renderHook(() => useAuthState());

      // Fix "Act" warning: Wait for the initial effect to settle
      await waitFor(() => expect(result.current.permissions).toEqual([]));

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it('identifies an ADMIN user based on namespaced roles', async () => {
      (useAuth0 as Mock).mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetTokenSilently,
        user: {
          name: 'Steve',
          'https://electronetclientportal.com/user/roles': ['ELECTRONET_ADMIN'],
        },
      });
      // Mock token call to prevent "Act" warning
      mockGetTokenSilently.mockResolvedValue('token');

      const { result } = renderHook(() => useAuthState());

      // Wait for the async permission check to finish even if we don't use it
      await waitFor(() => expect(result.current.permissions).toBeDefined());

      expect(result.current.isAdmin).toBe(true);
    });

    it('decodes access token to find permissions (Async)', async () => {
      (useAuth0 as Mock).mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetTokenSilently,
        user: { sub: '123' },
      });

      mockGetTokenSilently.mockResolvedValue('fake-token');
      (jwtDecode as Mock).mockReturnValue({ permissions: ['approver'] });

      const { result } = renderHook(() => useAuthState());

      await waitFor(() => {
        expect(result.current.permissions).toContain('approver');
      });

      expect(result.current.canApprove).toBe(true);
      expect(result.current.canReview).toBe(true);
    });
  });

  // ==========================================================
  // 2. useAuthenticatedApi (API Prep)
  // ==========================================================
  describe('useAuthenticatedApi', () => {
    it('generates headers with Bearer token', async () => {
      (useAuth0 as Mock).mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetTokenSilently,
      });
      mockGetTokenSilently.mockResolvedValue('secret-token');

      const { result } = renderHook(() => useAuthenticatedApi());
      
      // Wait for hook to stabilize
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      const headers = await result.current.getAuthHeaders();
      expect(headers).toEqual({
        Authorization: 'Bearer secret-token',
        'Content-Type': 'application/json',
      });
    });
  });

  // ==========================================================
  // 3. useAuthError (Retry Logic) - NEW TESTS
  // ==========================================================
  describe('useAuthError', () => {
    it('ignores non-401 errors', async () => {
      (useAuth0 as Mock).mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetTokenSilently,
        loginWithRedirect: mockLoginWithRedirect,
      });
      
      const { result } = renderHook(() => useAuthError());
      
      // wait for useAuthState inside to settle
      await waitFor(() => expect(mockGetTokenSilently).toHaveBeenCalled());

      const handled = result.current.handleAuthError({ response: { status: 500 } });
      
      expect(handled).toBe(false);
      expect(mockLoginWithRedirect).not.toHaveBeenCalled();
    });

    it('triggers login retry on 401 error', async () => {
      (useAuth0 as Mock).mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetTokenSilently,
        loginWithRedirect: mockLoginWithRedirect,
      });

      const { result } = renderHook(() => useAuthError());
      await waitFor(() => expect(mockGetTokenSilently).toHaveBeenCalled());

      // Act: Simulate a 401 error
      act(() => {
        const handled = result.current.handleAuthError({ response: { status: 401 } });
        expect(handled).toBe(true);
      });

      expect(mockLoginWithRedirect).toHaveBeenCalled();
      expect(result.current.retryCount).toBe(1);
    });

    it('stops retrying after max limit (3)', async () => {
      (useAuth0 as Mock).mockReturnValue({
        isAuthenticated: true,
        getAccessTokenSilently: mockGetTokenSilently,
        loginWithRedirect: mockLoginWithRedirect,
      });

      const { result } = renderHook(() => useAuthError());
      await waitFor(() => expect(mockGetTokenSilently).toHaveBeenCalled());

      // Simulate 3 retries
      act(() => { result.current.handleAuthError({ response: { status: 401 } }); });
      act(() => { result.current.handleAuthError({ response: { status: 401 } }); });
      act(() => { result.current.handleAuthError({ response: { status: 401 } }); });
      
      expect(result.current.retryCount).toBe(3);

      // 4th attempt should fail
      let handled;
      act(() => {
         handled = result.current.handleAuthError({ response: { status: 401 } });
      });

      expect(handled).toBe(false); // Should not handle it anymore
      expect(mockLoginWithRedirect).toHaveBeenCalledTimes(3); // Should not call login 4th time
    });
  });
});