// Environment-based API configuration
// Using yottascore.com for both development and production
import { getApiAuthHandler } from '@/utils/apiAuthHandler';

// export const API_BASE_URL = 'https://www.yottascore.com/api';
// Local: set EXPO_PUBLIC_API_URL in .env to your PC's LAN IP (ipconfig → IPv4).
const _rawApiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.12:3000/api';
// Prevent servers that redirect http->https from converting POST to GET (causes 405).
// If someone set an http yottascore URL, prefer https automatically.
export const API_BASE_URL = (_rawApiUrl.startsWith('http://yottascore.com') || _rawApiUrl.startsWith('http://www.yottascore.com'))
  ? _rawApiUrl.replace('http://', 'https://')
  : _rawApiUrl;
export const SITE_BASE_URL = API_BASE_URL.replace('/api', '');

/** Image/uploads base URL – use score.yottascore.com for images */
export const IMAGE_BASE_URL = 'https://score.yottascore.com';

type ApiOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { method, body, headers = {} } = options;
  // If caller didn't provide a method but did provide a body, assume POST.
  const finalMethod = (method || (body ? 'POST' : 'GET')).toUpperCase();
  
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  try {
    // Dev-only logging to verify method/URL/headers/body at runtime
    try {
      // __DEV__ is available in React Native/Expo; guard for other envs
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.log('[apiFetch]', finalMethod, fullUrl, { headers, body });
      }
    } catch {}

    const res = await fetch(fullUrl, {
      method: finalMethod,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const contentType = res.headers.get('content-type');
    let data;

    if (contentType && contentType.indexOf('application/json') !== -1) {
      data = await res.json();
    } else {
      data = await res.text(); // Get response as text if not JSON
    }

    if (!res.ok) {
      const errorPayload = typeof data === 'object' ? data : { message: data };
      throw { status: res.status, data: errorPayload };
    }
    
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    throw error;
  }
}

const AUTH_HEADERS = {
  'X-Auth-Provider': 'firebase',
  'X-Token-Type': 'firebase-jwt',
  'X-Client-Type': 'mobile-app',
};

async function apiFetchWithToken(endpoint: string, token: string, options: ApiOptions) {
  return apiFetch(endpoint, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      ...AUTH_HEADERS,
    },
  });
}

/** Authenticated request. On 401: tries refresh once, retries; if refresh fails → on401 (logout + redirect). */
export async function apiFetchAuth(endpoint: string, token: string, options: ApiOptions = {}) {
  try {
    return await apiFetchWithToken(endpoint, token, options);
  } catch (err: any) {
    if (err?.status !== 401) throw err;

    const handler = getApiAuthHandler();
    if (!handler) throw err;

    const newToken = await handler.refreshAndGetToken();
    if (newToken) {
      try {
        return await apiFetchWithToken(endpoint, newToken, options);
      } catch (retryErr) {
        if ((retryErr as any)?.status === 401) {
          handler.on401();
        }
        throw retryErr;
      }
    }

    handler.on401();
    throw err;
  }
}

/** Build image URL. Uses score.yottascore.com. Replaces score.beyondspacework.com (and any beyondspacework) with score.yottascore.com. */
export function getImageUrl(relativePath: string): string {
  if (!relativePath || !relativePath.trim()) return '';
  let url = relativePath.trim();
  if (url.startsWith('http://') || url.startsWith('https://')) {
    url = url.replace(/score\.beyondspacework\.com/gi, 'score.yottascore.com');
    url = url.replace(/beyondspacework\.com/gi, 'yottascore.com');
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${IMAGE_BASE_URL}${path}`;
}

export async function uploadFile(fileUri: string, token: string): Promise<string> {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'image.jpg';
  
  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: 'image/jpeg',
  } as any);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      ...AUTH_HEADERS,
      Authorization: `Bearer ${token}`,
      // Let browser set Content-Type for FormData (multipart boundary)
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
        if (response.status === 502) {
      throw new Error('Upload service is temporarily unavailable. Please try again later.');
    }
    throw new Error(`Upload failed. Please try again.`);
  }

  const result = await response.json();
    
  // Handle different possible response formats
  const url = result.url || result.imageUrl || result.fileUrl || result.mediaUrl;
  if (!url) {
        throw new Error('Upload response does not contain a valid URL');
  }
  
  return url;
} 