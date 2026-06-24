// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';

// 1. MOCK DEPENDENCIES
// We mock react-dom/client to spy on the render method
vi.mock('react-dom/client', () => ({
  default: {
    createRoot: vi.fn().mockReturnValue({
      render: vi.fn(),
    }),
  },
}));

// FIX 1: Add StyleSheet to the mock to prevent the crash
vi.mock('@react-pdf/renderer', () => ({
  Font: { register: vi.fn() },
  StyleSheet: { create: (styles: any) => styles }, // Simple pass-through mock
}));

// Mock Auth0 Provider
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children, domain, clientId }: any) => (
    <div data-testid="auth0-provider" data-domain={domain} data-client={clientId}>
      {children}
    </div>
  ),
}));

// Mock Router
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <div data-testid="router">{children}</div>,
}));

// FIX 2: Ensure the path to App is correct
// If this test file is in 'src/tests/', we must look up one level ('../App')
// If the mock path is wrong, Vitest loads the REAL App, which triggers the PDF crash.
vi.mock('../App', () => ({
  default: () => <div data-testid="app-component" />,
}));

// Mock Assets
vi.mock('../assets/Fonts/Calibri/calibri.ttf', () => ({ default: 'calibri-regular-path' }));
vi.mock('../assets/Fonts/Calibri/calibrib.ttf', () => ({ default: 'calibri-bold-path' }));
vi.mock('../assets/Fonts/Cambria/cambriab.ttf', () => ({ default: 'cambria-bold-path' }));

describe('Application Entry Point (main.tsx)', () => {
  const rootId = 'root';

  beforeEach(() => {
    vi.resetModules(); // Important: Allows importing main.tsx freshly for each test
    document.body.innerHTML = `<div id="${rootId}"></div>`;
    
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['font-data'])),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('initializes the React application with Auth0 and Router providers', async () => {
    // Setup Env Vars
    import.meta.env.VITE_AUTH0_DOMAIN = 'test-domain.com';
    import.meta.env.VITE_AUTH0_CLIENT_ID = 'test-client-id';
    import.meta.env.VITE_BASE_URL_FRONTEND = '/test-base';

    // ACT: Import the main file
    await import('../main'); // Note: importing from parent directory

    // ASSERT
    const ReactDOM = await import('react-dom/client');
    const rootElement = document.getElementById(rootId);
    
    // Check Root Creation
    expect(ReactDOM.default.createRoot).toHaveBeenCalledWith(rootElement);

    // Check Render Call
    const rootMock = (ReactDOM.default.createRoot as any).mock.results[0].value;
    expect(rootMock.render).toHaveBeenCalled();

    // Check what was rendered
    const renderedJsx = rootMock.render.mock.calls[0][0];
    expect(renderedJsx.props.domain).toBe('test-domain.com');
    expect(renderedJsx.props.clientId).toBe('test-client-id');
  });

  it('registers PDF fonts on startup', async () => {
    // Mock FileReader
    class MockFileReader {
      onloadend: any;
      readAsDataURL() {
        setTimeout(() => this.onloadend && this.onloadend(), 10);
      }
      result = 'data:font/ttf;base64,mock-data';
    }
    vi.stubGlobal('FileReader', MockFileReader);

    // ACT
    await import('../main');

    // ASSERT
    const { Font } = await import('@react-pdf/renderer');
    await waitFor(() => {
      expect(Font.register).toHaveBeenCalled();
    });
  });

  it('handles font loading errors gracefully', async () => {
    // Setup failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // ACT
    await import('../main');

    // ASSERT: App should still render despite font error
    const ReactDOM = await import('react-dom/client');
    const rootMock = (ReactDOM.default.createRoot as any).mock.results[0].value;
    
    expect(rootMock.render).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Error loading fonts:', expect.any(Error));
  });
});