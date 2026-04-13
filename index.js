const HOME_PAGE = 'index2.html';
const REBUILD_DURATION = 1100;
const SERVICE_TRANSITION_DURATION = 850;
const OVERLAY_HIDE_DELAY = 4000;
const SERVICE_LOAD_ERROR_TIMEOUT = 12000;
const IDLE_TIMEOUT = 12000;
const IDLE_LOGO_CYCLE_DELAY = 30000;
const IDLE_LOGO_TILE_COUNT = 6;
const IDLE_LOGO_ANIMATION_DURATION = 3600;
const TRACKING_URL = 'https://trackingbo.correos.gob.bo:8100/';

function isHomeView(url) {
  return typeof url === 'string' && url.includes(HOME_PAGE);
}

function setupChildView() {
  const trackingMain = document.querySelector('.tracking-main');
  const cards = document.querySelectorAll('.service-card');
  const trackingLaunch = document.querySelector('[data-tracking-launch]');
  const externalLaunchButtons = document.querySelectorAll('[data-external-launch]');
  const idleLogoMosaic = document.getElementById('idleLogoMosaic');

  if (trackingLaunch) {
    trackingLaunch.addEventListener('click', () => {
      window.top.location.href = TRACKING_URL;
    });
  }

  externalLaunchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetUrl = button.dataset.externalLaunch;

      if (targetUrl) {
        window.top.location.href = targetUrl;
      }
    });
  });

  if (!trackingMain || cards.length === 0) {
    return;
  }

  let idleTimer = null;
  let idleActive = false;
  let idleLogoCycleTimer = null;

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

  ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach((eventName) => {
    window.addEventListener(eventName, resetIdleTimer, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      exitIdleMode();
      if (idleTimer) {
        window.clearTimeout(idleTimer);
      }
      return;
    }

    resetIdleTimer();
  });

  cards.forEach((card) => {
    let hoverTimer = null;
    const url = card.dataset.url;
    const title = card.dataset.title;

    const clearFlipTimer = () => {
      if (hoverTimer) {
        window.clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    };

    card.addEventListener('pointerenter', () => {
      exitIdleMode();
      clearFlipTimer();
      hoverTimer = window.setTimeout(() => {
        card.classList.add('flipped');
      }, 5000);
    });

    card.addEventListener('pointerleave', () => {
      clearFlipTimer();
      card.classList.remove('flipped');
    });

    const openService = () => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'open-service', url, title }, '*');
        return;
      }

      window.location.href = url;
    };

    card.addEventListener('click', (event) => {

      openService();
    });
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'play-home-intro') {
      trackingMain.classList.remove('rebuild-sequence');
      void trackingMain.offsetWidth;
      trackingMain.classList.add('rebuild-sequence');
      resetIdleTimer();
    }
  });

  createIdleLogoTiles();
  resetIdleTimer();
  notifyParentReady();
}

