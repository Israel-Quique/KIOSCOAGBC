const HOME_PAGE = 'index2.html';
const REBUILD_DURATION = 1100;
const SERVICE_TRANSITION_DURATION = 850;
const SERVICE_LOAD_TIMEOUT = 10000;
const CARD_FLIP_INTERVAL = 2000;
const CARD_SHAKE_DURATION = 1000;
const IDLE_TIMEOUT = 12000;
const IDLE_LOGO_CYCLE_DELAY = 30000;
const IDLE_LOGO_TILE_COUNT = 6;
const IDLE_LOGO_ANIMATION_DURATION = 3600;
const TRACKING_URL = 'https://trackingbo.correos.gob.bo:8100/';

function isHomeView(url) {
  return typeof url === 'string' && url.includes(HOME_PAGE);
}

function isTrackingService(url) {
  return typeof url === 'string' && url.toLowerCase().includes('trackingbo');
}

function isHighRiskService(url) {
  const normalizedUrl = (url || '').toLowerCase();
  return normalizedUrl.includes('postar.correos.gob.bo:8104') || normalizedUrl.includes('sireco.correos.gob.bo:8102');
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
      title: `${serviceTitle}: problema de conexion segura`,
      message: 'El servidor responde por el puerto 8100, pero la sesion HTTPS/TLS no logra completarse correctamente.',
      details: 'En las pruebas de red el puerto 8100 estuvo abierto, pero la negociacion segura fallo. Eso suele indicar una configuracion SSL/TLS antigua, un certificado incompatible o bloqueo para contenido embebido.',
    };
  }

  if (normalizedUrl.includes('postar.correos.gob.bo:8104')) {
    return {
      title: `${serviceTitle}: servidor sin respuesta`,
      message: 'El host fue localizado, pero el puerto 8104 no acepto conexion.',
      details: 'Esto apunta a servicio caido, puerto cerrado o acceso limitado solo a una red interna/VPN. Mientras el servidor no responda, el kiosco no podra mostrar esa pagina.',
    };
  }

  if (normalizedUrl.includes('sireco.correos.gob.bo:8102')) {
    return {
      title: `${serviceTitle}: servidor sin respuesta`,
      message: 'El host fue localizado, pero el puerto 8102 no acepto conexion.',
      details: 'Esto apunta a servicio caido, puerto cerrado o acceso limitado solo a una red interna/VPN. Mientras el servidor no responda, el kiosco no podra mostrar esa pagina.',
    };
  }

  if (normalizedUrl.includes('ips.correos.gob.bo')) {
    return {
      title: `${serviceTitle}: carga embebida rechazada`,
      message: 'El servidor principal responde, pero la pagina puede estar rechazando mostrarse dentro de un iframe.',
      details: 'Si la aplicacion externa usa politicas como X-Frame-Options o Content-Security-Policy frame-ancestors, el navegador la bloqueara aunque el enlace exista.',
    };
  }

  return {
    title: `${serviceTitle}: no se pudo cargar`,
    message: 'El enlace externo no pudo mostrarse dentro del kiosco.',
    details: 'Revisa disponibilidad del servidor, certificado HTTPS y politicas de carga embebida del sitio destino.',
  };
}

