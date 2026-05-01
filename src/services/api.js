// API base:
// - Development: même origine /api (proxy Vite) si VITE_API_URL vide.
// - Production Vercel « tout-en-un »: VITE_SAMEDOMAIN_API=true → même origine /api (Express Vercel).
// - Sinon: VITE_API_URL absolue (https://…) vers un backend hors Vercel.
//
/** Express monte tout sous /api. Si l’env ne contient que l’origine (ex. https://service.onrender.com), on ajoute /api. */
export function normalizeAbsoluteApiBase(url) {
  const trimmed = String(url).trim().replace(/\/$/, '');
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    const path = (u.pathname || '/').replace(/\/$/, '') || '';
    if (path === '' || path === '/') {
      return `${u.origin}/api`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_SAMEDOMAIN_API === 'true') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/api`;
    }
    return '/api';
  }

  const env = import.meta.env.VITE_API_URL;
  if (typeof env === 'string' && env.trim() !== '') {
    const base = env.trim().replace(/\/$/, '');
    /** Sur déploiement statique hors Vercel fullstack, éviter valeurs relatives. */
    if (import.meta.env.PROD && !/^https?:\/\/.+/i.test(base)) {
      throw new Error(
        `VITE_API_URL doit être une URL absolue avec schéma http(s) (ex. https://ton-api.onrender.com/api). Valeur invalide : "${base}".`
      );
    }
    if (
      import.meta.env.PROD &&
      typeof window !== 'undefined' &&
      base.startsWith('http') &&
      window.location?.hostname
    ) {
      let host;
      try {
        host = new URL(base).hostname;
      } catch {
        return base;
      }
      if (
        host === window.location.hostname &&
        import.meta.env.VITE_SAMEDOMAIN_API !== 'true'
      ) {
        throw new Error(
          'La configuration API pointe sur le même domaine alors que ce n’est pas le mode même origine activé.'
        );
      }
    }
    return normalizeAbsoluteApiBase(base);
  }

  if (import.meta.env.DEV && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  if (import.meta.env.PROD) {
    throw new Error(
      'Configuration API absente en production : définis VITE_SAMEDOMAIN_API=true (Express sur ce même projet Vercel) ou une variable VITE_API_URL absolue vers ton backend.'
    );
  }

  return 'http://localhost:5000/api';
};

// Get auth token from localStorage
const getToken = () => {
  const user = localStorage.getItem('mbg_user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      console.log('Getting token from localStorage:', parsed);
      // Token could be at different paths depending on response structure
      const token = parsed.token || parsed.data?.token;
      console.log('Extracted token:', token ? 'Token found' : 'No token found');
      return token;
    } catch (err) {
      console.error('Error parsing user data:', err);
      return null;
    }
  }
  console.log('No user data in localStorage');
  return null;
};

// Get temp token for questionnaire completion
const getTempToken = () => {
  const tempData = localStorage.getItem('mbg_temp_user');
  if (tempData) {
    const parsed = JSON.parse(tempData);
    return parsed.tempToken;
  }
  return null;
};

const SESSION_END_CODES = new Set(['ACCOUNT_DEACTIVATED', 'USER_NOT_FOUND']);

function clearSessionAndRedirectIfNeeded(endpoint, status, data, hadAuthToken) {
  if (typeof window === 'undefined' || !hadAuthToken || status !== 401) return;

  const code = data.code;
  const msg = (data.message || '').toString();
  const shouldEndSession =
    SESSION_END_CODES.has(code) ||
    msg === 'User not found' ||
    msg === 'User account is deactivated';

  if (!shouldEndSession) return;

  const isAuthLogin = endpoint.startsWith('/auth/login');
  if (isAuthLogin) return;

  localStorage.removeItem('mbg_user');
  localStorage.removeItem('mbg_temp_user');
  const qs = code === 'USER_NOT_FOUND' ? '?reason=account_removed' : '?reason=account_deactivated';
  window.location.href = `/auth${qs}`;
}

// Base fetch wrapper with error handling
const request = async (endpoint, options = {}) => {
  const skipAuth = options.skipAuth === true;
  const token = skipAuth
    ? null
    : options.useTempToken
      ? getTempToken()
      : getToken();
  const hadAuthToken = !!token;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Remove custom properties not meant for fetch
  delete config.useTempToken;
  delete config.skipAuth;

  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, config);
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      clearSessionAndRedirectIfNeeded(endpoint, response.status, data, hadAuthToken);

      const err = new Error(data.message || data.error || 'An error occurred');
      err.status = response.status;
      err.code = data.code;
      err.requiresEmailVerification = data.requiresEmailVerification || false;
      err.requiresQuestionnaire = data.requiresQuestionnaire === true;
      err.email = data.email;
      err.canRequestReactivation = data.canRequestReactivation;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Upload file (FormData) — skips JSON Content-Type so the browser sets multipart boundary
const uploadFile = async (endpoint, formData) => {
  const token = getToken();
  const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: 'POST',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
};

// API methods
export const api = {
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),
  
  post: (endpoint, body, options = {}) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  }),
  
  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),

  upload: (file, folder) => {
    const fd = new FormData();
    fd.append('file', file);
    if (folder) fd.append('folder', folder);
    return uploadFile('/upload', fd);
  },
};

export { getTempToken };
export default api;