function setupParentShell() {
  const frame = document.getElementById('serviceFrame');
  const frameStage = document.getElementById('frameStage');
  const homeButton = document.getElementById('homeButton');
  const backButton = document.getElementById('backButton');
  const overlayTitle = document.getElementById('overlayTitle');
  const frameOverlay = document.getElementById('frameOverlay');
  const serviceErrorState = document.getElementById('serviceErrorState');

  if (!frame || !frameStage || !homeButton || !backButton || !overlayTitle || !frameOverlay || !serviceErrorState) {
    return;
  }

  let currentServiceUrl = HOME_PAGE;
  let currentServiceTitle = 'Panel principal';
  let navigatingHome = false;
  let overlayTimer = null;
  let serviceLoadTimer = null;
  let serviceProbeController = null;
  let activeServiceUrl = HOME_PAGE;
  let serviceFrameLoaded = false;
  let serviceProbeSucceeded = false;

  const clearOverlayTimer = () => {
    if (overlayTimer) {
      window.clearTimeout(overlayTimer);
      overlayTimer = null;
    }
  };

  const hideOverlaySoon = () => {
    clearOverlayTimer();
    frameOverlay.classList.remove('is-hidden');
    overlayTimer = window.setTimeout(() => {
      frameOverlay.classList.add('is-hidden');
    }, OVERLAY_HIDE_DELAY);
  };

  const clearServiceLoadMonitor = () => {
    if (serviceLoadTimer) {
      window.clearTimeout(serviceLoadTimer);
      serviceLoadTimer = null;
    }

    if (serviceProbeController) {
      serviceProbeController.abort();
      serviceProbeController = null;
    }
  };

  const hideServiceError = () => {
    serviceErrorState.hidden = true;
    frameStage.classList.remove('has-service-error');
  };

  const showServiceError = () => {
    clearServiceLoadMonitor();
    frameStage.classList.remove('is-transitioning');
    frameOverlay.classList.add('is-hidden');
    serviceErrorState.hidden = false;
    frameStage.classList.add('has-service-error');
  };

  const watchServiceLoad = (url) => {
    clearServiceLoadMonitor();
    serviceFrameLoaded = false;
    serviceProbeSucceeded = false;

    serviceLoadTimer = window.setTimeout(showServiceError, SERVICE_LOAD_ERROR_TIMEOUT);

    if (!url || isHomeView(url) || !window.AbortController || !window.fetch) {
      return;
    }

    serviceProbeController = new AbortController();
    const { signal } = serviceProbeController;

    fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal,
    })
      .then(() => {
        if (!signal.aborted) {
          serviceProbeSucceeded = true;
          serviceProbeController = null;
          revealServiceWhenReady();
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          showServiceError();
        }
      });
  };

  const frameWasRejected = () => {
    if (!activeServiceUrl || isHomeView(activeServiceUrl)) {
      return false;
    }

    try {
      const frameLocation = frame.contentWindow?.location;
      const visibleUrl = frameLocation?.href || '';

      return !visibleUrl || visibleUrl === 'about:blank' || isHomeView(visibleUrl);
    } catch (error) {
      return false;
    }
  };

  const revealServiceWhenReady = () => {
    if (!serviceFrameLoaded || !serviceProbeSucceeded) {
      return;
    }

    if (frameWasRejected()) {
      showServiceError();
      return;
    }

    clearServiceLoadMonitor();
    frameStage.classList.remove('is-transitioning');
    updateHeader(currentServiceTitle, true);
    hideOverlaySoon();
  };

  const updateHeader = (title, isService) => {
    const mainTitle = document.getElementById('dynamicHeaderTitle');

    if (mainTitle) {
      // Si isService es true, pone el título de la carta. Si no, vuelve a PANEL PRINCIPAL.
      mainTitle.textContent = isService ? title.toUpperCase() : "";
    }


    // Opcional: Ocultar el overlay azul de carga después de que cambie el título
    if (frameOverlay) {
      frameOverlay.classList.add('is-hidden');
    }
  };

  const finalizeHomeView = () => {
    currentServiceUrl = HOME_PAGE;
    currentServiceTitle = 'Panel principal';
    activeServiceUrl = HOME_PAGE;
    clearOverlayTimer();
    frameOverlay.classList.add('is-hidden');
    updateHeader(currentServiceTitle, false);
    frameStage.classList.remove('is-transitioning');
    frameStage.classList.remove('is-rebuilding');
    navigatingHome = false;
    serviceFrameLoaded = false;
    serviceProbeSucceeded = false;
    clearServiceLoadMonitor();
    hideServiceError();

    try {
      frame.contentWindow?.postMessage({ type: 'play-home-intro' }, '*');
    } catch (error) {
      console.error('No se pudo reproducir la animacion de inicio.', error);
    }
  };

  const goHome = () => {
    navigatingHome = true;
    frameStage.classList.remove('is-service');
    frameStage.classList.add('is-rebuilding');
    updateHeader('Reconstruyendo panel principal', false);
    serviceFrameLoaded = false;
    serviceProbeSucceeded = false;
    clearServiceLoadMonitor();
    hideServiceError();

    window.setTimeout(() => {
      frame.src = HOME_PAGE;
    }, 260);
  };

  const openService = (url, title) => {
    if (!url) {
      currentServiceTitle = title || 'Servicio AGBC';
      updateHeader(currentServiceTitle, true);
      showServiceError();
      return;
    }

    // 🔥 FIX: detectar tracking y abrir fuera del iframe
if (url.includes('correos.gob.bo')) {
  window.open(url, '_blank');
  return;
}
    currentServiceUrl = url;
    currentServiceTitle = title || 'Servicio AGBC';
    activeServiceUrl = url;
    serviceFrameLoaded = false;
    serviceProbeSucceeded = false;
    updateHeader(currentServiceTitle, true);
    frameStage.classList.remove('is-rebuilding');
    frameStage.classList.add('is-transitioning');
    frameOverlay.classList.remove('is-hidden');
    hideServiceError();
    watchServiceLoad(url);

    window.setTimeout(() => {
      frame.src = url;
    }, 220);
  };

  homeButton.addEventListener('click', goHome);

  backButton.addEventListener('click', () => {
    if (isHomeView(currentServiceUrl) || isHomeView(frame.src)) {
      goHome();
      return;
    }

    goHome();
  });

  frame.addEventListener('load', () => {
    const frameUrl = frame.getAttribute('src') || '';
    const showingHome = isHomeView(frameUrl);

    if (showingHome) {
      window.setTimeout(finalizeHomeView, navigatingHome ? REBUILD_DURATION : 180);
      return;
    }

    window.setTimeout(() => {
      serviceFrameLoaded = true;
      revealServiceWhenReady();
    }, SERVICE_TRANSITION_DURATION);
  });

  frame.addEventListener('error', showServiceError);

  window.addEventListener('message', (event) => {
    const { data } = event;

    if (!data || typeof data !== 'object') {
      return;
    }

    if (data.type === 'open-service') {
      // Si es rastreo, abre en ventana nueva porque rechaza CORS en iframe
      openService(data.url, data.title);
    }

    if (data.type === 'home-ready' && navigatingHome) {
      finalizeHomeView();
    }
  });

  frameOverlay.classList.add('is-hidden');
  updateHeader(currentServiceTitle, false);
}

window.addEventListener('DOMContentLoaded', () => {
  setupChildView();
  setupParentShell();
});

const updateHeader = (title, isService) => {
  // Si hay un título lo pone, si no, usa el genérico
  overlayTitle.textContent = title || 'Servicio AGBC';

  frameStage.classList.toggle('is-service', isService);
  frameOverlay.classList.toggle('is-hidden', !isService);

  // Aseguramos que el overlay tenga una clase para aplicar el centrado
  frameOverlay.style.display = 'flex';
  frameOverlay.style.justifyContent = 'center';
  frameOverlay.style.alignItems = 'center';
};
