/* ── Dark Mode ── */
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = themeToggle.querySelector('.theme-icon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

applyTheme(localStorage.getItem('theme') || 'light');

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

/* ── Typewriter ── */
const TYPE_TEXT = '애니메이션 IP의 세계관을 게임에 녹여내고\n플레이어의 이야기를 설계한 컨텐츠 기획자입니다.';
const typeEl = document.querySelector('.typewriter');
let charIndex = 0;

function type() {
  if (charIndex < TYPE_TEXT.length) {
    typeEl.innerHTML = TYPE_TEXT.slice(0, ++charIndex).replace(/\n/g, '<br>');
    setTimeout(type, charIndex < 15 ? 70 : 32);
  }
}
setTimeout(type, 600);

/* ── Scroll Reveal ── */
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObs.observe(el));

/* ── Nav active state on scroll ── */
const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const sections = [...document.querySelectorAll('main section[id]')];

const navObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => navObs.observe(s));

/* ── Career Tabs ── */
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const body = btn.closest('.tl-body');
    body.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    body.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  });
});

/* ── Video Modal ── */
const modal = document.getElementById('modal');
const iframe = document.getElementById('modal-iframe');
const closeBtn = document.getElementById('modal-close');

document.querySelectorAll('.proj-item .proj-thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    const card = thumb.closest('.proj-item');
    const videoId = card.dataset.video;
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

/* ── Accordion ── */
document.querySelectorAll('.accordion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    btn.nextElementSibling.classList.toggle('open', !expanded);
  });
});

/* ── Timestamp buttons ── */
document.querySelectorAll('.ts-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const videoId = btn.dataset.video;
    const start = btn.dataset.start;
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&start=${start}`;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeModal() {
  modal.classList.remove('open');
  iframe.src = '';
  document.body.style.overflow = '';
}

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
