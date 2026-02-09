// Environment-based API configuration
// Using yottascore.com for both development and production
import { getApiAuthHandler } from '@/utils/apiAuthHandler';

export const API_BASE_URL = 'https://www.yottascore.com/api';
// export const API_BASE_URL = 'http://192.168.1.6:3000/api';
export const SITE_BASE_URL = API_BASE_URL.replace('/api', '');

/** Image/uploads base URL – use score.yottascore.com for images */
export const IMAGE_BASE_URL = 'https://score.yottascore.com';

type ApiOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;
  
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  if (__DEV__) {
    console.log('API Fetch:', fullUrl, method, body ? '(body present)' : '');
  }

  try {
    const res = await fetch(fullUrl, {
      method,
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

    if (__DEV__) {
      console.log('API response:', res.status, res.ok ? 'ok' : 'error');
    }
    // Never log full response data in production (may contain token/user)

    if (!res.ok) {
      const errorPayload = typeof data === 'object' ? data : { message: data };
      if (__DEV__) console.log('API error payload:', errorPayload);
      throw { status: res.status, data: errorPayload };
    }
    
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error('API Fetch error:', error);
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

  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (__DEV__) console.error('Upload failed:', response.status, errorText);
    if (response.status === 502) {
      throw new Error('Upload service is temporarily unavailable. Please try again later.');
    }
    throw new Error(`Upload failed. Please try again.`);
  }

  const result = await response.json();
  if (__DEV__) console.log('Upload response:', result);
  
  // Handle different possible response formats
  const url = result.url || result.imageUrl || result.fileUrl || result.mediaUrl;
  if (!url) {
    console.error('No URL found in upload response:', result);
    throw new Error('Upload response does not contain a valid URL');
  }
  
  return url;
} 