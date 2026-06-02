if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

document.addEventListener('DOMContentLoaded', () => {
  // Countdown to wedding (15 Aug 2026, 19:30)
  const countdownRoot = document.getElementById('countdownStrip');
  const countdownEl = document.getElementById('countdown');
  const countdownFallback = document.getElementById('countdownFallback');
  if (countdownRoot && countdownEl) {
    const weddingDate = new Date(countdownRoot.dataset.wedding || '2026-08-15T19:30:00');
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

  // Hero video: loop only first 9 seconds
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    const loopEnd = parseFloat(heroVideo.dataset.loopEnd || '9');
    heroVideo.addEventListener('timeupdate', () => {
      if (heroVideo.currentTime >= loopEnd) {
        heroVideo.currentTime = 0;
        heroVideo.play();
      }
    });
  }

  // Música de fondo (solo tras abrir el sobre) + botón flotante silenciar/activar
  const invitationMusic = document.getElementById('invitationMusic');
  const soundToggle = document.getElementById('soundToggle');
  const INVITATION_MUSIC_FILE = 'Ed Sheeran, Perfect Symphony ft. Andrea Bocelli (lyrics & translate).mp3';
  let invitationMusicStarted = false;
  let invitationMusicMuted = false;

  if (invitationMusic) {
    invitationMusic.src = `assets/${encodeURIComponent(INVITATION_MUSIC_FILE)}`;
  }

  function renderSoundToggleIcon() {
    if (!soundToggle || typeof lucide === 'undefined' || !lucide.createIcons) return;

    const iconName = invitationMusicMuted ? 'volume-x' : 'volume-2';
    soundToggle.innerHTML = '';

    const iconEl = document.createElement('i');
    iconEl.className = 'sound-toggle__icon';
    iconEl.id = 'soundToggleIcon';
    iconEl.setAttribute('data-lucide', iconName);
    iconEl.setAttribute('aria-hidden', 'true');
    soundToggle.appendChild(iconEl);

    lucide.createIcons({
      root: soundToggle,
      attrs: {
        'stroke-width': 1.75,
        width: 22,
        height: 22,
      },
    });
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
    invitationMusic.play().catch(() => {
      invitationMusicStarted = false;
    });
  }

  function resumeInvitationMusicIfAllowed() {
    if (!invitationMusic || invitationMusicMuted) return;
    invitationMusicStarted = true;
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

  // Letter overlay: video del sobre (pausado) → al clic reproduce y abre la invitación
  const letterOverlay = document.getElementById('letterOverlay');
  const letterEnvelopeVideo = document.getElementById('letterEnvelopeVideo');
  const letterVideoWrap = document.getElementById('letterVideoWrap');
  const invitationMain = document.getElementById('invitationMain');
  const heroCtaBtn = document.querySelector('.hero-cta-btn');
  const storySection = document.querySelector('.story');
  const storyTextTyped = document.getElementById('storyTextTyped');
  let storyTypingStarted = false;
  let storyTypingTimeoutId = null;
  let letterFadeTimeoutId = null;
  let letterCloseTimeoutId = null;

  const clearLetterTimers = () => {
    if (letterFadeTimeoutId) {
      clearTimeout(letterFadeTimeoutId);
      letterFadeTimeoutId = null;
    }
    if (letterCloseTimeoutId) {
      clearTimeout(letterCloseTimeoutId);
      letterCloseTimeoutId = null;
    }
  };

  function scrollToTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function resetInvitationToStart() {
    scrollToTop();

    if (letterOverlay) {
      letterOverlay.classList.remove('seal-break', 'opening', 'closed', 'is-playing');
      letterOverlay.removeAttribute('aria-hidden');
      letterOverlay.setAttribute('tabindex', '0');
    }

    if (letterVideoWrap) {
      letterVideoWrap.classList.remove('is-video-error');
    }

    clearLetterTimers();

    if (letterEnvelopeVideo) {
      letterEnvelopeVideo.pause();
      try {
        letterEnvelopeVideo.currentTime = 0;
      } catch {
        /* ignore */
      }
    }

    if (invitationMain) {
      invitationMain.classList.remove('visible', 'opened');
    }

    if (invitationMusic) {
      invitationMusic.pause();
      invitationMusic.currentTime = 0;
    }
    invitationMusicStarted = false;

    if (heroCtaBtn) heroCtaBtn.classList.remove('hidden');

    storyTypingStarted = false;
    if (storyTypingTimeoutId) {
      clearTimeout(storyTypingTimeoutId);
      storyTypingTimeoutId = null;
    }
    if (storyTextTyped) {
      storyTextTyped.textContent = '';
      storyTextTyped.classList.remove('is-typing');
    }
    if (storySection) storySection.classList.remove('in-view');

    document.querySelectorAll('.reveal-on-scroll.is-visible').forEach((el) => {
      el.classList.remove('is-visible');
    });
  }

  resetInvitationToStart();
  window.addEventListener('pageshow', resetInvitationToStart);
  window.addEventListener('load', scrollToTop);

  if (letterOverlay && invitationMain) {
    const LETTER_VIDEO_HOLD_MS = 1000;
    const LETTER_FADE_MS = 550;

    const startLetterFadeOut = () => {
      letterOverlay.classList.add('opening');
      letterCloseTimeoutId = setTimeout(() => {
        letterOverlay.classList.add('closed');
        letterOverlay.setAttribute('aria-hidden', 'true');
        letterOverlay.setAttribute('tabindex', '-1');
        letterCloseTimeoutId = null;
        if (letterEnvelopeVideo && !letterEnvelopeVideo.paused) {
          letterEnvelopeVideo.pause();
        }
      }, LETTER_FADE_MS);
    };

    const scheduleLetterTransition = () => {
      clearLetterTimers();
      letterFadeTimeoutId = setTimeout(startLetterFadeOut, LETTER_VIDEO_HOLD_MS);
    };

    const openLetter = () => {
      if (
        letterOverlay.classList.contains('is-playing') ||
        letterOverlay.classList.contains('opening') ||
        letterOverlay.classList.contains('closed')
      ) {
        return;
      }

      letterOverlay.classList.add('seal-break', 'is-playing');
      invitationMain.classList.add('visible');
      invitationMain.classList.add('opened');
      startInvitationMusic();

      scheduleLetterTransition();

      if (!letterEnvelopeVideo) {
        return;
      }

      const playEnvelope = () => {
        letterEnvelopeVideo.play().catch(() => {
          /* si falla el vídeo, el fundido sigue programado tras 1 s */
        });
      };

      if (letterEnvelopeVideo.readyState >= 2) {
        playEnvelope();
      } else {
        letterEnvelopeVideo.addEventListener('canplay', playEnvelope, { once: true });
        letterEnvelopeVideo.load();
      }
    };

    if (letterEnvelopeVideo) {
      const markVideoError = () => {
        if (letterVideoWrap) letterVideoWrap.classList.add('is-video-error');
      };

      const showFirstFrame = () => {
        if (letterVideoWrap) letterVideoWrap.classList.remove('is-video-error');
        letterEnvelopeVideo.pause();
        try {
          if (letterEnvelopeVideo.currentTime > 0.05) {
            letterEnvelopeVideo.currentTime = 0;
          }
        } catch {
          /* ignore seek errors before metadata */
        }
      };

      letterEnvelopeVideo.addEventListener('loadeddata', showFirstFrame);
      letterEnvelopeVideo.addEventListener('loadedmetadata', showFirstFrame);
      letterEnvelopeVideo.addEventListener('error', markVideoError);

      if (letterEnvelopeVideo.readyState >= 1) showFirstFrame();
    }

    letterOverlay.addEventListener('click', openLetter);
    letterOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLetter();
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
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
      { threshold: 0.1 }
    );
    observer.observe(historiaSection);
  }

  // Nuestra historia: texto con efecto de escritura suave
  const runStoryTyping = () => {
    if (!storyTextTyped || storyTypingStarted) return;
    storyTypingStarted = true;

    const fullText = storyTextTyped.dataset.fullText || '';
    storyTextTyped.textContent = '';
    storyTextTyped.classList.add('is-typing');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      storyTextTyped.textContent = fullText;
      storyTextTyped.classList.remove('is-typing');
      return;
    }

    if (storyTypingTimeoutId) {
      clearTimeout(storyTypingTimeoutId);
      storyTypingTimeoutId = null;
    }

    let index = 0;

    const getCharDelay = (char, prevChar) => {
      if (char === ' ') return 34;
      if ('.…!?'.includes(char)) return 280;
      if (',;:'.includes(char)) return 160;
      if (prevChar === ' ' || prevChar === '.' || prevChar === ',') return 52;
      return 38 + Math.random() * 18;
    };

    const typeNextChar = () => {
      if (index >= fullText.length) {
        storyTextTyped.classList.remove('is-typing');
        storyTypingTimeoutId = null;
        return;
      }

      index += 1;
      storyTextTyped.textContent = fullText.slice(0, index);
      const char = fullText[index - 1];
      const prevChar = index > 1 ? fullText[index - 2] : '';
      storyTypingTimeoutId = setTimeout(typeNextChar, getCharDelay(char, prevChar));
    };

    storyTypingTimeoutId = setTimeout(typeNextChar, 420);
  };

  if (storySection) {
    const storyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          storySection.classList.toggle('in-view', entry.isIntersecting);
          if (entry.isIntersecting) runStoryTyping();
        });
      },
      { threshold: 0.35 }
    );
    storyObserver.observe(storySection);
  }

  // Reveal on scroll (staggered)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealSelectors = [
    '.story-section-heading',
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
  const RSVP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzh3tjesYe29qF3CvYVSkvH4jkVqjOv91v6kO8ZdxOGGjuV1PoxXBTw2ZaJHtf6r1bT2A/exec';

  const RSVP_MAX_GUESTS = 10;
  const RSVP_GUEST_PLACEHOLDERS = ['Ej. Javier Román Revaliente', 'Ej. Ani Murillo'];
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
    if (window.lucide?.createIcons) window.lucide.createIcons();
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

  function getGuestRows() {
    return Array.from(rsvpGuestList?.querySelectorAll('.guest-row') || []);
  }

  function collectExtraGuests() {
    const guests = getGuestRows().map((row) => {
      const name = normalizeNamePart(row.querySelector('.guest-row__name')?.value || '');
      const type = row.querySelector('.guest-row__type')?.value || 'adulto';
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
        <label class="visually-hidden" for="${typeId}">Adulto o niño, acompañante ${index + 1}</label>
        <select class="guest-row__type" id="${typeId}">
          <option value="adulto">Adulto</option>
          <option value="nino">Niño</option>
        </select>
      </td>
      <td class="guest-table__cell guest-table__cell--action">
        <button type="button" class="guest-row__remove">Quitar</button>
      </td>
    `;

    const nameInput = row.querySelector('.guest-row__name');
    const typeSelect = row.querySelector('.guest-row__type');
    const removeBtn = row.querySelector('.guest-row__remove');
    if (removeBtn) {
      removeBtn.setAttribute('aria-label', `Quitar acompañante ${index + 1}`);
    }

    nameInput?.addEventListener('input', () => {
      nameInput.setCustomValidity('');
    });
    removeBtn?.addEventListener('click', () => {
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
      const typeSelect = row.querySelector('.guest-row__type');
      const removeBtn = row.querySelector('.guest-row__remove');
      const disabled = !isAttending || !withGuests;
      if (nameInput) {
        nameInput.disabled = disabled;
        nameInput.required = !disabled;
      }
      if (typeSelect) typeSelect.disabled = disabled;
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
      const cancion = rsvpForm?.querySelector('#rsvpCancion');
      if (cancion) cancion.value = '';
    }

    updatePartyPanelState();
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
