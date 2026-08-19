if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

document.addEventListener('DOMContentLoaded', () => {
  // Countdown to wedding (10 Oct 2026, 13:00)
  const countdownRoot = document.getElementById('countdownStrip');
  const countdownEl = document.getElementById('countdown');
  const countdownFallback = document.getElementById('countdownFallback');
  if (countdownRoot && countdownEl) {
    const weddingDate = new Date(countdownRoot.dataset.wedding || '2026-10-10T13:00:00');
    const daysEl = document.getElementById('countdownDays');
    const hoursEl = document.getElementById('countdownHours');
    const minutesEl = document.getElementById('countdownMinutes');
    const secondsEl = document.getElementById('countdownSeconds');

    function updateCountdown() {
      const now = new Date();
      const diff = weddingDate - now;

      if (diff <= 0) {
        countdownEl.style.display = 'none';
        if (countdownFallback) countdownFallback.style.display = 'block';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = days;
      if (hoursEl) hoursEl.textContent = hours;
      if (minutesEl) minutesEl.textContent = minutes;
      if (secondsEl) secondsEl.textContent = seconds;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Música de fondo (solo tras abrir el sobre) + botón flotante silenciar/activar
  const invitationMusic = document.getElementById('invitationMusic');
  const soundToggle = document.getElementById('soundToggle');
  const INVITATION_MUSIC_FILE = 'Gladiator - Now We Are Free Super Theme Song.mp3';
  const INVITATION_MUSIC_START_SEC = 10;
  let invitationMusicStarted = false;
  let invitationMusicMuted = false;

  if (invitationMusic) {
    invitationMusic.src = `assets/${encodeURIComponent(INVITATION_MUSIC_FILE)}`;
    invitationMusic.addEventListener('ended', () => {
      if (invitationMusicMuted) return;
      invitationMusic.currentTime = INVITATION_MUSIC_START_SEC;
      invitationMusic.play().catch(() => {});
    });
  }

  function seekInvitationMusicStart() {
    if (!invitationMusic) return;
    try {
      if (invitationMusic.readyState >= 1) {
        invitationMusic.currentTime = INVITATION_MUSIC_START_SEC;
      } else {
        invitationMusic.addEventListener(
          'loadedmetadata',
          () => {
            invitationMusic.currentTime = INVITATION_MUSIC_START_SEC;
          },
          { once: true }
        );
      }
    } catch {
      /* ignore */
    }
  }

  function renderSoundToggleIcon() {
    if (!soundToggle) return;

    const iconName = invitationMusicMuted ? 'ph-speaker-slash' : 'ph-speaker-high';
    soundToggle.innerHTML = '';

    const iconEl = document.createElement('i');
    iconEl.className = `ph-thin ${iconName} sound-toggle__icon`;
    iconEl.id = 'soundToggleIcon';
    iconEl.setAttribute('aria-hidden', 'true');
    soundToggle.appendChild(iconEl);
  }

  function updateSoundToggleUi() {
    if (!soundToggle) return;
    soundToggle.classList.toggle('is-muted', invitationMusicMuted);
    soundToggle.setAttribute('aria-pressed', invitationMusicMuted ? 'true' : 'false');
    soundToggle.setAttribute(
      'aria-label',
      invitationMusicMuted ? 'Activar música' : 'Silenciar música'
    );
    soundToggle.setAttribute(
      'title',
      invitationMusicMuted ? 'Activar música' : 'Silenciar música'
    );
    renderSoundToggleIcon();
  }

  function pauseInvitationMusic() {
    if (!invitationMusic) return;
    invitationMusic.pause();
  }

  function startInvitationMusic() {
    if (!invitationMusic || invitationMusicMuted) return;
    invitationMusicStarted = true;
    if (invitationMusic.currentTime < INVITATION_MUSIC_START_SEC) {
      seekInvitationMusicStart();
    }
    invitationMusic.play().catch(() => {
      invitationMusicStarted = false;
    });
  }

  function resumeInvitationMusicIfAllowed() {
    if (!invitationMusic || invitationMusicMuted) return;
    invitationMusicStarted = true;
    if (invitationMusic.currentTime < INVITATION_MUSIC_START_SEC) {
      seekInvitationMusicStart();
    }
    invitationMusic.play().catch(() => {
      invitationMusicStarted = false;
    });
  }

  if (soundToggle) {
    updateSoundToggleUi();
    soundToggle.addEventListener('click', () => {
      invitationMusicMuted = !invitationMusicMuted;
      updateSoundToggleUi();
      if (invitationMusicMuted) {
        pauseInvitationMusic();
        return;
      }
      if (invitationMain?.classList.contains('opened')) {
        resumeInvitationMusicIfAllowed();
      }
    });
  }

  // Letter overlay: sobre estático → al clic abre la invitación
  const letterOverlay = document.getElementById('letterOverlay');
  const invitationMain = document.getElementById('invitationMain');
  const heroCtaBtn = document.querySelector('.hero-cta-btn');
  const storySection = document.querySelector('.story');
  const storyQuote = document.getElementById('storyQuote');
  const storyQuoteIt = storyQuote?.querySelector('.story-quote__line--it');
  const storyQuoteEs = storyQuote?.querySelector('.story-quote__line--es');
  let storyTranslateStarted = false;
  let storyTranslateTimeoutId = null;
  let storyShowingSpanish = false;
  let storyQuotePaused = true;
  let storyWaitResolve = null;
  let storyCycleToken = 0;
  let letterFadeTimeoutId = null;
  let letterCloseTimeoutId = null;
  let letterHeroEnterTimeoutId = null;

  const clearLetterTimers = () => {
    if (letterFadeTimeoutId) {
      clearTimeout(letterFadeTimeoutId);
      letterFadeTimeoutId = null;
    }
    if (letterCloseTimeoutId) {
      clearTimeout(letterCloseTimeoutId);
      letterCloseTimeoutId = null;
    }
    if (letterHeroEnterTimeoutId) {
      clearTimeout(letterHeroEnterTimeoutId);
      letterHeroEnterTimeoutId = null;
    }
  };

  function scrollToTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function restartLetterIntroAnimations() {
    if (!letterOverlay) return;
    const els = letterOverlay.querySelectorAll(
      '.letter-message, .letter-hint, .letter-names, .letter-envelope-wrap, .letter-fade-white, .letter-envelope-full'
    );
    els.forEach((el) => {
      el.style.animation = 'none';
    });
    void letterOverlay.offsetWidth;
    els.forEach((el) => {
      el.style.removeProperty('animation');
    });
  }

  function resetInvitationToStart({ restartLetterIntro = false } = {}) {
    scrollToTop();

    document.documentElement.classList.add('is-letter-locked');

    if (letterOverlay) {
      letterOverlay.classList.remove('seal-break', 'opening', 'closed', 'is-playing');
      letterOverlay.removeAttribute('aria-hidden');
      const letterOpenBtn = document.getElementById('letterOpenBtn');
      if (letterOpenBtn) letterOpenBtn.disabled = false;
    }

    clearLetterTimers();

    if (invitationMain) {
      invitationMain.classList.remove('visible', 'opened', 'hero-enter');
      invitationMain.querySelectorAll('.hero-visual, .hero-title__img, .hero-cta-btn').forEach((el) => {
        el.getAnimations?.().forEach((anim) => anim.cancel());
      });
    }

    // Solo tras bfcache/pageshow: re-lanzar intros. Nunca cancel() a secas (deja opacity:0).
    if (restartLetterIntro) {
      restartLetterIntroAnimations();
    }

    if (invitationMusic) {
      invitationMusic.pause();
      invitationMusic.currentTime = INVITATION_MUSIC_START_SEC;
    }
    invitationMusicStarted = false;

    if (heroCtaBtn) heroCtaBtn.classList.remove('hidden');

    storyTranslateStarted = false;
    storyShowingSpanish = false;
    storyQuotePaused = true;
    storyCycleToken += 1;
    if (storyWaitResolve) {
      const resolve = storyWaitResolve;
      storyWaitResolve = null;
      resolve(false);
    }
    if (storyTranslateTimeoutId) {
      clearTimeout(storyTranslateTimeoutId);
      storyTranslateTimeoutId = null;
    }
    if (storyQuote) storyQuote.classList.remove('is-morphing');
    if (storyQuoteIt && storyQuoteEs) {
      [storyQuoteIt, storyQuoteEs].forEach((el) => {
        el.getAnimations?.().forEach((anim) => anim.cancel());
        el.classList.remove('is-animating', 'is-leaving', 'is-active');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
        el.style.removeProperty('filter');
        el.style.removeProperty('letter-spacing');
      });
      storyQuoteIt.classList.add('is-active');
      storyQuoteIt.removeAttribute('aria-hidden');
      storyQuoteEs.setAttribute('aria-hidden', 'true');
    }
    if (storySection) storySection.classList.remove('in-view');

    document.querySelectorAll('.reveal-on-scroll.is-visible').forEach((el) => {
      el.classList.remove('is-visible');
    });
  }

  resetInvitationToStart();
  window.addEventListener('pageshow', (event) => {
    resetInvitationToStart({ restartLetterIntro: event.persisted });
  });
  window.addEventListener('load', scrollToTop);

  if (letterOverlay && invitationMain) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const LETTER_HOLD_MS = prefersReducedMotion ? 0 : 420;
    const LETTER_FADE_MS = prefersReducedMotion ? 120 : 900;
    /* Arranca a mitad del fade del overlay: puente continuo, sin pausa muerta */
    const LETTER_OVERLAY_OUT_MS = prefersReducedMotion ? 0 : 380;

    const startHeroEnter = () => {
      invitationMain.classList.add('hero-enter');
      letterHeroEnterTimeoutId = null;
    };

    const letterOpenBtn = document.getElementById('letterOpenBtn');

    const finishLetterOverlay = () => {
      letterOverlay.classList.add('closed');
      letterOverlay.setAttribute('aria-hidden', 'true');
      if (letterOpenBtn) letterOpenBtn.disabled = true;
      document.documentElement.classList.remove('is-letter-locked');

      if (letterOpenBtn && typeof letterOpenBtn.blur === 'function') {
        letterOpenBtn.blur();
      }

      if (!invitationMain.hasAttribute('tabindex')) {
        invitationMain.setAttribute('tabindex', '-1');
      }
      try {
        invitationMain.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }

      // Esperar a que el fundido del overlay termine antes del zoom / título / CTA
      letterHeroEnterTimeoutId = setTimeout(startHeroEnter, LETTER_OVERLAY_OUT_MS);

      letterCloseTimeoutId = null;
    };

    const startLetterFadeOut = () => {
      letterOverlay.classList.add('opening');
      letterCloseTimeoutId = setTimeout(finishLetterOverlay, LETTER_FADE_MS);
    };

    const scheduleLetterTransition = () => {
      clearLetterTimers();
      letterFadeTimeoutId = setTimeout(startLetterFadeOut, LETTER_HOLD_MS);
    };

    const openLetter = () => {
      if (
        letterOverlay.classList.contains('is-playing') ||
        letterOverlay.classList.contains('opening') ||
        letterOverlay.classList.contains('closed')
      ) {
        return;
      }

      scrollToTop();
      letterOverlay.classList.add('seal-break', 'is-playing');
      if (letterOpenBtn) letterOpenBtn.disabled = true;
      invitationMain.classList.add('visible', 'opened');
      startInvitationMusic();
      scheduleLetterTransition();
    };

    // Clic en cualquier parte del overlay (el botón burbujea y también abre)
    letterOverlay.addEventListener('click', openLetter);
  }

  // Smooth scroll for anchor links + highlight de contacto
  let contactHighlightTimer = 0;

  function isMotionReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function scrollToElement(target, { block = 'start', offset = 0 } = {}) {
    const reduceMotion = isMotionReduced();
    const rect = target.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    let top = absoluteTop;

    if (block === 'end') {
      top = absoluteTop + rect.height - window.innerHeight;
    } else if (block === 'center') {
      top = absoluteTop + rect.height / 2 - window.innerHeight / 2;
    } else {
      top = absoluteTop - offset;
    }

    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }

  function highlightFooterContactPhones() {
    const phones = document.querySelectorAll('#contacto .footer-contact__phone');
    if (!phones.length) return;

    phones.forEach((phone) => {
      phone.classList.remove('is-attention');
      void phone.offsetWidth;
      phone.classList.add('is-attention');
    });

    window.clearTimeout(contactHighlightTimer);
    contactHighlightTimer = window.setTimeout(() => {
      phones.forEach((phone) => phone.classList.remove('is-attention'));
    }, 1600);
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();

      const reduceMotion = isMotionReduced();

      if (href === '#contacto') {
        scrollToElement(target, { block: 'end' });
        window.clearTimeout(contactHighlightTimer);
        contactHighlightTimer = window.setTimeout(
          highlightFooterContactPhones,
          reduceMotion ? 80 : 700
        );
        return;
      }

      const scrollOffset = href === '#historia' ? 8 : 0;
      scrollToElement(target, { block: 'start', offset: scrollOffset });
    });
  });

  // Botón "Ver invitación": se oculta al llegar a la sección de historia
  const historiaSection = document.getElementById('historia');

  if (heroCtaBtn && historiaSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          heroCtaBtn.classList.toggle('hidden', entry.isIntersecting);
        });
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -12% 0px'
      }
    );
    observer.observe(historiaSection);
  }

  // Nuestra historia: morph tipográfico italiano ↔ español (ritmo pausado)
  const STORY_HOLD_IT_MS = 3000;
  const STORY_HOLD_ES_MS = 22000;
  const STORY_MORPH_OUT_MS = 1500;
  const STORY_MORPH_IN_MS = 1750;
  const STORY_MORPH_OVERLAP_MS = 520;

  const clearStoryTranslateTimer = () => {
    if (storyTranslateTimeoutId) {
      clearTimeout(storyTranslateTimeoutId);
      storyTranslateTimeoutId = null;
    }
  };

  const waitStory = (ms) =>
    new Promise((resolve) => {
      clearStoryTranslateTimer();
      if (storyWaitResolve) {
        const prev = storyWaitResolve;
        storyWaitResolve = null;
        prev(false);
      }
      storyWaitResolve = resolve;
      storyTranslateTimeoutId = setTimeout(() => {
        storyTranslateTimeoutId = null;
        storyWaitResolve = null;
        resolve(true);
      }, ms);
    });

  const settleStoryLine = (el, active) => {
    el.getAnimations?.().forEach((anim) => anim.cancel());
    el.classList.toggle('is-active', active);
    el.classList.remove('is-animating', 'is-leaving');
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
    el.style.removeProperty('filter');
    el.style.removeProperty('letter-spacing');
    if (active) el.removeAttribute('aria-hidden');
    else el.setAttribute('aria-hidden', 'true');
  };

  const morphStoryQuote = async (toSpanish, token) => {
    if (!storyQuote || !storyQuoteIt || !storyQuoteEs || storyQuotePaused || token !== storyCycleToken) {
      return false;
    }

    const fromEl = toSpanish ? storyQuoteIt : storyQuoteEs;
    const toEl = toSpanish ? storyQuoteEs : storyQuoteIt;

    storyQuote.classList.add('is-morphing');
    fromEl.classList.add('is-animating', 'is-leaving');
    fromEl.classList.remove('is-active');
    toEl.classList.add('is-animating');
    toEl.classList.remove('is-active');
    fromEl.setAttribute('aria-hidden', 'true');

    const outAnim = fromEl.animate(
      [
        {
          opacity: 1,
          filter: 'blur(0px)',
          transform: 'translate3d(0, 0, 0) scale(1)',
          letterSpacing: '0.02em',
          offset: 0
        },
        {
          opacity: 0.35,
          filter: 'blur(2.5px)',
          transform: 'translate3d(0, -0.12em, 0) scale(1.01)',
          letterSpacing: '0.045em',
          offset: 0.45
        },
        {
          opacity: 0,
          filter: 'blur(7px)',
          transform: 'translate3d(0, -0.42em, 0) scale(1.025)',
          letterSpacing: '0.08em',
          offset: 1
        }
      ],
      {
        duration: STORY_MORPH_OUT_MS,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      }
    );

    const overlapped = await waitStory(STORY_MORPH_OVERLAP_MS);
    if (!overlapped || storyQuotePaused || token !== storyCycleToken) {
      outAnim.cancel();
      return false;
    }

    toEl.removeAttribute('aria-hidden');

    const inAnim = toEl.animate(
      [
        {
          opacity: 0,
          filter: 'blur(9px)',
          transform: 'translate3d(0, 0.55em, 0) scale(0.975)',
          letterSpacing: '-0.015em',
          offset: 0
        },
        {
          opacity: 0.55,
          filter: 'blur(3px)',
          transform: 'translate3d(0, 0.16em, 0) scale(0.992)',
          letterSpacing: '0.008em',
          offset: 0.55
        },
        {
          opacity: 1,
          filter: 'blur(0px)',
          transform: 'translate3d(0, 0, 0) scale(1)',
          letterSpacing: '0.02em',
          offset: 1
        }
      ],
      {
        duration: STORY_MORPH_IN_MS,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards'
      }
    );

    try {
      await Promise.all([outAnim.finished, inAnim.finished]);
    } catch {
      return false;
    }

    if (storyQuotePaused || token !== storyCycleToken) return false;

    settleStoryLine(fromEl, false);
    settleStoryLine(toEl, true);
    storyShowingSpanish = toSpanish;
    storyQuote.classList.remove('is-morphing');
    return true;
  };

  const continueStoryCycle = async (token) => {
    if (storyQuotePaused || !storyQuoteIt || !storyQuoteEs || token !== storyCycleToken) return;

    const holdMs = storyShowingSpanish ? STORY_HOLD_ES_MS : STORY_HOLD_IT_MS;
    const held = await waitStory(holdMs);
    if (!held || storyQuotePaused || token !== storyCycleToken) return;

    const morphed = await morphStoryQuote(!storyShowingSpanish, token);
    if (!morphed || storyQuotePaused || token !== storyCycleToken) return;

    continueStoryCycle(token);
  };

  const startStoryTranslate = () => {
    if (!storyQuoteIt || !storyQuoteEs) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (!storyTranslateStarted) {
        storyTranslateStarted = true;
        settleStoryLine(storyQuoteIt, false);
        settleStoryLine(storyQuoteEs, true);
        storyShowingSpanish = true;
      }
      return;
    }

    if (storyQuotePaused) {
      storyQuotePaused = false;
      storyTranslateStarted = true;
      storyCycleToken += 1;
      continueStoryCycle(storyCycleToken);
    }
  };

  const pauseStoryTranslate = () => {
    storyQuotePaused = true;
    storyCycleToken += 1;
    clearStoryTranslateTimer();
    if (storyWaitResolve) {
      const resolve = storyWaitResolve;
      storyWaitResolve = null;
      resolve(false);
    }
    if (storyQuote) storyQuote.classList.remove('is-morphing');
    if (storyQuoteIt && storyQuoteEs) {
      [storyQuoteIt, storyQuoteEs].forEach((el) => {
        el.getAnimations?.().forEach((anim) => anim.cancel());
        el.classList.remove('is-animating', 'is-leaving');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
        el.style.removeProperty('filter');
        el.style.removeProperty('letter-spacing');
      });
      settleStoryLine(storyQuoteIt, !storyShowingSpanish);
      settleStoryLine(storyQuoteEs, storyShowingSpanish);
    }
  };

  if (storySection) {
    const storyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          storySection.classList.toggle('in-view', entry.isIntersecting);
          if (entry.isIntersecting) startStoryTranslate();
          else pauseStoryTranslate();
        });
      },
      { threshold: 0.35 }
    );
    storyObserver.observe(storySection);
  }

  // Reveal on scroll (staggered)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealSelectors = [
    '.countdown-strip__title',
    '#countdown',
    '.venues__intro',
    '.venue-block',
    '.rsvp .section-title',
    '.rsvp .rsvp-intro',
    '.rsvp-form-reveal__btn'
  ];

  const revealTargets = Array.from(document.querySelectorAll(revealSelectors.join(', ')));
  revealTargets.forEach((el, index) => {
    el.classList.add('reveal-on-scroll');
    el.style.setProperty('--reveal-delay', `${Math.min(index * 35, 240)}ms`);
  });

  if (prefersReducedMotion) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else if (revealTargets.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  // Formulario RSVP
  const RSVP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwRg1DHzGZ2NBOlvuvxGSxkPlwzGXQczgV_wjwo_iKHqZQeKgtdtAcq8-wfoBttZDdwCA/exec';

  const RSVP_MAX_GUESTS = 10;
  const RSVP_GUEST_PLACEHOLDERS = ['Ej. José Ángel García', 'Ej. María Dolores López'];
  function normalizeNamePart(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function buildContactFullName(nombre, apellidos) {
    return [normalizeNamePart(nombre), normalizeNamePart(apellidos)].filter(Boolean).join(' ');
  }

  const rsvpForm = document.getElementById('rsvpForm');
  const rsvpNombre = document.getElementById('rsvpNombre');
  const rsvpAttendingBlock = document.getElementById('rsvpAttendingBlock');
  const rsvpDeclineBlock = document.getElementById('rsvpDeclineBlock');
  const rsvpGuestListPanel = document.getElementById('rsvpGuestListPanel');
  const rsvpGuestList = document.getElementById('rsvpGuestList');
  const rsvpAddGuest = document.getElementById('rsvpAddGuest');
  const rsvpAlergiaNinguna = document.getElementById('rsvpAlergiaNinguna');
  const rsvpAlergia = document.getElementById('rsvpAlergia');
  const rsvpAllergyValid = document.getElementById('rsvpAllergyValid');
  const rsvpStayNote = document.getElementById('rsvpStayNote');

  const ALLERGY_LABELS = {
    ninguna: 'Ninguna',
    gluten: 'Celiaquía',
    lactosa: 'Lactosa',
    frutos_secos: 'Frutos secos',
    marisco: 'Marisco',
    huevo: 'Huevo',
    pescado: 'Pescado',
    otra: 'Otra'
  };
  const rsvpMensaje = document.getElementById('rsvpMensaje');
  const rsvpMensajeCount = document.getElementById('rsvpMensajeCount');
  const rsvpFormMessage = document.getElementById('rsvpFormMessage');
  const rsvpSubmitBtn = document.getElementById('rsvpSubmitBtn');
  const rsvpSubmitLabel = rsvpSubmitBtn?.querySelector('.btn-submit__label');
  const rsvpFormRevealBtn = document.getElementById('rsvpFormRevealBtn');
  const rsvpFormPanel = document.getElementById('rsvpFormPanel');
  let lastAttendanceChoice = '';

  function openRsvpFormPanel() {
    if (!rsvpFormPanel || !rsvpFormPanel.hidden) return;
    if (rsvpFormRevealBtn) rsvpFormRevealBtn.hidden = true;
    rsvpFormPanel.hidden = false;
    rsvpFormPanel.classList.add('is-open');
    rsvpFormPanel.querySelector('.rsvp-form')?.classList.add('is-visible');
    refreshFormIcons();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rsvpFormPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    window.setTimeout(() => {
      document.getElementById('rsvpNombre')?.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 360);
  }

  if (rsvpFormRevealBtn && rsvpFormPanel) {
    rsvpFormRevealBtn.addEventListener('click', openRsvpFormPanel);
  }

  function refreshFormIcons() {
    /* Phosphor Icons: CSS-based, no JS refresh needed */
  }

  function scrollToRsvpBlock(blockId) {
    const block = document.getElementById(blockId);
    if (!block || block.hidden) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    block.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  function setRsvpMessage(text, type) {
    if (!rsvpFormMessage) return;
    rsvpFormMessage.textContent = text;
    rsvpFormMessage.hidden = !text;
    rsvpFormMessage.classList.remove('is-success', 'is-error');
    if (type) rsvpFormMessage.classList.add(type);
  }

  /** Envío compatible con Google Apps Script (text/plain evita CORS; form como respaldo). */
  async function submitRsvpPayload(payload) {
    const json = JSON.stringify(payload);

    try {
      const response = await fetch(RSVP_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: json
      });

      const text = await response.text();
      let result = { ok: response.ok };
      try {
        result = JSON.parse(text);
      } catch {
        if (!response.ok) {
          throw new Error('El servidor no respondió correctamente. Revisa Apps Script.');
        }
      }

      if (!result.ok) {
        throw new Error(result.error || 'No se pudo guardar la confirmación.');
      }
      return;
    } catch (primaryError) {
      console.warn('RSVP fetch (text/plain):', primaryError);
    }

    const formBody = new URLSearchParams();
    formBody.set('payload', json);

    const fallback = await fetch(RSVP_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: formBody.toString()
    });

    if (!fallback.type || fallback.type === 'opaque') {
      return;
    }

    throw new Error('No se pudo enviar la confirmación.');
  }

  function getAttendanceValue() {
    return rsvpForm?.querySelector('input[name="asistencia"]:checked')?.value || '';
  }

  function getPartyType() {
    return rsvpForm?.querySelector('input[name="tipo_grupo"]:checked')?.value || 'solo';
  }

  function getStayNeedValue() {
    return rsvpForm?.querySelector('input[name="alojamiento"]:checked')?.value || '';
  }

  function updateStayNoteState() {
    const showNote = getAttendanceValue() === 'si' && getStayNeedValue() === 'si';
    if (rsvpStayNote) rsvpStayNote.hidden = !showNote;
  }

  function resetStayFields() {
    rsvpForm?.querySelectorAll('input[name="alojamiento"]').forEach((radio) => {
      radio.checked = false;
    });
    updateStayNoteState();
  }

  function getGuestRows() {
    return Array.from(rsvpGuestList?.querySelectorAll('.guest-row') || []);
  }

  const GUEST_TYPE_OPTIONS = [
    { value: 'adulto', label: 'Adulto' },
    { value: 'nino', label: 'Niño' }
  ];

  function getGuestTypeValue(row) {
    return row?.querySelector('.guest-type-select')?.dataset.value || 'adulto';
  }

  function closeAllGuestTypeSelects(except) {
    document.querySelectorAll('.guest-type-select.is-open').forEach((select) => {
      if (except && select === except) return;
      select.classList.remove('is-open', 'is-drop-up');
      const trigger = select.querySelector('.guest-type-select__trigger');
      const menu = select.querySelector('.guest-type-select__menu');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (menu) menu.hidden = true;
    });
  }

  function setGuestTypeValue(select, value) {
    if (!select) return;
    const option = GUEST_TYPE_OPTIONS.find((item) => item.value === value) || GUEST_TYPE_OPTIONS[0];
    select.dataset.value = option.value;
    const label = select.querySelector('.guest-type-select__value');
    if (label) label.textContent = option.label;
    select.querySelectorAll('.guest-type-select__option').forEach((btn) => {
      const selected = btn.dataset.value === option.value;
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  }

  function initGuestTypeSelect(select) {
    if (!select || select.dataset.ready === 'true') return;
    select.dataset.ready = 'true';

    const trigger = select.querySelector('.guest-type-select__trigger');
    const menu = select.querySelector('.guest-type-select__menu');
    const options = Array.from(select.querySelectorAll('.guest-type-select__option'));
    if (!trigger || !menu) return;

    const openMenu = () => {
      if (trigger.disabled) return;
      closeAllGuestTypeSelects(select);
      select.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      menu.hidden = false;

      const triggerRect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const preferUp = spaceBelow < 140 && triggerRect.top > spaceBelow;
      select.classList.toggle('is-drop-up', preferUp);

      const selected = options.find((btn) => btn.getAttribute('aria-selected') === 'true') || options[0];
      selected?.focus();
    };

    const closeMenu = ({ focusTrigger = false } = {}) => {
      select.classList.remove('is-open', 'is-drop-up');
      trigger.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      if (focusTrigger) trigger.focus();
    };

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      if (select.classList.contains('is-open')) closeMenu();
      else openMenu();
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu();
      }
    });

    options.forEach((btn, index) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        setGuestTypeValue(select, btn.dataset.value || 'adulto');
        closeMenu({ focusTrigger: true });
      });

      btn.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          options[(index + 1) % options.length]?.focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          options[(index - 1 + options.length) % options.length]?.focus();
        } else if (event.key === 'Home') {
          event.preventDefault();
          options[0]?.focus();
        } else if (event.key === 'End') {
          event.preventDefault();
          options[options.length - 1]?.focus();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          closeMenu({ focusTrigger: true });
        } else if (event.key === 'Tab') {
          closeMenu();
        }
      });
    });
  }

  if (!window.__guestTypeSelectListenersBound) {
    window.__guestTypeSelectListenersBound = true;
    document.addEventListener('click', (event) => {
      if (event.target.closest('.guest-type-select')) return;
      closeAllGuestTypeSelects();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAllGuestTypeSelects();
    });
  }

  function collectExtraGuests() {
    const guests = getGuestRows().map((row) => {
      const name = normalizeNamePart(row.querySelector('.guest-row__name')?.value || '');
      const type = getGuestTypeValue(row);
      return { name, type };
    }).filter((g) => g.name);

    const adults = guests.filter((g) => g.type === 'adulto').length;
    const children = guests.filter((g) => g.type === 'nino').length;
    return { guests, adults, children, total: 1 + guests.length };
  }

  function formatGuestListForSheet(guests) {
    return guests
      .map((g) => `${g.name} (${g.type === 'nino' ? 'niño' : 'adulto'})`)
      .join('; ');
  }

  function updateAddGuestButton() {
    if (!rsvpAddGuest) return;
    const count = getGuestRows().length;
    const atMax = count >= RSVP_MAX_GUESTS;
    rsvpAddGuest.disabled = atMax;
    rsvpAddGuest.classList.toggle('btn-add-guest--disabled', atMax);

    const icon = rsvpAddGuest.querySelector('.btn-add-guest__icon');
    const label = rsvpAddGuest.querySelector('.btn-add-guest__label');
    if (label) {
      label.textContent = atMax
        ? `Máximo ${RSVP_MAX_GUESTS} acompañantes`
        : 'Añadir persona';
    }
    if (icon) icon.hidden = atMax;
  }

  function createGuestRow() {
    if (!rsvpGuestList) return null;
    const index = getGuestRows().length;
    const nameId = `rsvpGuestName${index}`;
    const typeId = `rsvpGuestType${index}`;
    const listboxId = `${typeId}List`;
    const row = document.createElement('tr');
    row.className = 'guest-row';
    row.innerHTML = `
      <td class="guest-table__cell guest-table__cell--name">
        <label class="visually-hidden" for="${nameId}">Nombre, acompañante ${index + 1}</label>
        <input
          type="text"
          class="guest-row__name"
          id="${nameId}"
          required
          autocomplete="name"
          placeholder="${RSVP_GUEST_PLACEHOLDERS[index % RSVP_GUEST_PLACEHOLDERS.length]}"
        >
      </td>
      <td class="guest-table__cell guest-table__cell--type">
        <span class="visually-hidden" id="${typeId}Label">Adulto o niño, acompañante ${index + 1}</span>
        <div class="guest-type-select" data-value="adulto">
          <button
            type="button"
            class="guest-type-select__trigger guest-row__type"
            id="${typeId}"
            aria-haspopup="listbox"
            aria-expanded="false"
            aria-labelledby="${typeId}Label ${typeId}"
            aria-controls="${listboxId}"
          >
            <span class="guest-type-select__value">Adulto</span>
            <svg class="guest-type-select__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>
          <ul class="guest-type-select__menu" id="${listboxId}" role="listbox" aria-labelledby="${typeId}Label" hidden>
            <li role="presentation">
              <button type="button" class="guest-type-select__option" role="option" data-value="adulto" aria-selected="true">Adulto</button>
            </li>
            <li role="presentation">
              <button type="button" class="guest-type-select__option" role="option" data-value="nino" aria-selected="false">Niño</button>
            </li>
          </ul>
        </div>
      </td>
      <td class="guest-table__cell guest-table__cell--action">
        <button type="button" class="guest-row__remove">Quitar</button>
      </td>
    `;

    const nameInput = row.querySelector('.guest-row__name');
    const typeSelect = row.querySelector('.guest-type-select');
    const removeBtn = row.querySelector('.guest-row__remove');
    if (removeBtn) {
      removeBtn.setAttribute('aria-label', `Quitar acompañante ${index + 1}`);
    }

    initGuestTypeSelect(typeSelect);

    nameInput?.addEventListener('input', () => {
      nameInput.setCustomValidity('');
    });
    removeBtn?.addEventListener('click', () => {
      closeAllGuestTypeSelects();
      if (getGuestRows().length <= 1) {
        const soloRadio = rsvpForm?.querySelector('input[name="tipo_grupo"][value="solo"]');
        if (soloRadio) soloRadio.checked = true;
        updatePartyPanelState();
        return;
      }
      row.remove();
      updateAddGuestButton();
      updatePartyPanelState();
    });

    rsvpGuestList.appendChild(row);
    updateAddGuestButton();
    refreshFormIcons();
    nameInput?.focus();
    return row;
  }

  function clearGuestList() {
    closeAllGuestTypeSelects();
    if (rsvpGuestList) rsvpGuestList.innerHTML = '';
    updateAddGuestButton();
  }

  function updatePartyPanelState() {
    const isAttending = getAttendanceValue() === 'si';
    const withGuests = getPartyType() === 'acompanado';

    if (rsvpGuestListPanel) rsvpGuestListPanel.hidden = !isAttending || !withGuests;

    if (isAttending && withGuests && getGuestRows().length === 0) {
      createGuestRow();
    }

    if (!withGuests) clearGuestList();

    getGuestRows().forEach((row) => {
      const nameInput = row.querySelector('.guest-row__name');
      const typeTrigger = row.querySelector('.guest-type-select__trigger');
      const removeBtn = row.querySelector('.guest-row__remove');
      const disabled = !isAttending || !withGuests;
      if (nameInput) {
        nameInput.disabled = disabled;
        nameInput.required = !disabled;
      }
      if (typeTrigger) typeTrigger.disabled = disabled;
      if (disabled) closeAllGuestTypeSelects();
      if (removeBtn) removeBtn.disabled = disabled;
    });

    if (rsvpAddGuest) rsvpAddGuest.disabled = !isAttending || !withGuests || getGuestRows().length >= RSVP_MAX_GUESTS;
  }

  function validateGuestList() {
    if (getAttendanceValue() !== 'si' || getPartyType() !== 'acompanado') return true;

    const rows = getGuestRows();
    if (!rows.length) {
      setRsvpMessage('Añade al menos una persona que venga contigo.', 'is-error');
      rsvpAddGuest?.focus();
      return false;
    }

    let isValid = true;
    rows.forEach((row) => {
      const input = row.querySelector('.guest-row__name');
      if (!input) return;
      if (!input.value.trim()) {
        input.setCustomValidity('Escribe el nombre de esta persona.');
        isValid = false;
      } else {
        input.setCustomValidity('');
      }
    });
    return isValid;
  }

  function getAllergyCheckboxes() {
    return Array.from(rsvpForm?.querySelectorAll('input[name="alergia_opcion"]') || []);
  }

  function collectAllergyData() {
    const checked = getAllergyCheckboxes().filter((cb) => cb.checked);
    const hasNinguna = checked.some((cb) => cb.value === 'ninguna');
    const otherText = rsvpAlergia?.value.trim() || '';
    const hasOtra = Boolean(otherText);
    const selected = checked.map((cb) => ALLERGY_LABELS[cb.value] || cb.value);
    if (hasOtra) selected.push(`${ALLERGY_LABELS.otra}: ${otherText}`);

    const formatted = hasNinguna ? ALLERGY_LABELS.ninguna : selected.join(', ');

    return { hasNinguna, hasOtra, otherText, selected, formatted };
  }

  function resetAllergyFields() {
    getAllergyCheckboxes().forEach((cb) => {
      cb.checked = false;
    });
    if (rsvpAlergia) {
      rsvpAlergia.value = '';
      rsvpAlergia.disabled = false;
    }
    if (rsvpAllergyValid) rsvpAllergyValid.setCustomValidity('');
  }

  function updateAllergyState(changedInput) {
    const checkboxes = getAllergyCheckboxes();
    const ninguna = rsvpAlergiaNinguna;
    const otherText = rsvpAlergia?.value.trim() || '';

    if (changedInput?.value === 'ninguna' && changedInput.checked) {
      checkboxes.forEach((cb) => {
        if (cb !== ninguna) cb.checked = false;
      });
      if (rsvpAlergia) rsvpAlergia.value = '';
    } else if (changedInput?.checked && changedInput.value !== 'ninguna') {
      if (ninguna) ninguna.checked = false;
    }

    if (otherText && ninguna?.checked) {
      ninguna.checked = false;
    }

    validateAllergyField();
  }

  function validateAllergyField() {
    const anchor = rsvpAllergyValid;
    if (!anchor) return true;

    const isAttending = getAttendanceValue() === 'si';
    if (!isAttending) {
      anchor.setCustomValidity('');
      if (rsvpAlergia) rsvpAlergia.setCustomValidity('');
      return true;
    }

    const { hasNinguna, formatted } = collectAllergyData();
    let message = '';

    if (!hasNinguna && !formatted) {
      message = 'Marca al menos una opción de alergias o intolerancias.';
    }

    if (rsvpAlergia) rsvpAlergia.setCustomValidity('');

    anchor.setCustomValidity(message);
    return !message;
  }

  function updateRsvpFormState() {
    const attendance = getAttendanceValue();
    const isAttending = attendance === 'si';
    const isDeclining = attendance === 'no';

    if (rsvpAttendingBlock) rsvpAttendingBlock.hidden = !isAttending;
    if (rsvpDeclineBlock) rsvpDeclineBlock.hidden = !isDeclining;

    const attendingFields = rsvpAttendingBlock?.querySelectorAll('input, textarea, select, button') || [];
    attendingFields.forEach((field) => {
      if (field === rsvpAddGuest) return;
      if (field.closest('.guest-row')) return;
      field.disabled = !isAttending;
    });

    if (!isAttending) {
      const soloRadio = rsvpForm?.querySelector('input[name="tipo_grupo"][value="solo"]');
      if (soloRadio) soloRadio.checked = true;
      clearGuestList();
      resetAllergyFields();
      resetStayFields();
      const cancion = rsvpForm?.querySelector('#rsvpCancion');
      if (cancion) cancion.value = '';
    }

    updatePartyPanelState();
    updateStayNoteState();
    updateAllergyState();

    if (attendance && attendance !== lastAttendanceChoice) {
      lastAttendanceChoice = attendance;
      if (isAttending) scrollToRsvpBlock('rsvpAttendingBlock');
      else scrollToRsvpBlock('rsvpBlockFinish');
    }

    refreshFormIcons();
  }

  if (rsvpForm) {
    rsvpForm.querySelectorAll('input[name="asistencia"]').forEach((radio) => {
      radio.addEventListener('change', updateRsvpFormState);
    });

    rsvpForm.querySelectorAll('input[name="tipo_grupo"]').forEach((radio) => {
      radio.addEventListener('change', updatePartyPanelState);
    });

    rsvpForm.querySelectorAll('input[name="alojamiento"]').forEach((radio) => {
      radio.addEventListener('change', updateStayNoteState);
    });

    if (rsvpAddGuest) {
      rsvpAddGuest.addEventListener('click', () => createGuestRow());
    }

    getAllergyCheckboxes().forEach((checkbox) => {
      checkbox.addEventListener('change', () => updateAllergyState(checkbox));
    });

    if (rsvpAlergia) {
      rsvpAlergia.addEventListener('input', () => updateAllergyState());
    }

    if (rsvpMensaje && rsvpMensajeCount) {
      const updateCount = () => {
        rsvpMensajeCount.textContent = String(rsvpMensaje.value.length);
      };
      rsvpMensaje.addEventListener('input', updateCount);
      updateCount();
    }

    updateRsvpFormState();
    refreshFormIcons();

    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setRsvpMessage('');

      updatePartyPanelState();
      const guestsValid = validateGuestList();
      const allergyValid = validateAllergyField();
      if (!guestsValid || !allergyValid || !rsvpForm.reportValidity()) {
        const invalid = rsvpForm.querySelector(':invalid');
        if (invalid === rsvpAllergyValid) {
          const firstAllergyOption = getAllergyCheckboxes()[0];
          (firstAllergyOption || rsvpAlergia)?.focus({ preventScroll: false });
        } else {
          invalid?.focus({ preventScroll: false });
        }
        return;
      }

      const formData = new FormData(rsvpForm);
      const asistencia = String(formData.get('asistencia') || '');
      const isAttending = asistencia === 'si';
      const partyType = getPartyType();
      const { guests, adults, children, total } = isAttending && partyType === 'acompanado'
        ? collectExtraGuests()
        : { guests: [], adults: 0, children: 0, total: 1 };
      const allergy = collectAllergyData();
      const guestListText = formatGuestListForSheet(guests);

      const payload = {
        nombre: buildContactFullName(formData.get('nombre'), formData.get('apellidos')),
        email: String(formData.get('email') || '').trim(),
        asistencia,
        asistencia_label: isAttending ? 'Asistirá' : 'No asistirá',
        tipo_grupo: isAttending ? (partyType === 'acompanado' ? 'Con acompañantes' : 'Solo/a') : '',
        acompanantes: isAttending ? String(adults) : '0',
        ninos: isAttending ? String(children) : '0',
        total_invitados: isAttending ? String(total) : '0',
        nombres_acompanantes: isAttending ? guestListText : '',
        sin_alergias: isAttending && allergy.hasNinguna ? 'Sí' : 'No',
        alergias_seleccionadas: isAttending ? allergy.formatted : '',
        alojamiento: isAttending ? (getStayNeedValue() === 'si' ? 'Sí' : 'No') : '',
        cancion: isAttending ? String(formData.get('cancion') || '').trim() : '',
        mensaje: String(formData.get('mensaje') || '').trim(),
        fecha_envio: new Date().toISOString()
      };

      if (!RSVP_SCRIPT_URL) {
        console.info('RSVP payload (demo):', payload);
        const firstName = payload.nombre.split(/\s+/)[0] || '';
        setRsvpMessage(
          firstName
            ? `¡Gracias, ${firstName}! Tu respuesta está lista. Configura RSVP_SCRIPT_URL en script.js para guardarla.`
            : 'Tu respuesta está lista. Configura RSVP_SCRIPT_URL en script.js para guardarla.',
          'is-success'
        );
        rsvpForm.classList.add('is-submitted');
        return;
      }

      if (rsvpSubmitBtn) rsvpSubmitBtn.disabled = true;
      if (rsvpSubmitLabel) rsvpSubmitLabel.textContent = 'Enviando…';

      try {
        await submitRsvpPayload(payload);
        const firstName = payload.nombre.split(/\s+/)[0] || '';
        setRsvpMessage(
          firstName
            ? `¡Gracias ${firstName} por ayudarnos a organizarnos!`
            : '¡Gracias por ayudarnos a organizarnos!',
          'is-success'
        );
        rsvpForm.classList.add('is-submitted');
        rsvpForm.reset();
        updateRsvpFormState();
        if (rsvpMensajeCount) rsvpMensajeCount.textContent = '0';
      } catch (err) {
        console.error('RSVP submit error:', err);
        setRsvpMessage(
          err?.message || 'No se pudo enviar. Comprueba tu conexión e inténtalo de nuevo.',
          'is-error'
        );
      } finally {
        if (rsvpSubmitBtn) rsvpSubmitBtn.disabled = false;
        if (rsvpSubmitLabel) rsvpSubmitLabel.textContent = 'Enviar confirmación';
      }
    });
  }
});
