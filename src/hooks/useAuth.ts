/**
 * Custom hook for handling Auth0 authentication and API calls
 *
 * This hook provides:
 * - Access to Auth0 authentication state
 * - Helper functions for getting access tokens
 * - User information from Auth0 (company, roles, permissions)
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  company: string | null;
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
  canApprove: boolean;
  canReview: boolean;
  error: Error | null;
}

export interface AuthActions {
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  getAccessTokenSilently: (options?: any) => Promise<any>;
}

/**
 * Main authentication hook that combines Auth0 state and helpers
 */
export const useAuthState = (): AuthState & AuthActions => {
  const {
    isAuthenticated,
    isLoading,
    user,
    error,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [authError, setAuthError] = useState<Error | null>(error ?? null);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    setAuthError(error ?? null);
  }, [error]);

  const login = useCallback(() => {
    loginWithRedirect();
  }, [loginWithRedirect]);

  const logout = useCallback(() => {
    auth0Logout({
      logoutParams: { returnTo: window.location.origin },
    });
  }, [auth0Logout]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated) return null;
    try {
      return await getAccessTokenSilently();
    } catch (e) {
      setAuthError(e as Error);
      return null;
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // Namespaced custom-claim prefix
  const ns = useMemo(() => 'https://electronetclientportal.com/user/', []);

  // Extract namespaced claims from the ID token (user object)
  const company = user?.[ns + 'company'] || null;
  const roles: string[] = user?.[ns + 'roles'] || [];

  // Decode the Access Token to get the permissions array
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isAuthenticated) {
        setPermissions([]);
        return;
      }
      try {
        const token = await getAccessTokenSilently();
        const decoded = jwtDecode<{ permissions?: string[] }>(token);
        if (!cancelled) {
          setPermissions(decoded.permissions ?? []);
        }
      } catch {
        if (!cancelled) setPermissions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, getAccessTokenSilently]);

  // Derived flags
  const isAdmin = roles.includes('ELECTRONET_ADMIN');
  const canApprove = permissions.includes('approver');
  const canReview = permissions.includes('reviewer') || canApprove;

  return {
    isAuthenticated,
    isLoading,
    user,
    company,
    roles,
    permissions,
    isAdmin,
    canApprove,
    canReview,
    error: authError,
    login,
    logout,
    getAccessToken,
    getAccessTokenSilently: (options?: any) => getAccessTokenSilently(options),
  };
};

/**
 * Hook for API-specific authentication needs
 */
export const useAuthenticatedApi = () => {
  const { isAuthenticated, getAccessToken } = useAuthState();

  const getAuthHeaders = useCallback(async () => {
    if (!isAuthenticated) throw new Error('User not authenticated');

    const token = await getAccessToken();
    if (!token) throw new Error('Unable to get access token');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [isAuthenticated, getAccessToken]);

  const isReady = isAuthenticated;

  return {
    getAuthHeaders,
    isReady,
    isAuthenticated,
  };
};

/**
 * Hook for handling authentication errors and retries
 */
export const useAuthError = () => {
  const { login, isAuthenticated } = useAuthState();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleAuthError = useCallback(
    (error: any) => {
      if (error.response?.status === 401 && isAuthenticated && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        login();
        return true;
      }
      return false;
    },
    [login, isAuthenticated, retryCount, maxRetries]
  );

  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
  }, []);

  return { handleAuthError, resetRetryCount, retryCount, maxRetries };
};
