// Test utilities for component testing
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test query client with specific configuration
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper component for tests that need React Query
export function renderWithQueryClient(ui, options = {}) {
  const testQueryClient = options.queryClient || createTestQueryClient();

  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>,
    options
  );
}

// Helper to wait for async operations
export const waitFor = (callback, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 1000;
    const interval = options.interval || 50;
    const startTime = Date.now();

    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, interval);
        }
      }
    };

    check();
  });
};

// Helper to mock API responses
export const mockApiResponse = (data, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// Helper to create mock icons
export const MockIcon = () => <svg data-testid="mock-icon" />;
