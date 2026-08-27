const HOME_PAGE = 'index2.html';
const REBUILD_DURATION = 1100;
const SERVICE_TRANSITION_DURATION = 850;
const SERVICE_LOAD_TIMEOUT = 10000;
const SERVICE_RETRY_DELAY = 1800;
const MAX_SERVICE_RETRIES = 2;
const SERVICE_IDLE_TIMEOUT = 180000;
const IFRAME_RESET_DELAY = 120;
const CARD_FLIP_INTERVAL = 2000;
const CARD_SHAKE_DURATION = 1000;
const IDLE_TIMEOUT = 12000;
const IDLE_LOGO_CYCLE_DELAY = 30000;
const IDLE_LOGO_TILE_COUNT = 4;
const IDLE_LOGO_ANIMATION_DURATION = 3600;
const APP_PREVENTIVE_REFRESH_MS = 3 * 60 * 60 * 1000;
const APP_PREVENTIVE_REFRESH_GRACE_MS = 2500;
const PREVENTIVE_REFRESH_MAX_DEFER_MS = 15 * 60 * 1000;
const ABSOLUTE_MAX_UPTIME_MS = 8 * 60 * 60 * 1000;
const MAX_SERVICE_OPENS_BEFORE_REFRESH = 24;
const TRACKING_URL = 'https://trackingbo.correos.gob.bo:8100/';
const CALCULADORA_URL = 'https://postar.correos.gob.bo:8104/';
const RECLAMOS_URL = 'https://sireco.correos.gob.bo:8102/';
const TICKET_URL = 'http://172.65.10.55:8106/tickets';
const RECLAMOS_ANCHOR = '#contactanos';

function isHomeView(url) {
  return typeof url === 'string' && url.includes(HOME_PAGE);
}

function isTrackingService(url) {
  return typeof url === 'string' && url.toLowerCase().includes('trackingbo');
}

function isSessionSensitiveService(url) {
  const normalizedUrl = (url || '').toLowerCase();
  return normalizedUrl.startsWith(CALCULADORA_URL) || normalizedUrl.startsWith(RECLAMOS_URL);
}

function addKioskRuntimeStamp(url) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('kiosk_ts', String(Date.now()));
    return parsed.toString();
  } catch (error) {
    return url;
  }
}

function normalizeServiceUrl(url) {
  if (typeof url !== 'string') {
    return url;
  }

  let finalUrl = url.trim();
  const normalizedUrl = finalUrl.toLowerCase();
  const isReclamos = normalizedUrl.startsWith(RECLAMOS_URL);

  if (isReclamos && !finalUrl.includes('#')) {
    finalUrl = `${finalUrl}${RECLAMOS_ANCHOR}`;
  }

  if (isSessionSensitiveService(finalUrl)) {
    finalUrl = addKioskRuntimeStamp(finalUrl);
  }

  return finalUrl;
}

