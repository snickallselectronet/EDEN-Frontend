// @vitest-environment jsdom
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import App from '../App';
import { useApi } from '../utilities/api';

// -------------------------------------------------------------------------
// 1. MOCK CHILD COMPONENTS
// (We inline the mocks to avoid hoisting errors)
// -------------------------------------------------------------------------

vi.mock('../components/Header', () => ({ 
  __esModule: true,
  default: ({ handleSiteChange }: any) => (
    <div data-testid="header">
      <button onClick={() => handleSiteChange('home')}>Go Home</button>
    </div>
  ) 
}));

// Basic UI Mocks
vi.mock('../components/SummaryComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="summary" /> 
}));
vi.mock('../components/SectionHiderComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="section-hider" /> 
}));
vi.mock('../components/QAPanel', () => ({ 
  __esModule: true,
  default: () => <div data-testid="qa-panel" /> 
}));

// PDF Component Mock
vi.mock('../components/PDFComponent', () => ({
  __esModule: true,
  default: () => <div data-testid="pdf-doc" />
}));

// Content Component Mocks
vi.mock('../components/VTComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="vt-content" /> 
}));
vi.mock('../components/EPRComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="epr-content" /> 
}));
vi.mock('../components/ContinuityComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="con-content" /> 
}));
vi.mock('../components/CTVTInspectionComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="ctvt-content" /> 
}));
vi.mock('../components/TouchAndStepComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="ts-content" /> 
}));
vi.mock('../components/CurrentDistComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="current-dist-content" /> 
}));
vi.mock('../components/VisualInspectionComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="visual-content" /> 
}));
vi.mock('../components/MitigationComponent', () => ({ 
  __esModule: true,
  default: () => <div data-testid="mitigation-content" /> 
}));
vi.mock('../components/AdminProcessing', () => ({ 
  __esModule: true,
  default: () => <div data-testid="admin-processing" /> 
}));

// Library Mocks
vi.mock('@react-pdf/renderer', () => ({
  PDFViewer: ({ children }: any) => <div data-testid="pdf-viewer">{children}</div>,
  Font: { register: vi.fn() },
  StyleSheet: { create: (styles: any) => styles },
}));

// FIX: Correctly mock React Bootstrap Modal with sub-components
vi.mock('react-bootstrap/Modal', () => {
  const Modal = ({ children, show }: any) => show ? <div data-testid="pdf-modal">{children}</div> : null;
  // Attach sub-components to the main Modal function
  Modal.Header = ({ children }: any) => <div>{children}</div>;
  Modal.Title = ({ children }: any) => <div>{children}</div>;
  
  return { 
    __esModule: true,
    default: Modal
  };
});

// -------------------------------------------------------------------------
// 2. MOCK HOOKS & UTILS
// -------------------------------------------------------------------------
vi.mock('@auth0/auth0-react');
vi.mock('../utilities/api');
vi.mock('chart.js/auto');
vi.mock('chart.js', () => ({
  CategoryScale: {},
  Chart: { register: vi.fn() } 
}));

