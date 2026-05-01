import api, { getApiBaseUrl } from './api';

/**
 * Origine du backend pour l’OAuth uniquement (navigation pleine page).
 * Doit être la même base que GOOGLE_CALLBACK_URL côté serveur (sans /api/oauth/...).
 * Si VITE_API_URL est relatif (/api) ou passe par le proxy Vite (:5173), un redirect_uri
 * calculé sur ce host ne correspond pas toujours à l’URI enregistrée chez Google — d’où cette origine dédiée.
 */
function getOAuthBackendOrigin() {
  const explicit = (import.meta.env.VITE_OAUTH_BACKEND_ORIGIN || '').trim().replace(/\/$/, '');
  if (explicit) return explicit;

  if (import.meta.env.VITE_SAMEDOMAIN_API === 'true') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin.replace(/\/$/, '');
    }
    return '';
  }

  let apiUrl = '';
  try {
    apiUrl = getApiBaseUrl();
  } catch {
    apiUrl = '';
  }
  if (!apiUrl) {
    apiUrl = (import.meta.env.VITE_API_URL || '').trim();
  }

  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    try {
      const u = new URL(apiUrl);
      // API via le dev server Vite (:5173) : OAuth doit viser Express (port 5000 par défaut), pas le proxy
      if (u.port === '5173') {
        const backendPort = (import.meta.env.VITE_OAUTH_BACKEND_PORT || '5000').toString();
        return `${u.protocol}//${u.hostname}:${backendPort}`;
      }
      return `${u.protocol}//${u.host}`;
    } catch {
      /* fall through */
    }
  }

  if (import.meta.env.DEV) return 'http://localhost:5000';
  return '';
}

// OAuth login URLs (used for direct window navigation, not api wrapper)
export const getGoogleLoginUrl = () => {
  let base = getOAuthBackendOrigin();
  if (
    import.meta.env.VITE_SAMEDOMAIN_API === 'true' &&
    !base &&
    typeof window !== 'undefined' &&
    window.location?.origin
  ) {
    base = window.location.origin.replace(/\/$/, '');
  }
  if (!base && import.meta.env.DEV) base = 'http://localhost:5000';
  if (!base) {
    console.error('[oauth] Définissez VITE_OAUTH_BACKEND_ORIGIN ou utilisez SAMEDOMAIN avec une page cliente.');
    return '/api/oauth/google';
  }
  return `${base}/api/oauth/google`;
};

// 2FA Management - use relative paths since api wrapper adds base URL
export const enable2FA = async () => {
  const response = await api.post('/oauth/2fa/enable');
  return response;
};

export const verifySetup2FA = async (token) => {
  const response = await api.post('/oauth/2fa/verify-setup', { token });
  return response;
};

export const disable2FA = async (password, token) => {
  const response = await api.post('/oauth/2fa/disable', { password, token });
  return response;
};

export const verify2FA = async (email, token) => {
  const response = await api.post('/oauth/2fa/verify', { email, token });
  return response;
};

export const generateBackupCodes = async (password) => {
  const response = await api.post('/oauth/2fa/backup-codes', { password });
  return response;
};

export const useBackupCode = async (email, backupCode) => {
  const response = await api.post('/oauth/2fa/use-backup-code', { email, backupCode });
  return response;
};

export default {
  getGoogleLoginUrl,
  enable2FA,
  verifySetup2FA,
  disable2FA,
  verify2FA,
  generateBackupCodes,
  useBackupCode
};
