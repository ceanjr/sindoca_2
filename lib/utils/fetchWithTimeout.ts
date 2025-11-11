/**
 * Fetch with timeout utility
 * Prevents requests from hanging indefinitely
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number; // in milliseconds
}

export class FetchTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'FetchTimeoutError';
  }
}

export class FetchNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FetchNetworkError';
  }
}

/**
 * Fetch with automatic timeout
 * @param url - The URL to fetch
 * @param options - Fetch options with optional timeout (default: 15000ms = 15s)
 * @returns Promise<Response>
 * @throws {FetchTimeoutError} If request times out
 * @throws {FetchNetworkError} If network error occurs
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new FetchTimeoutError(timeout);
    }

    if (error instanceof TypeError) {
      // Network error (offline, DNS failure, etc)
      throw new FetchNetworkError(
        'Network error - check your internet connection'
      );
    }

    throw error;
  }
}

/**
 * Fetch JSON with timeout and automatic error handling
 * @param url - The URL to fetch
 * @param options - Fetch options with optional timeout
 * @returns Promise with typed response
 * @throws {FetchTimeoutError} If request times out
 * @throws {FetchNetworkError} If network error occurs
 * @throws {Error} If server returns error response
 */
export async function fetchJSON<T = any>(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Couldn't parse error as JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
