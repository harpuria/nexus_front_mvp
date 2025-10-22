(() => {
  const API_BASE_URL = window.API_BASE_URL || '';

  const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

  const resolveUrl = (path) => {
    if (!path) {
      return API_BASE_URL || '';
    }

    if (isAbsoluteUrl(path)) {
      return path;
    }

    if (!API_BASE_URL) {
      return path;
    }

    if (isAbsoluteUrl(API_BASE_URL)) {
      return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    }

    const base = API_BASE_URL.replace(/\/$/, '');
    const normalizedPath = path.replace(/^\//, '');
    if (!base) {
      return `/${normalizedPath}`;
    }
    return `${base}/${normalizedPath}`;
  };

  const buildUrl = (path, params) => {
    const resolved = resolveUrl(path || '');
    const filteredParams = params
      ? Object.entries(params).filter(([, value]) => value !== undefined && value !== null && `${value}`.trim() !== '')
      : [];

    if (!filteredParams.length) {
      return resolved;
    }

    const url = new URL(resolved, window.location.origin);
    for (const [key, value] of filteredParams) {
      url.searchParams.append(key, value);
    }

    if (isAbsoluteUrl(resolved)) {
      return url.toString();
    }

    return `${url.pathname}${url.search}`;
  };

  const parseResponseBody = async (response) => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        return null;
      }
    }

    const text = await response.text();
    if (!text) {
      return null;
    }
    return { message: text };
  };

  const apiRequest = async (path, options = {}) => {
    const {
      method = 'GET',
      data = null,
      params = null,
      headers = {},
      skipJson = false,
    } = options;

    const upperMethod = method.toUpperCase();
    const requestParams = params || (upperMethod === 'GET' ? data : null);
    const url = buildUrl(path, requestParams);

    const fetchOptions = {
      method: upperMethod,
      headers: { ...headers },
    };

    if (data && upperMethod !== 'GET') {
      fetchOptions.headers['Content-Type'] = fetchOptions.headers['Content-Type'] || 'application/json';
      fetchOptions.body = skipJson ? data : JSON.stringify(data);
    }

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (networkError) {
      const error = new Error('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      error.cause = networkError;
      throw error;
    }

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const errorMessage = (payload && (payload.message || payload.errorMessage)) || `요청이 실패했습니다. (HTTP ${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    if (payload && (payload.error === true || payload.success === false)) {
      const apiMessage = payload.message || payload.errorMessage || '요청이 실패했습니다.';
      const error = new Error(apiMessage);
      error.payload = payload;
      throw error;
    }

    return payload;
  };

  const showFeedback = (message, type = 'success') => {
    const container = document.getElementById('feedback-container');
    if (!container) {
      return;
    }

    const alertWrapper = document.createElement('div');
    alertWrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    const alertElement = alertWrapper.firstElementChild;
    container.appendChild(alertElement);

    window.setTimeout(() => {
      try {
        const alertInstance = bootstrap.Alert.getOrCreateInstance(alertElement);
        alertInstance.close();
      } catch (error) {
        alertElement.remove();
      }
    }, 5000);
  };

  const handleApiError = (error) => {
    const message = error?.message || '요청 처리 중 알 수 없는 오류가 발생했습니다.';
    showFeedback(message, 'danger');
    console.error(error);
  };

  window.apiClient = {
    request: apiRequest,
    showFeedback,
    handleApiError,
  };
})();
