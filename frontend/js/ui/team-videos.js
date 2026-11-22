const hoverQuery = '(hover: hover) and (pointer: fine)';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const RESET_DELAY = 400; // um pouco mais que a transição de opacidade do CSS

function createVideo(card) {
    const video = document.createElement('video');
    video.className = 'team-video';
    video.muted = true;
    video.defaultMuted = true; // sem som: obrigatório para o navegador permitir play() automático
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.tabIndex = -1;
    video.setAttribute('aria-hidden', 'true');
    if (card.dataset.teamPoster) video.poster = card.dataset.teamPoster;
    video.src = card.dataset.teamVideo;

    video.addEventListener('error', () => {
        video.remove();
        card.classList.remove('is-playing');
        card.dataset.teamVideoFailed = 'true';
    });

    card.prepend(video);
    return video;
}

function bindCard(card) {
    let video = null;
    let resetTimer = null;

    const start = () => {
        if (card.dataset.teamVideoFailed || !window.matchMedia(hoverQuery).matches) return;
        clearTimeout(resetTimer);
        video ??= createVideo(card);
        card.classList.add('is-playing');
        video.play().catch(() => { /* bloqueado ou ainda carregando: a logo continua visível */ });
    };

    const stop = () => {
        card.classList.remove('is-playing');
        if (!video) return;
        video.pause();
        clearTimeout(resetTimer);
        // Volta ao início só depois do fade-out, para o vídeo não "pular" na saída.
        resetTimer = setTimeout(() => {
            if (video && !card.classList.contains('is-playing')) video.currentTime = 0;
        }, RESET_DELAY);
    };

    card.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') start(); });
    card.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') stop(); });
    // Teclado: Tab até o card também mostra o vídeo.
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) start(); });
    card.addEventListener('blur', stop);
}

export function initTeamVideoHover() {
    if (window.matchMedia(reducedMotionQuery).matches) return;
    document.querySelectorAll('[data-team-video]').forEach(bindCard);
}