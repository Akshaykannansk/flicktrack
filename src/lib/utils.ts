import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export async function fetchWithTimeout(url: string, ms = 20000, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`TMDB responded with status ${response.status}`);
    }

    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`TMDB fetch timed out after ${ms}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, timeout = 20000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url, timeout, options);
    } catch (err) {
      const isTimeout = err.message.includes('timed out');
      if (!isTimeout || attempt === retries) throw err;

      console.warn(`TMDB request timeout (attempt ${attempt}). Retrying...`);
      await new Promise(res => setTimeout(res, 1000 * attempt)); // exponential backoff
    }
  }
}
