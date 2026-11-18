// Carrossel horizontal com setas (padrão das vitrines da Autofãs).
// Usa a rolagem nativa com scroll-snap: funciona com toque, trackpad e teclado.
const chevron = (direction) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;

export function initProductCarousel(track, controls) {
    if (!track || !controls) return () => {};

    controls.innerHTML = `
        <button type="button" class="carousel-arrow" data-direction="-1" aria-label="Produtos anteriores">${chevron(-1)}</button>
        <button type="button" class="carousel-arrow" data-direction="1" aria-label="Próximos produtos">${chevron(1)}</button>`;
    const [previous, next] = controls.querySelectorAll('.carousel-arrow');

    function updateArrows() {
        const maxScroll = track.scrollWidth - track.clientWidth - 2;
        previous.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= maxScroll;
        controls.hidden = maxScroll <= 0;
    }

    controls.addEventListener('click', (event) => {
        const button = event.target.closest('.carousel-arrow');
        if (!button) return;
        track.scrollBy({ left: Number(button.dataset.direction) * track.clientWidth * .9, behavior: 'smooth' });
    });
    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    requestAnimationFrame(updateArrows);

    // Chamado quando o conteúdo do carrossel muda (ex.: troca de aba).
    return () => {
        track.scrollLeft = 0;
        requestAnimationFrame(updateArrows);
    };
}