function setupChildView() {
  const trackingMain = document.querySelector('.tracking-main');
  const cards = document.querySelectorAll('.service-card');
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
  const mainTitle = document.getElementById('dynamicHeaderTitle');
  const serviceErrorState = document.getElementById('serviceErrorState');

  if (!frame || !frameStage || !homeButton || !backButton || !mainTitle || !serviceErrorState) {
    return;
  }

  let currentServiceUrl = HOME_PAGE;
  let currentServiceTitle = 'Panel principal';
  let navigatingHome = false;
  let pendingServiceUrl = null;
  let serviceLoadTimer = null;
  let serviceLoadStartedAt = null;
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

  const updateHeader = (title, isService) => {
    mainTitle.textContent = isService ? title.toUpperCase() : '';
    frameStage.classList.toggle('is-service', isService);
  };

  const hideExternalOverlay = () => {
    externalServiceOverlay.hidden = true;
    externalServiceFrame.src = 'about:blank';
    pendingExternalUrl = null;
    pendingExternalTitle = null;
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

  const showServiceLoading = () => {
    serviceErrorState.hidden = false;
    serviceErrorState.classList.add('is-loading');
    frameStage.classList.add('has-service-error');
  };

  const showServiceError = () => {
    clearServiceLoadTimer();
    const diagnostics = getServiceDiagnostics(currentServiceUrl, currentServiceTitle);
    const elapsedMs = serviceLoadStartedAt ? Date.now() - serviceLoadStartedAt : null;
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

  const finalizeHomeView = () => {
    currentServiceUrl = HOME_PAGE;
    currentServiceTitle = 'Panel principal';
    pendingServiceUrl = null;
    clearServiceLoadTimer();
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

    try {
      frame.contentWindow?.postMessage({ type: 'play-home-intro' }, '*');
    } catch (error) {
      console.error('No se pudo reproducir la animacion de inicio.', error);
    }
  };

  const openService = (url, title) => {
    if (!url) {
      logServiceEvent('warn', 'Intento de apertura sin URL', { title });
      return;
    }

    if (isTrackingService(url)) {
      hideExternalOverlay();
    }

    hideExternalOverlay();
    currentServiceUrl = url;
    currentServiceTitle = title || 'Servicio AGBC';
    pendingServiceUrl = url;
    serviceLoadStartedAt = Date.now();
    updateHeader(currentServiceTitle, true);
    frameStage.classList.remove('is-rebuilding');
    frameStage.classList.add('is-transitioning');
    showServiceLoading();
    logServiceEvent('info', 'Iniciando carga de servicio', {
      url,
      title: currentServiceTitle,
      timeoutMs: SERVICE_LOAD_TIMEOUT,
      expectedBehavior: 'El iframe deberia emitir load antes del timeout.',
    });
    clearServiceLoadTimer();
    serviceLoadTimer = window.setTimeout(showServiceError, SERVICE_LOAD_TIMEOUT);

    window.setTimeout(() => {
      frame.src = url;
      logServiceEvent('info', 'src del iframe actualizado', {
        url,
        title: currentServiceTitle,
      });
    }, 140);
  };

  const goHome = () => {
    navigatingHome = true;
    currentServiceUrl = HOME_PAGE;
    pendingServiceUrl = null;
    clearServiceLoadTimer();
    serviceLoadStartedAt = null;
    hideServiceError();
    hideExternalOverlay();
    frameStage.classList.remove('is-service');
    frameStage.classList.add('is-rebuilding');
    updateHeader('Panel principal', false);
    logServiceEvent('info', 'Volviendo al inicio', {
      previousUrl: currentServiceUrl,
      nextUrl: HOME_PAGE,
    });

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
          showServiceError();
          return;
        }

        if (isHighRiskService(currentServiceUrl)) {
          try {
            const bodyText = (frame.contentDocument?.body?.innerText || '').trim();
            const bodyMediaCount = frame.contentDocument?.body?.querySelectorAll?.('img, svg, canvas, iframe, embed, object')?.length || 0;
            const bodyInteractiveCount = frame.contentDocument?.body?.querySelectorAll?.('a, button, input, form, select, textarea')?.length || 0;

            if (bodyText.length < 60 && bodyMediaCount === 0 && bodyInteractiveCount === 0) {
              logServiceEvent('error', 'El iframe cargo contenido no visible o vacio para un servicio de alto riesgo', {
                url: currentServiceUrl,
                title: currentServiceTitle,
                elapsedMs: serviceLoadStartedAt ? Date.now() - serviceLoadStartedAt : elapsedMs,
              });
              showServiceError();
              return;
            }
          } catch (error) {
            logServiceEvent('warn', 'No se pudo verificar visibilidad interna del servicio de alto riesgo; se mantiene validacion normal', {
              url: currentServiceUrl,
              title: currentServiceTitle,
            });
          }
        }

        window.setTimeout(() => {
          clearServiceLoadTimer();
          hideServiceError();
          frameStage.classList.remove('is-transitioning');
          updateHeader(currentServiceTitle, true);
          logServiceEvent('info', 'Servicio cargado en iframe', {
            url: currentServiceUrl,
            title: currentServiceTitle,
            elapsedMs: serviceLoadStartedAt ? Date.now() - serviceLoadStartedAt : elapsedMs,
          });
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
    showServiceError();
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
}

window.addEventListener('DOMContentLoaded', () => {
  applyTimeOfDayTheme();
  window.setInterval(applyTimeOfDayTheme, 60000);
  setupChildView();
  setupParentShell();
});
