(function trackingboDebugProbe() {
  if (window.__trackingboDebugInstalled) {
    console.warn('[TrackingBO Debug] El inspector ya esta instalado.');
    return;
  }

  window.__trackingboDebugInstalled = true;
  console.log('[TrackingBO Debug] Inspector instalado.');

  const summarizeHeaders = (headers) => {
    if (!headers) {
      return {};
    }

    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries());
    }

    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }

    return { ...headers };
  };

  const originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    window.fetch = async function patchedFetch(input, init) {
      const startedAt = performance.now();
      const url = typeof input === 'string' ? input : input?.url;
      const method = init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET';
      const requestHeaders = summarizeHeaders(init?.headers || (typeof input !== 'string' ? input?.headers : undefined));
      const body = init?.body;

      console.groupCollapsed(`[TrackingBO Debug][fetch] ${method} ${url}`);
      console.log('Request headers:', requestHeaders);
      console.log('Request body:', body);

      try {
        const response = await originalFetch.apply(this, arguments);
        const cloned = response.clone();
        const elapsedMs = Math.round(performance.now() - startedAt);
        let preview = '';

        try {
          preview = await cloned.text();
          preview = preview.slice(0, 1200);
        } catch (error) {
          preview = `[No se pudo leer el body: ${error.message}]`;
        }

        console.log('Status:', response.status, response.statusText);
        console.log('Response URL:', response.url);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Elapsed ms:', elapsedMs);
        console.log('Response preview:', preview);
        console.groupEnd();

        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        console.groupEnd();
        throw error;
      }
    };
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
    this.__trackingboDebug = {
      method,
      url,
      headers: {},
      startedAt: 0,
    };

    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function patchedSetRequestHeader(name, value) {
    if (this.__trackingboDebug) {
      this.__trackingboDebug.headers[name] = value;
    }

    return originalSetRequestHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function patchedSend(body) {
    const meta = this.__trackingboDebug || {
      method: 'GET',
      url: '[desconocida]',
      headers: {},
      startedAt: 0,
    };

    meta.startedAt = performance.now();
    console.groupCollapsed(`[TrackingBO Debug][xhr] ${meta.method} ${meta.url}`);
    console.log('Request headers:', meta.headers);
    console.log('Request body:', body);

    this.addEventListener('load', function onLoad() {
      const elapsedMs = Math.round(performance.now() - meta.startedAt);
      console.log('Status:', this.status, this.statusText);
      console.log('Response URL:', this.responseURL);
      console.log('Elapsed ms:', elapsedMs);
      console.log('Response preview:', String(this.responseText || '').slice(0, 1200));
      console.groupEnd();
    });

    this.addEventListener('error', function onError() {
      console.error('XHR error');
      console.groupEnd();
    });

    return originalSend.apply(this, arguments);
  };

  document.addEventListener('submit', (event) => {
    const form = event.target;

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const formData = new FormData(form);
    console.groupCollapsed('[TrackingBO Debug][form] submit');
    console.log('Action:', form.action || location.href);
    console.log('Method:', form.method || 'GET');
    console.log('Fields:', Object.fromEntries(formData.entries()));
    console.groupEnd();
  }, true);

  console.log('[TrackingBO Debug] Interceptando fetch, XHR y submit de formularios.');
})();
