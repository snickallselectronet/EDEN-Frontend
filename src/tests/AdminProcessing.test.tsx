// @vitest-environment jsdom
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import AdminProcessing from '../components/AdminProcessing';
import { useAuthenticatedApi } from '../hooks/useAuth';

// -------------------------------------------------------------------------
// 1. MOCK DEPENDENCIES
// -------------------------------------------------------------------------
vi.mock('axios');
vi.mock('../hooks/useAuth');

// Mock Header to avoid testing unrelated navigation logic
vi.mock('../components/Header', () => ({
  default: ({ handleSiteChange }: any) => (
    <div data-testid="header">
      <button onClick={() => handleSiteChange('home')}>Go Home</button>
    </div>
  )
}));

// Mock window.alert to prevent jsdom errors
window.alert = vi.fn();

describe('AdminProcessing Component', () => {
  const mockGetAuthHeaders = vi.fn();

  // Mock Data
  const mockClients = ['Client A', 'Client B'];
  
  const mockS3Sites = [
    { name: 'SiteS3_1', size: '10MB', modified_time: '2023-01-01' },
    { name: 'SiteS3_2', size: '5MB', modified_time: '2023-01-02' }
  ];

  // [name, client, date, revision, uuid, metadata]
  const mockDbSites = [
    ['DbSite_1', 'Client A', '2023-01-01', 'Rev01', 'uuid-1', { record_ids: {} }]
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // 1. Setup Auth Hook
    (useAuthenticatedApi as Mock).mockReturnValue({
      isReady: true,
      getAuthHeaders: mockGetAuthHeaders.mockResolvedValue({ Authorization: 'Bearer token' }),
    });

    // 2. Setup Axios Implementation
    (axios.get as Mock).mockImplementation((url) => {
      if (url.includes('GetClients')) {
        return Promise.resolve({ data: mockClients });
      }
      if (url.includes('get_s3_rawData_list')) {
        return Promise.resolve({ data: mockS3Sites });
      }
      if (url.includes('GetAll')) {
        return Promise.resolve({ data: mockDbSites });
      }
      if (url.includes('transfer_s3_rawData')) {
        return Promise.resolve({ 
          data: { 
            record_ids: { id: 123 }, 
            test_report_uuid: 'new-uuid',
            error: null 
          } 
        });
      }
      if (url.includes('uprev_report')) {
        return Promise.resolve({ 
          data: { 
            new_report_uuid: 'uprev-uuid', 
            new_test_event_uuid: 'event-uuid',
            revision: 'Rev02' 
          } 
        });
      }
      return Promise.reject(new Error(`Unknown GET URL: ${url}`));
    });

    (axios.post as Mock).mockResolvedValue({ data: { success: true } });
  });

  // =========================================================================
  // TEST SCENARIOS
  // =========================================================================

  it('fetches and renders lists (S3 sites, DB sites, Clients)', async () => {
    render(
      <MemoryRouter>
        <AdminProcessing />
      </MemoryRouter>
    );

    // Wait for S3 sites to load
    await waitFor(() => {
      expect(screen.getByText('SiteS3_1')).toBeInTheDocument();
      expect(screen.getByText('SiteS3_2')).toBeInTheDocument();
    });

    // Wait for DB sites to load
    await waitFor(() => {
      expect(screen.getByText('DbSite_1')).toBeInTheDocument();
    });
  });

  it('S3 FLOW: Selects site, adds client, and initiates transfer', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminProcessing />
      </MemoryRouter>
    );

    // 1. Select an S3 Site (FIX: Use getByRole for radio buttons)
    await waitFor(() => expect(screen.getByText('SiteS3_1')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('radio', { name: /SiteS3_1/i }));

    // 2. Select a Client (Dropdown interaction)
    const clientSelect = screen.getByLabelText(/select client/i);
    await user.click(clientSelect);
    
    const clientOption = await screen.findByRole('option', { name: 'Client A' });
    await user.click(clientOption);

    // 3. Click "Begin Processing"
    const processBtn = screen.getByRole('button', { name: /begin processing/i });
    await user.click(processBtn);

    // 4. Assert API was called correctly
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('transfer_s3_rawData/SiteS3_1/Client A'),
      expect.anything()
    );

    // 5. Assert Success State: Form fields should now appear
    await waitFor(() => {
      expect(screen.getByText(/now configuring "SiteS3_1"/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^site name/i)).toBeInTheDocument();
    });
  });

  it('UPREV FLOW: Selects existing site and creates revision', async () => {
    render(
      <MemoryRouter>
        <AdminProcessing />
      </MemoryRouter>
    );

    // 1. Select DB Site (FIX: Use getByRole)
    await waitFor(() => expect(screen.getByText('DbSite_1')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('radio', { name: /DbSite_1/i }));

    // 2. Click Uprev Button
    const uprevBtn = screen.getByRole('button', { name: /create new revision/i });
    fireEvent.click(uprevBtn);

    // 3. Assert API call
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('uprev_report/uuid-1'),
      expect.anything()
    );

    // 4. Assert Success State
    await waitFor(() => {
      expect(screen.getByText(/now configuring new revision of "DbSite_1"/i)).toBeInTheDocument();
    });
  });

  it('FORM VALIDATION: Prevents submission of incomplete form', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminProcessing />
      </MemoryRouter>
    );

    // --- SETUP: Fast-forward to Form State via S3 Flow ---
    await waitFor(() => expect(screen.getByText('SiteS3_1')).toBeInTheDocument());
    
    // FIX: Use getByRole
    fireEvent.click(screen.getByRole('radio', { name: /SiteS3_1/i }));
    
    await user.click(screen.getByLabelText(/select client/i));
    await user.click(await screen.findByRole('option', { name: 'Client A' }));
    
    await user.click(screen.getByRole('button', { name: /begin processing/i }));
    await waitFor(() => expect(screen.getByLabelText(/^site name/i)).toBeInTheDocument());
    // -----------------------------------------------------

    // ACT: Try to submit empty form
    const submitBtn = screen.getByRole('button', { name: /submit for processing/i });
    await user.click(submitBtn);

    // ASSERT: Validation errors appear
    expect(screen.getByText(/please enter a site name/i)).toBeInTheDocument();
    expect(screen.getByText(/please select a country/i)).toBeInTheDocument();
    
    // Verify API was NOT called
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('FORM SUBMISSION: Successfully submits valid configuration', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminProcessing />
      </MemoryRouter>
    );

    // --- SETUP: Fast-forward to Form State ---
    await waitFor(() => expect(screen.getByText('SiteS3_1')).toBeInTheDocument());
    
    // FIX: Use getByRole
    fireEvent.click(screen.getByRole('radio', { name: /SiteS3_1/i }));
    
    await user.click(screen.getByLabelText(/select client/i));
    await user.click(await screen.findByRole('option', { name: 'Client A' }));
    await user.click(screen.getByRole('button', { name: /begin processing/i }));
    await waitFor(() => expect(screen.getByLabelText(/^site name/i)).toBeInTheDocument());
    // -----------------------------------------

    // 1. Fill Required Fields
    await user.type(screen.getByLabelText(/^site name/i), 'Test Site');
    await user.type(screen.getByLabelText(/site abbreviation/i), 'TS');

    // Country Select
    await user.click(screen.getByLabelText(/country/i));
    await user.click(await screen.findByRole('option', { name: 'New Zealand' }));

    // Standard Select
    await user.click(screen.getByLabelText(/applied standard/i));
    await user.click(await screen.findByRole('option', { name: 'IEC' }));

    // IEC Class Select (Conditionall rendered)
    await user.click(screen.getByLabelText(/iec site class/i));
    await user.click(await screen.findByRole('option', { name: 'Normal' }));

    // Numeric Fields
    await user.type(screen.getByLabelText(/default current angle/i), '1');
    await user.type(screen.getByLabelText(/north adjustment/i), '0');
    await user.type(screen.getByLabelText(/east adjustment/i), '0');

    // 2. Submit
    await user.click(screen.getByRole('button', { name: /submit for processing/i }));

    // 3. Assert Final API Call
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('process_scripts/Test Site/Client A'),
      expect.objectContaining({
        config: expect.objectContaining({
          site_name: 'Test Site',
          country: 'NZ',
          applied_standard: 'IEC'
        })
      }),
      expect.anything()
    );
  });
});