describe('App & Navigation Orchestration', () => {
  const mockLoginWithRedirect = vi.fn();
  const mockApiGet = vi.fn();
  const mockApiPost = vi.fn();

  const mockAllSites = [
    ['SiteA', 'Client A', '2023-01-01', 'Rev01', 'ID1', {}],
    ['SiteB', 'Client B', '2023-02-01', 'Rev00', 'ID2', {}],
  ];

  const mockSiteData = {
    name: 'SiteA',
    qaStatus: [],
    VTRecord: { data: true },
    CurrentDistRecord: { data: true },
    EPRRecord: { data: true },
    TSRecord: { data: true },
    ConRecord: { data: true },
    CTInspRecord: { data: true },
    VisualInspectionRecord: { data: true },
    MitigationSelection: [],
    injected_I: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.VITE_BASE_URL_FRONTEND = 'http://localhost';

    (useAuth0 as Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      loginWithRedirect: mockLoginWithRedirect,
      user: null,
    });

    (useApi as Mock).mockReturnValue({
      client: {},
      get: mockApiGet,
      post: mockApiPost,
    });
  });

  // =========================================================================
  // SCENARIO 1: Authentication Logic
  // =========================================================================
  it('shows loading screen when Auth0 is initializing', () => {
    (useAuth0 as Mock).mockReturnValue({ isLoading: true });
    render(<App />);
    expect(screen.getByText(/loading user/i)).toBeInTheDocument();
  });

  it('redirects to login if user is NOT authenticated', () => {
    (useAuth0 as Mock).mockReturnValue({ 
      isLoading: false, 
      isAuthenticated: false, 
      loginWithRedirect: mockLoginWithRedirect 
    });
    
    render(<App />);
    expect(mockLoginWithRedirect).toHaveBeenCalled();
  });

  // =========================================================================
  // SCENARIO 2: Dashboard (Site List)
  // =========================================================================
  it('renders the Site List when authenticated and on home route', async () => {
    (useAuth0 as Mock).mockReturnValue({ 
      isLoading: false, 
      isAuthenticated: true, 
      user: { name: 'Steve' } 
    });

    mockApiGet.mockResolvedValue(mockAllSites);

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading site/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Select Site')).toBeInTheDocument();
    });

    expect(screen.getByText('SiteA')).toBeInTheDocument();
    expect(screen.getByText('Client: Client A')).toBeInTheDocument();
  });

  // =========================================================================
  // SCENARIO 3: Navigation & Data Loading
  // =========================================================================
  it('loads specific site data when a site button is clicked', async () => {
    (useAuth0 as Mock).mockReturnValue({ isLoading: false, isAuthenticated: true });
    
    mockApiGet.mockImplementation((url) => {
      if (url.includes('GetAll')) return Promise.resolve(mockAllSites);
      if (url.includes('SiteA')) return Promise.resolve(mockSiteData);
      return Promise.reject('Unknown URL');
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // 1. Wait for dashboard
    await waitFor(() => expect(screen.getByText('SiteA')).toBeInTheDocument());

    // 2. Click Site
    fireEvent.click(screen.getByText('SiteA'));

    // 3. Wait for content
    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('section-hider')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 4: Permissions (QA Panel)
  // =========================================================================
  it('SHOWS the QA Panel for Admin users', async () => {
    (useAuth0 as Mock).mockReturnValue({
      isLoading: false, 
      isAuthenticated: true,
      user: {
        'https://electronetclientportal.com/user/roles': ['ELECTRONET_ADMIN']
      }
    });

    mockApiGet.mockImplementation((url) => {
      if (url.includes('GetAll')) return Promise.resolve(mockAllSites);
      if (url.includes('SiteA')) return Promise.resolve(mockSiteData);
      return Promise.resolve([]);
    });

    render(
      <MemoryRouter initialEntries={['/SiteA']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('qa-panel')).toBeInTheDocument();
    });
  });

  it('HIDES the QA Panel for standard Viewers', async () => {
    (useAuth0 as Mock).mockReturnValue({
      isLoading: false, 
      isAuthenticated: true,
      user: {
        'https://electronetclientportal.com/user/roles': [] 
      }
    });

    mockApiGet.mockImplementation((url) => {
      if (url.includes('GetAll')) return Promise.resolve(mockAllSites);
      if (url.includes('SiteA')) return Promise.resolve(mockSiteData);
      return Promise.resolve([]);
    });

    render(
      <MemoryRouter initialEntries={['/SiteA']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('summary')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('qa-panel')).not.toBeInTheDocument();
  });

  // =========================================================================
  // SCENARIO 5: PDF Generation Interaction
  // =========================================================================
  it('opens the PDF modal when Generate Report is clicked', async () => {
    (useAuth0 as Mock).mockReturnValue({ isLoading: false, isAuthenticated: true });
    
    mockApiGet.mockImplementation((url) => {
      if (url.includes('GetAll')) return Promise.resolve(mockAllSites);
      if (url.includes('SiteA')) return Promise.resolve(mockSiteData);
      return Promise.resolve([]);
    });

    render(
      <MemoryRouter initialEntries={['/SiteA']}>
        <App />
      </MemoryRouter>
    );

    // 1. Wait for button
    await waitFor(() => {
      expect(screen.getByText(/generate report/i)).toBeInTheDocument();
    });

    // 2. Click button
    fireEvent.click(screen.getByText(/generate report/i));

    // 3. Wait for Modal Content
    await waitFor(() => {
      expect(screen.getByTestId('pdf-modal')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });
  });
});