function buildFreshServiceUrl(url) {
  if (typeof url !== 'string' || isHomeView(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('kiosk_nav', String(Date.now()));
    return parsed.toString();
  } catch (error) {
    return `${url}${url.includes('?') ? '&' : '?'}kiosk_nav=${Date.now()}`;
  }
}

function isReclamosService(url) {
  return typeof url === 'string' && url.toLowerCase().includes('sireco.correos.gob.bo:8102');
}

function logServiceEvent(level, message, details = {}) {
  const timestamp = new Date().toISOString();
  const payload = { timestamp, ...details };
  const logger = console[level] || console.log;
  logger(`[KIOSCO_AGBC] ${message}`, payload);
}

function applyTimeOfDayTheme() {
  const hour = new Date().getHours();
  const root = document.documentElement;
  const progress = Math.min(Math.max((hour - 7) / 9, 0), 1);
  const inverse = 1 - progress;
  const hueA = Math.round(46 + (inverse * 6));
  const hueB = Math.round(212 - (progress * 12));
  const satA = Math.round(92 - (progress * 18));
  const satB = Math.round(64 + (progress * 8));
  const lightA = Math.round(64 - (progress * 26));
  const lightB = Math.round(32 + (progress * 10));
  const glow = (0.22 + (inverse * 0.24)).toFixed(2);

  root.style.setProperty('--sky-accent', `hsl(${hueA} ${satA}% ${lightA}%)`);
  root.style.setProperty('--sky-deep', `hsl(${hueB} ${satB}% ${lightB}%)`);
  root.style.setProperty('--sky-glow', `rgba(255, 243, 187, ${glow})`);
}

function getServiceDiagnostics(url, title) {
  const normalizedUrl = (url || '').toLowerCase();
  const serviceTitle = title || 'Servicio AGBC';

  if (normalizedUrl.includes('trackingbo.correos.gob.bo:8100')) {
    return {
      title: `${serviceTitle}: no disponible por ahora`,
      message: 'No pudimos abrir el servicio en este momento.',
      details: 'Puede tratarse de una caida temporal o de una limitacion de acceso.',
    };
  }

  if (normalizedUrl.includes('postar.correos.gob.bo:8104')) {
    return {
      title: `${serviceTitle}: no disponible por ahora`,
      message: 'No recibimos respuesta del servicio.',
      details: 'Puede tratarse de una caida temporal o de una limitacion de acceso.',
    };
  }

  if (normalizedUrl.includes('sireco.correos.gob.bo:8102')) {
    return {
      title: `${serviceTitle}: no disponible por ahora`,
      message: 'No recibimos respuesta del servicio.',
      details: 'Puede tratarse de una caida temporal o de una limitacion de acceso.',
    };
  }

  if (normalizedUrl.includes('ips.correos.gob.bo')) {
    return {
      title: `${serviceTitle}: no disponible por ahora`,
      message: 'El servicio no se pudo mostrar dentro del kiosco.',
      details: 'Intenta nuevamente en unos minutos.',
    };
  }

  return {
    title: `${serviceTitle}: no se pudo cargar`,
    message: 'No pudimos abrir este servicio por el momento.',
    details: 'Intenta nuevamente mas tarde.',
  };
}

function setupChildView() {
  const trackingMain = document.querySelector('.tracking-main');
  const cards = document.querySelectorAll('.service-card');
  const ticketHub = document.getElementById('ticketHub');
  const trackingLaunch = document.querySelector('[data-tracking-launch]');
  const externalLaunchButtons = document.querySelectorAll('[data-external-launch]');
  const idleLogoMosaic = document.getElementById('idleLogoMosaic');

  if (trackingLaunch) {
    trackingLaunch.addEventListener('click', () => {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'open-service',
          url: TRACKING_URL,
          title: 'Rastreo de correspondencia',
        }, '*');
        return;
      }

      window.location.href = TRACKING_URL;
    });
  }

  externalLaunchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetUrl = button.dataset.externalLaunch;
      const targetTitle = button.dataset.title || 'Servicio AGBC';

      if (!targetUrl) {
        return;
      }

      if (window.parent !== window) {
        window.parent.postMessage({ type: 'open-service', url: targetUrl, title: targetTitle }, '*');
        return;
      }

      window.location.href = targetUrl;
    });
  });

  if (ticketHub) {
    ticketHub.addEventListener('click', () => {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'open-service',
          url: TICKET_URL,
          title: 'Sacar turno',
        }, '*');
        return;
      }

      window.location.href = TICKET_URL;
    });
  }

  if (!trackingMain || cards.length === 0) {
    return;
  }

  let idleTimer = null;
  let idleActive = false;
  let idleLogoCycleTimer = null;
  const idleResetEvents = ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'];

  const createIdleLogoTiles = () => {
    if (!idleLogoMosaic || idleLogoMosaic.childElementCount > 0) {
      return;
    }

    const totalTiles = IDLE_LOGO_TILE_COUNT * IDLE_LOGO_TILE_COUNT;

    for (let index = 0; index < totalTiles; index += 1) {
      const tile = document.createElement('span');
      const row = Math.floor(index / IDLE_LOGO_TILE_COUNT);
      const col = index % IDLE_LOGO_TILE_COUNT;
      const distanceX = col - (IDLE_LOGO_TILE_COUNT - 1) / 2;
      const distanceY = row - (IDLE_LOGO_TILE_COUNT - 1) / 2;
      const offsetX = distanceX * 38 + ((row % 2 === 0 ? 1 : -1) * 20);
      const offsetY = distanceY * 30 + ((col % 2 === 0 ? -1 : 1) * 16);

      tile.className = 'idle-logo-mosaic__tile';
      tile.style.setProperty('--tile-row', row);
      tile.style.setProperty('--tile-col', col);
      tile.style.setProperty('--tile-count', IDLE_LOGO_TILE_COUNT);
      tile.style.setProperty('--tile-delay', `${(row + col) * 45}ms`);
      tile.style.setProperty('--tile-offset-x', `${offsetX}px`);
      tile.style.setProperty('--tile-offset-y', `${offsetY}px`);
      tile.style.setProperty('--tile-rotation', `${(distanceX - distanceY) * 5}deg`);
      idleLogoMosaic.appendChild(tile);
    }
  };

  const clearIdleLogoCycle = () => {
    if (idleLogoCycleTimer) {
      window.clearTimeout(idleLogoCycleTimer);
      idleLogoCycleTimer = null;
    }
  };

  const cycleIdleLogoAnimation = () => {
    if (!idleActive || !idleLogoMosaic) {
      return;
    }

    idleLogoMosaic.classList.remove('is-animating');
    void idleLogoMosaic.offsetWidth;
    idleLogoMosaic.classList.add('is-animating');

    window.setTimeout(() => {
      idleLogoMosaic.classList.remove('is-animating');
    }, IDLE_LOGO_ANIMATION_DURATION);
  };

  const scheduleIdleLogoCycle = () => {
    clearIdleLogoCycle();

    if (!idleActive || !idleLogoMosaic) {
      return;
    }

    idleLogoCycleTimer = window.setTimeout(() => {
      cycleIdleLogoAnimation();
      scheduleIdleLogoCycle();
    }, IDLE_LOGO_CYCLE_DELAY);
  };

  const notifyParentReady = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'home-ready' }, '*');
    }
  };

  const exitIdleMode = () => {
    if (!idleActive) {
      return;
    }

    idleActive = false;
    trackingMain.classList.remove('is-idle');
    clearIdleLogoCycle();

    if (idleLogoMosaic) {
      idleLogoMosaic.classList.remove('is-animating');
    }
  };

  const enterIdleMode = () => {
    if (document.hidden) {
      return;
    }

    idleActive = true;
    cards.forEach((card) => {
      card.classList.remove('flipped');
      card.classList.remove('is-shaking');
    });
    trackingMain.classList.add('is-idle');
    cycleIdleLogoAnimation();
    scheduleIdleLogoCycle();
  };

  const resetIdleTimer = () => {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
    }

    exitIdleMode();
    idleTimer = window.setTimeout(enterIdleMode, IDLE_TIMEOUT);
  };

  idleResetEvents.forEach((eventName) => {
    window.addEventListener(eventName, resetIdleTimer, { passive: true });
  });

  const handleVisibilityChange = () => {
    if (document.hidden) {
      exitIdleMode();
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
      return;
    }

    resetIdleTimer();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  cards.forEach((card) => {
    let flipInterval = null;
    let flipStartTimer = null;
    let launchTimer = null;
    const url = card.dataset.url;
    const title = card.dataset.title;

    const clearFlipCycle = () => {
      if (flipStartTimer) {
        window.clearTimeout(flipStartTimer);
        flipStartTimer = null;
      }

      if (flipInterval) {
        window.clearInterval(flipInterval);
        flipInterval = null;
      }
    };

    const clearLaunchTimer = () => {
      if (launchTimer) {
        window.clearTimeout(launchTimer);
        launchTimer = null;
      }
    };

    const startFlipCycle = () => {
      clearFlipCycle();
      flipStartTimer = window.setTimeout(() => {
        card.classList.toggle('flipped');
        flipInterval = window.setInterval(() => {
          card.classList.toggle('flipped');
        }, CARD_FLIP_INTERVAL);
      }, CARD_FLIP_INTERVAL);
    };

    const launchService = () => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'open-service', url, title }, '*');
        return;
      }

      window.location.href = url;
    };

    card.addEventListener('pointerenter', () => {
      exitIdleMode();
      if (card.classList.contains('is-launching')) {
        return;
      }

      startFlipCycle();
    });

    card.addEventListener('pointerleave', () => {
      if (card.classList.contains('is-launching')) {
        return;
      }

      clearFlipCycle();
      card.classList.remove('flipped');
      card.classList.remove('is-selected');
    });

    card.addEventListener('click', () => {
      if (card.classList.contains('is-launching')) {
        return;
      }

      exitIdleMode();
      clearFlipCycle();
      clearLaunchTimer();
      cards.forEach((item) => item.classList.remove('is-selected'));
      card.classList.add('is-selected', 'is-shaking', 'is-launching');
      launchTimer = window.setTimeout(() => {
        card.classList.remove('is-shaking');
        card.classList.remove('is-launching');
        card.classList.remove('is-selected');
        launchService();
      }, CARD_SHAKE_DURATION);
    });
  });

  const handleMessage = (event) => {
    if (event.data?.type === 'play-home-intro') {
      trackingMain.classList.remove('rebuild-sequence');
      void trackingMain.offsetWidth;
      trackingMain.classList.add('rebuild-sequence');
      resetIdleTimer();
    }
  };

  const teardownChildView = () => {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
      idleTimer = null;
    }

    clearIdleLogoCycle();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('message', handleMessage);
    idleResetEvents.forEach((eventName) => {
      window.removeEventListener(eventName, resetIdleTimer, { passive: true });
    });
  };

  window.addEventListener('message', handleMessage);
  window.addEventListener('pagehide', teardownChildView, { once: true });

  createIdleLogoTiles();
  resetIdleTimer();
  notifyParentReady();
}

