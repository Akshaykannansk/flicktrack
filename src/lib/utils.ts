import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchWithTimeout(url: string, ms = 20000, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // No need to check response.ok here, let the caller handle it

    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${ms}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, timeout = 20000): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url, timeout, options);
    } catch (err) {
      lastError = err;
      const isTimeout = err instanceof Error && err.message.includes('timed out');
      
      if (!isTimeout) {
        // Re-throw non-timeout errors immediately
        throw err;
      }

      console.warn(`Request timed out (attempt ${attempt} of ${retries}). Retrying...`);

      if (attempt < retries) {
        await new Promise(res => setTimeout(res, 1000 * attempt)); // exponential backoff
      }
    }
  }

  throw new Error(`Failed to fetch after ${retries} attempts. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
