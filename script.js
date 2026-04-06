/* ============================================================
   PROGRESS BAR
   ============================================================ */
const progressBar = document.getElementById('progress-bar');

function updateProgress() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  if (h > 0) {
    progressBar.style.width = (window.scrollY / h * 100) + '%';
  }
}

/* ============================================================
   NAV BORDER ON SCROLL
   ============================================================ */
const nav = document.getElementById('nav');

function updateNav() {
  nav.classList.toggle('has-border', window.scrollY > 60);
}

/* ============================================================
   DOT NAVIGATOR
   ============================================================ */
const dots = document.querySelectorAll('.dot');
const sections = ['hero', 'story', 'experience', 'projects', 'skills', 'contact'];

dots.forEach(dot => {
  dot.addEventListener('click', () => {
    const target = document.getElementById(dot.dataset.target);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

function updateDots() {
  let current = sections[0];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) {
      current = id;
    }
  });
  dots.forEach(dot => {
    dot.classList.toggle('active', dot.dataset.target === current);
  });
}

/* ============================================================
   SCROLL REVEAL (IntersectionObserver)
   ============================================================ */
const revealObs = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 5 * 0.08) + 's';
  revealObs.observe(el);
});

/* ============================================================
   GSAP SCROLL TRIGGER
   ============================================================ */
function initGsap() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal-gsap').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.project-scroll-content').forEach(section => {
    gsap.from(section.querySelectorAll('.reveal-gsap'), {
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
      },
      opacity: 0,
      y: 25,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power2.out',
    });
  });
}

/* ============================================================
   COMBINED SCROLL HANDLER
   ============================================================ */
function onScroll() {
  updateProgress();
  updateNav();
  updateDots();
}

window.addEventListener('scroll', onScroll, { passive: true });

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  updateNav();
  updateDots();
  initGsap();
});