function setupParentShell() {
  const frame = document.getElementById('serviceFrame');
  const frameStage = document.getElementById('frameStage');
  const homeButton = document.getElementById('homeButton');
  const backButton = document.getElementById('backButton');
  const mainTitle = document.getElementById('dynamicHeaderTitle');
  const serviceErrorState = document.getElementById('serviceErrorState');
  const serviceStatusTitle = document.getElementById('serviceStatusTitle');
  const serviceStatusMessage = document.getElementById('serviceStatusMessage');

  if (
    !frame ||
    !frameStage ||
    !homeButton ||
    !backButton ||
    !mainTitle ||
    !serviceErrorState ||
    !serviceStatusTitle ||
    !serviceStatusMessage
  ) {
    return;
  }

  let currentServiceUrl = HOME_PAGE;
  let currentServiceTitle = 'Panel principal';
  let navigatingHome = false;
  let pendingServiceUrl = null;
  let pendingServiceBaseUrl = null;
  let serviceLoadTimer = null;
  let serviceLoadStartedAt = null;
  let currentRetryCount = 0;
  let serviceIdleTimer = null;
  let preventiveRefreshTimer = null;
  let preventiveRefreshPending = false;
  let preventiveRefreshPendingSince = null;
  let preventiveRefreshWatchdogTimer = null;
  let serviceOpenCount = 0;
  const externalServiceOverlay = document.getElementById('externalServiceOverlay');
  const externalServiceTitle = document.getElementById('externalServiceTitle');
  const externalServiceMessage = document.getElementById('externalServiceMessage');
  const externalServiceConfirm = document.getElementById('externalServiceConfirm');
  const externalServiceCancel = document.getElementById('externalServiceCancel');
  const externalServiceClose = document.getElementById('externalServiceClose');
  const externalServiceFrame = document.getElementById('externalServiceFrame');
  let pendingExternalUrl = null;
  let pendingExternalTitle = null;

  if (
    !externalServiceOverlay ||
    !externalServiceTitle ||
    !externalServiceMessage ||
    !externalServiceConfirm ||
    !externalServiceCancel ||
    !externalServiceClose ||
    !externalServiceFrame
  ) {
    return;
  }

  const clearServiceLoadTimer = () => {
    if (serviceLoadTimer) {
      window.clearTimeout(serviceLoadTimer);
      serviceLoadTimer = null;
    }
  };

  const resetRetryState = () => {
    currentRetryCount = 0;
  };

  const clearServiceIdleTimer = () => {
    if (serviceIdleTimer) {
      window.clearTimeout(serviceIdleTimer);
      serviceIdleTimer = null;
    }
  };

  const clearPreventiveRefreshTimer = () => {
    if (preventiveRefreshTimer) {
      window.clearTimeout(preventiveRefreshTimer);
      preventiveRefreshTimer = null;
    }
  };

  const canRunPreventiveRefresh = () => (
    !document.hidden &&
    isHomeView(currentServiceUrl) &&
    externalServiceOverlay.hidden !== false
  );

  const runPreventiveRefresh = (reason) => {
    clearPreventiveRefreshTimer();
    preventiveRefreshPending = false;
    preventiveRefreshPendingSince = null;
    logServiceEvent('warn', 'Recarga preventiva del kiosco para liberar memoria', {
      reason,
      uptimeMs: performance.now ? Math.round(performance.now()) : null,
      serviceOpenCount,
    });
    window.setTimeout(() => {
      window.location.reload();
    }, APP_PREVENTIVE_REFRESH_GRACE_MS);
  };

  const requestPreventiveRefresh = (reason) => {
    if (canRunPreventiveRefresh()) {
      runPreventiveRefresh(reason);
      return;
    }

    if (!preventiveRefreshPending) {
      preventiveRefreshPending = true;
      preventiveRefreshPendingSince = Date.now();
    }

    logServiceEvent('info', 'Recarga preventiva diferida hasta volver al inicio', {
      reason,
      currentServiceUrl,
      serviceOpenCount,
      deferredForMs: Date.now() - preventiveRefreshPendingSince,
    });
  };

  const schedulePreventiveRefresh = () => {
    clearPreventiveRefreshTimer();
    preventiveRefreshTimer = window.setTimeout(() => {
      requestPreventiveRefresh('uptime-threshold');
    }, APP_PREVENTIVE_REFRESH_MS);
  };

  const clearPreventiveRefreshWatchdog = () => {
    if (preventiveRefreshWatchdogTimer) {
      window.clearInterval(preventiveRefreshWatchdogTimer);
      preventiveRefreshWatchdogTimer = null;
    }
  };

  const checkPreventiveRefreshWatchdog = () => {
    if (!preventiveRefreshPending || !preventiveRefreshPendingSince) {
      return;
    }

    const deferredForMs = Date.now() - preventiveRefreshPendingSince;

    if (deferredForMs >= PREVENTIVE_REFRESH_MAX_DEFER_MS) {
      logServiceEvent('warn', 'Forzando recarga preventiva: espera maxima superada dentro de un servicio', {
        deferredForMs,
        currentServiceUrl,
        currentServiceTitle,
        serviceOpenCount,
      });
      runPreventiveRefresh('forced-after-max-defer');
    }
  };

  const startPreventiveRefreshWatchdog = () => {
    clearPreventiveRefreshWatchdog();
    preventiveRefreshWatchdogTimer = window.setInterval(checkPreventiveRefreshWatchdog, 30000);
  };

  const maybeRunPendingPreventiveRefresh = (reason) => {
    if (!preventiveRefreshPending || !canRunPreventiveRefresh()) {
      return;
    }

    runPreventiveRefresh(reason);
  };

  const scheduleServiceIdleReturn = () => {
    clearServiceIdleTimer();

    if (isHomeView(currentServiceUrl) || externalServiceOverlay.hidden === false) {
      return;
    }

    serviceIdleTimer = window.setTimeout(() => {
      logServiceEvent('info', 'Retorno automatico al menu por inactividad', {
        url: currentServiceUrl,
        title: currentServiceTitle,
        idleTimeoutMs: SERVICE_IDLE_TIMEOUT,
      });
      goHome();
    }, SERVICE_IDLE_TIMEOUT);
  };

  const registerServiceInteraction = () => {
    if (isHomeView(currentServiceUrl)) {
      return;
    }

    scheduleServiceIdleReturn();
  };

  const updateHeader = (title, isService) => {
    mainTitle.textContent = isService ? title.toUpperCase() : '';
    frameStage.classList.toggle('is-service', isService);
  };

  const hideExternalOverlay = () => {
    externalServiceOverlay.hidden = true;
    externalServiceFrame.src = 'about:blank';
    pendingExternalUrl = null;
    pendingExternalTitle = null;
    registerServiceInteraction();
    maybeRunPendingPreventiveRefresh('overlay-closed');
  };

  const showExternalOverlay = (url, title) => {
    pendingExternalUrl = url;
    pendingExternalTitle = title || 'Servicio AGBC';
    externalServiceTitle.textContent = pendingExternalTitle;
    externalServiceMessage.textContent = `${pendingExternalTitle} se abrira sobre el kiosco, sin salir de esta pantalla.`;
    externalServiceOverlay.hidden = false;
    externalServiceFrame.src = url;
    logServiceEvent('info', 'Servicio abierto en modal embebido', {
      url,
      title: pendingExternalTitle,
      mode: 'overlay-iframe',
    });
  };

  const hideServiceError = () => {
    serviceErrorState.hidden = true;
    serviceErrorState.classList.remove('is-loading');
    frameStage.classList.remove('has-service-error');
  };

  const setServiceStatus = (title, message) => {
    serviceStatusTitle.textContent = title;
    serviceStatusMessage.textContent = message;
  };

  const showServiceLoading = () => {
    setServiceStatus(
      'Cargando servicio...',
      'Estamos esperando respuesta. Si tarda demasiado, puede haber una caida temporal. Si deseas salir, usa "Volver" o "Inicio".'
    );
    serviceErrorState.hidden = false;
    serviceErrorState.classList.add('is-loading');
    frameStage.classList.add('has-service-error');
  };

  const showServiceRetrying = (attemptNumber) => {
    setServiceStatus(
      'Reconectando servicio...',
      `El navegador detecto un problema al cargar. Reintentando automaticamente (${attemptNumber}/${MAX_SERVICE_RETRIES})...`
    );
    serviceErrorState.hidden = false;
    serviceErrorState.classList.add('is-loading');
    frameStage.classList.add('has-service-error');
  };

  const scheduleServiceRetry = (reason) => {
    if (!pendingServiceBaseUrl || currentRetryCount >= MAX_SERVICE_RETRIES) {
      return false;
    }

    currentRetryCount += 1;
    clearServiceLoadTimer();
    showServiceRetrying(currentRetryCount);
    logServiceEvent('warn', 'Reintentando carga del servicio', {
      url: currentServiceUrl,
      title: currentServiceTitle,
      reason,
      retryAttempt: currentRetryCount,
      maxRetries: MAX_SERVICE_RETRIES,
      retryDelayMs: SERVICE_RETRY_DELAY,
    });

    window.setTimeout(() => {
      serviceLoadStartedAt = Date.now();
      currentServiceUrl = buildFreshServiceUrl(pendingServiceBaseUrl);
      pendingServiceUrl = currentServiceUrl;
      frame.src = 'about:blank';
      window.setTimeout(() => {
        frame.src = currentServiceUrl;
      }, IFRAME_RESET_DELAY);
      serviceLoadTimer = window.setTimeout(() => {
        if (!scheduleServiceRetry('timeout')) {
          showServiceError();
        }
      }, SERVICE_LOAD_TIMEOUT);
    }, SERVICE_RETRY_DELAY);

    return true;
  };

  const showServiceError = () => {
    clearServiceLoadTimer();
    const diagnostics = getServiceDiagnostics(currentServiceUrl, currentServiceTitle);
    const elapsedMs = serviceLoadStartedAt ? Date.now() - serviceLoadStartedAt : null;
    setServiceStatus(
      diagnostics.title,
      `${diagnostics.message} ${diagnostics.details} Para regresar, presiona "Volver" o "Inicio".`
    );
    serviceErrorState.hidden = false;
    serviceErrorState.classList.remove('is-loading');
    frameStage.classList.add('has-service-error');
    frameStage.classList.remove('is-transitioning');
    logServiceEvent('error', 'Error al cargar servicio en iframe', {
      url: currentServiceUrl,
      title: currentServiceTitle,
      elapsedMs,
      diagnostics,
      hint: 'Revisa la pestana Network y la consola del navegador para errores de TLS, conexion o bloqueo de iframe.',
    });
  };

  const frameShowsBrowserError = () => {
    try {
      const frameWindow = frame.contentWindow;
      const frameDocument = frame.contentDocument;
      const frameHref = frameWindow?.location?.href || '';
      const frameTitle = (frameDocument?.title || '').toLowerCase();
      const frameBodyText = (frameDocument?.body?.innerText || '').slice(0, 800).toLowerCase();
      const frameBodyHtml = (frameDocument?.body?.innerHTML || '').slice(0, 1200).toLowerCase();
      const bodyChildrenCount = frameDocument?.body?.children?.length || 0;
      const bodyImageCount = frameDocument?.body?.querySelectorAll?.('img, svg, canvas, iframe, embed, object')?.length || 0;
      const bodyLinkCount = frameDocument?.body?.querySelectorAll?.('a, button, input, form')?.length || 0;
      const looksBlank =
        bodyChildrenCount <= 1 &&
        bodyImageCount === 0 &&
        bodyLinkCount === 0 &&
        frameBodyText.trim().length < 40;

      if (
        frameHref.startsWith('chrome-error://') ||
        frameHref.startsWith('edge-error://') ||
        frameHref === 'about:blank'
      ) {
        return true;
      }

      return (
        frameTitle.includes('site can') ||
        frameTitle.includes('problem loading') ||
        frameTitle.includes('no se puede acceder') ||
        frameTitle.includes('this page isn') ||
        frameTitle.includes('error') ||
        frameBodyText.includes('this page isn') ||
        frameBodyText.includes('site can') ||
        frameBodyText.includes('err_') ||
        frameBodyText.includes('no se puede acceder') ||
        frameBodyHtml.includes('chrome-error') ||
        frameBodyHtml.includes('main-frame-error') ||
        frameBodyHtml.includes('neterror') ||
        looksBlank
      );
    } catch (error) {
      return false;
    }
  };

  const finalizeServiceReady = (elapsedMs) => {
    clearServiceLoadTimer();
    hideServiceError();
    frameStage.classList.remove('is-transitioning');
    updateHeader(currentServiceTitle, true);
    logServiceEvent('info', 'Servicio cargado en iframe', {
      url: currentServiceUrl,
      title: currentServiceTitle,
      elapsedMs: serviceLoadStartedAt ? Date.now() - serviceLoadStartedAt : elapsedMs,
    });
  };

  const finalizeHomeView = () => {
    currentServiceUrl = HOME_PAGE;
    currentServiceTitle = 'Panel principal';
    pendingServiceUrl = null;
    pendingServiceBaseUrl = null;
    resetRetryState();
    clearServiceLoadTimer();
    clearServiceIdleTimer();
    frameStage.classList.remove('is-transitioning');
    frameStage.classList.remove('is-rebuilding');
    navigatingHome = false;
    serviceLoadStartedAt = null;
    hideServiceError();
    updateHeader(currentServiceTitle, false);
    hideExternalOverlay();
    logServiceEvent('info', 'Vista principal restaurada', {
      url: HOME_PAGE,
      title: currentServiceTitle,
    });
    maybeRunPendingPreventiveRefresh('home-ready');

    try {
      frame.contentWindow?.postMessage({ type: 'play-home-intro' }, '*');
    } catch (error) {
      console.error('No se pudo reproducir la animacion de inicio.', error);
    }
  };

  const openService = (url, title) => {
    const normalizedUrl = normalizeServiceUrl(url);

    if (!normalizedUrl) {
      logServiceEvent('warn', 'Intento de apertura sin URL', { title });
      return;
    }

    if (isTrackingService(normalizedUrl)) {
      hideExternalOverlay();
    }

    hideExternalOverlay();
    currentServiceUrl = buildFreshServiceUrl(normalizedUrl);
    currentServiceTitle = title || 'Servicio AGBC';
    serviceOpenCount += 1;
    pendingServiceBaseUrl = normalizedUrl;
    pendingServiceUrl = currentServiceUrl;
    serviceLoadStartedAt = Date.now();
    resetRetryState();
    clearServiceIdleTimer();
    frameStage.classList.toggle('is-reclamos-view', isReclamosService(normalizedUrl));
    updateHeader(currentServiceTitle, true);
    frameStage.classList.remove('is-rebuilding');
    frameStage.classList.add('is-transitioning');
    showServiceLoading();
    logServiceEvent('info', 'Iniciando carga de servicio', {
      requestedUrl: url,
      url: normalizedUrl,
      title: currentServiceTitle,
      serviceOpenCount,
      timeoutMs: SERVICE_LOAD_TIMEOUT,
      expectedBehavior: 'El iframe deberia emitir load antes del timeout.',
    });
    if (serviceOpenCount >= MAX_SERVICE_OPENS_BEFORE_REFRESH) {
      requestPreventiveRefresh('navigation-threshold');
    }
    clearServiceLoadTimer();
    serviceLoadTimer = window.setTimeout(showServiceError, SERVICE_LOAD_TIMEOUT);

    frame.src = 'about:blank';
    window.setTimeout(() => {
      frame.src = currentServiceUrl;
      logServiceEvent('info', 'src del iframe actualizado', {
        requestedUrl: url,
        url: currentServiceUrl,
        baseUrl: normalizedUrl,
        title: currentServiceTitle,
      });
    }, IFRAME_RESET_DELAY);
  };

  const goHome = () => {
    navigatingHome = true;
    currentServiceUrl = HOME_PAGE;
    pendingServiceUrl = null;
    pendingServiceBaseUrl = null;
    resetRetryState();
    clearServiceLoadTimer();
    clearServiceIdleTimer();
    serviceLoadStartedAt = null;
    hideServiceError();
    hideExternalOverlay();
    frameStage.classList.remove('is-reclamos-view');
    frameStage.classList.remove('is-service');
    frameStage.classList.add('is-rebuilding');
    updateHeader('Panel principal', false);
    logServiceEvent('info', 'Volviendo al inicio', {
      previousUrl: currentServiceUrl,
      nextUrl: HOME_PAGE,
    });

    frame.src = 'about:blank';
    window.setTimeout(() => {
      frame.src = HOME_PAGE;
    }, 220);
  };

  homeButton.addEventListener('click', goHome);

  backButton.addEventListener('click', () => {
    if (!externalServiceOverlay.hidden) {
      hideExternalOverlay();
      return;
    }

    if (!isHomeView(currentServiceUrl)) {
      goHome();
    }
  });

  frame.addEventListener('load', () => {
    const frameUrl = frame.getAttribute('src') || '';
    const elapsedMs = serviceLoadStartedAt ? Date.now() - serviceLoadStartedAt : null;

    logServiceEvent('info', 'Evento load del iframe', {
      frameUrl,
      currentServiceUrl,
      currentServiceTitle,
      elapsedMs,
      isHome: isHomeView(frameUrl),
    });

    if (isHomeView(frameUrl)) {
      window.setTimeout(finalizeHomeView, navigatingHome ? REBUILD_DURATION : 180);
      return;
    }

    if (pendingServiceUrl && frameUrl === pendingServiceUrl) {
      window.setTimeout(() => {
        if (frameShowsBrowserError()) {
          logServiceEvent('error', 'El iframe cargo una pagina de error del navegador', {
            url: currentServiceUrl,
            title: currentServiceTitle,
            elapsedMs: serviceLoadStartedAt ? Date.now() - serviceLoadStartedAt : elapsedMs,
          });
          if (!scheduleServiceRetry('browser-error-page')) {
            showServiceError();
          }
          return;
        }

        window.setTimeout(() => {
          finalizeServiceReady(elapsedMs);
          scheduleServiceIdleReturn();
        }, 220);
      }, SERVICE_TRANSITION_DURATION);
    }
  });

  frame.addEventListener('error', () => {
    logServiceEvent('error', 'Evento error del iframe', {
      url: currentServiceUrl,
      title: currentServiceTitle,
      hint: 'Este evento no siempre se dispara en bloqueos cross-origin, pero si aparece indica fallo de carga directo.',
    });
    if (!scheduleServiceRetry('iframe-error-event')) {
      showServiceError();
    }
  });

  externalServiceCancel.addEventListener('click', () => {
    logServiceEvent('info', 'Cierre de modal solicitado por el usuario', {
      url: pendingExternalUrl,
      title: pendingExternalTitle,
    });
    hideExternalOverlay();
  });

  externalServiceClose.addEventListener('click', hideExternalOverlay);

  externalServiceConfirm.addEventListener('click', () => {
    if (!pendingExternalUrl) {
      return;
    }

    logServiceEvent('info', 'Recargando servicio dentro del modal', {
      url: pendingExternalUrl,
      title: pendingExternalTitle,
    });
    externalServiceFrame.src = pendingExternalUrl;
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !externalServiceOverlay.hidden) {
      hideExternalOverlay();
    }
  });

  ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'].forEach((eventName) => {
    window.addEventListener(eventName, registerServiceInteraction, { passive: true });
  });

  frame.addEventListener('focus', registerServiceInteraction);
  frame.addEventListener('mouseenter', registerServiceInteraction);

  window.addEventListener('message', (event) => {
    const { data } = event;

    if (!data || typeof data !== 'object') {
      return;
    }

    if (data.type === 'open-service') {
      logServiceEvent('info', 'Solicitud recibida desde la vista hija', {
        url: data.url,
        title: data.title,
      });
      openService(data.url, data.title);
    }

    if (data.type === 'home-ready' && navigatingHome) {
      logServiceEvent('info', 'La vista hija informo que el inicio esta listo', {
        url: HOME_PAGE,
      });
      finalizeHomeView();
    }
  });

  updateHeader(currentServiceTitle, false);
  hideServiceError();
  schedulePreventiveRefresh();
  startPreventiveRefreshWatchdog();

  const absoluteMaxUptimeTimer = window.setTimeout(() => {
    logServiceEvent('warn', 'Recarga forzada por tiempo maximo de actividad del kiosco', {
      uptimeMs: performance.now ? Math.round(performance.now()) : null,
      serviceOpenCount,
    });
    window.location.reload();
  }, ABSOLUTE_MAX_UPTIME_MS);

  window.addEventListener('pagehide', () => {
    clearPreventiveRefreshTimer();
    clearPreventiveRefreshWatchdog();
    window.clearTimeout(absoluteMaxUptimeTimer);
  }, { once: true });
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.location.protocol === 'file:') {
    logServiceEvent('warn', 'La aplicacion se esta ejecutando en file://. Para iframes y postMessage confiables, usa http://localhost');
  }
  applyTimeOfDayTheme();
  const themeTimer = window.setInterval(applyTimeOfDayTheme, 60000);
  window.addEventListener('pagehide', () => {
    window.clearInterval(themeTimer);
  }, { once: true });
  setupChildView();
  setupParentShell();
});
