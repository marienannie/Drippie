const slides    = document.querySelectorAll('.home-card');
const dots      = document.querySelectorAll('.dot');
const track     = document.getElementById('track');
const btnNext   = document.getElementById('btnNext');
const btnSkip   = document.getElementById('btnSkip');
const bgOrbs    = document.getElementById('bgOrbs');

const orbClasses = ['riego-orbs','monitoreo-orbs','wifi-orbs','nube-orbs'];
const dotColors  = ['#9d83ed','#2dc89b','#ffab40','#52b6ff'];

let current = 0;
const total = slides.length;

function goTo(idx) {
    slides[current].classList.remove('active');
    current = idx;
    track.style.transform = `translateX(-${current * 100}%)`;

    bgOrbs.className = 'bg-orbs ' + orbClasses[current];
    void bgOrbs.offsetWidth;

    dots.forEach((d, i) => {
        d.classList.toggle('active', i === current);
        d.style.background = i === current ? dotColors[current] : '';
    });

    if (current === total - 1) {
        btnNext.textContent = 'Comenzar';
        btnNext.classList.add('finishing');
    } else {
        btnNext.textContent = 'Siguiente';
        btnNext.classList.remove('finishing');
    }

    slides[current].classList.add('active');
}

btnNext.addEventListener('click', () => {
    if (current < total - 1) {
        goTo(current + 1);
    } else {
        window.location.href = 'auth/auth.html';
    }
});

btnSkip.addEventListener('click', () => {
    window.location.href = 'auth/auth.html';
});

let startX = 0;
const wrapper = document.querySelector('.carousel-track-wrapper');
wrapper.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
wrapper.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
        if (diff > 0 && current < total - 1) goTo(current + 1);
        else if (diff < 0 && current > 0) goTo(current - 1);
    }
}, { passive: true });

dots[0].style.background = dotColors[0];