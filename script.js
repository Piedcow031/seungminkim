/* ============================================================
   NAV BORDER ON SCROLL
   ============================================================ */
const nav = document.getElementById('nav');

function updateNav() {
  if (!nav) return;
  nav.classList.toggle('has-border', window.scrollY > 60);
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

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

window.addEventListener('scroll', updateNav, { passive: true });
document.addEventListener('DOMContentLoaded', updateNav);
