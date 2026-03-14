const LOCAL_API_URL = 'http://localhost:3001/api';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const isLocalHostUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const getRuntimeOrigin = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return trimTrailingSlash(window.location.origin);
};

const isDeployedRuntime = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
};

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  const runtimeApiUrl = getRuntimeOrigin() ? `${getRuntimeOrigin()}/api` : LOCAL_API_URL;

  if (configuredUrl) {
    if (isDeployedRuntime() && isLocalHostUrl(configuredUrl)) {
      return runtimeApiUrl;
    }

    return trimTrailingSlash(configuredUrl);
  }

  return isDeployedRuntime() ? runtimeApiUrl : LOCAL_API_URL;
};

export const apiBaseUrl = resolveApiBaseUrl();

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
};