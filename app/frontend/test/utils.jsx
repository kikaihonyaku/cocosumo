/**
 * Test Utilities
 * Helper functions and custom render for testing React components
 */

import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nProvider } from '../i18n';

// Create a default theme for testing
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  }
});

/**
 * All providers wrapper for tests
 */
function AllProviders({ children, initialEntries = ['/'] }) {
  return (
    <ThemeProvider theme={theme}>
      <I18nProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}

/**
 * Custom render function that wraps components with all providers
 * @param {React.ReactElement} ui - Component to render
 * @param {object} options - Render options
 * @returns {RenderResult} - Testing library render result
 */
function customRender(ui, options = {}) {
  const { initialEntries = ['/'], ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <AllProviders initialEntries={initialEntries}>
      {children}
    </AllProviders>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Render with BrowserRouter for integration tests
 */
function renderWithRouter(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      <I18nProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock API response helper
 * @param {object} data - Response data
 * @param {number} delay - Response delay in ms
 * @returns {Promise} - Mocked response
 */
function mockApiResponse(data, delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data });
    }, delay);
  });
}

/**
 * Mock API error helper
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {Promise} - Rejected promise with error
 */
function mockApiError(status, message = 'Error') {
  return Promise.reject({
    response: {
      status,
      data: { error: message }
    }
  });
}

/**
 * Wait for loading state to resolve
 * @param {object} options - Wait options
 */
async function waitForLoadingToFinish({ timeout = 3000 } = {}) {
  const { waitFor, screen } = await import('@testing-library/react');

  await waitFor(
    () => {
      // Wait for loading indicators to disappear
      const loadingElements = screen.queryAllByRole('progressbar');
      expect(loadingElements.length).toBe(0);
    },
    { timeout }
  );
}

/**
 * Create mock property data for tests
 */
function createMockProperty(overrides = {}) {
  return {
    id: 1,
    title: 'テスト物件',
    catch_copy: 'テストキャッチコピー',
    pr_text: '<p>テストPR文</p>',
    template_type: 'template1',
    room: {
      id: 1,
      rent: 80000,
      area: 25.5,
      room_type: '1K',
      floor: 3,
      building: {
        id: 1,
        name: 'テストビル',
        address: '東京都渋谷区渋谷1-1-1'
      }
    },
    property_publication_photos: [
      {
        id: 1,
        room_photo: {
          photo_url: '/test-image.jpg'
        }
      }
    ],
    ...overrides
  };
}

/**
 * Create mock user data for tests
 */
function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'テストユーザー',
    ...overrides
  };
}

/**
 * Simulate user typing
 */
async function userType(element, text) {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  await user.clear(element);
  await user.type(element, text);
}

/**
 * Simulate user click
 */
async function userClick(element) {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  await user.click(element);
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Export custom utilities
export {
  customRender as render,
  renderWithRouter,
  mockApiResponse,
  mockApiError,
  waitForLoadingToFinish,
  createMockProperty,
  createMockUser,
  userType,
  userClick
};
