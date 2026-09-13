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

/* ============================================================
   YOUTUBE FACADE
   ============================================================ */
const YT_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

function ytEmbedUrl(id, start, api) {
  const p = new URLSearchParams({
    autoplay: '1',
    rel: '0',             // end screen stays on this channel
    color: 'white',       // grey scrubber instead of YouTube red
    iv_load_policy: '3',  // no annotation overlays
    playsinline: '1'
  });
  if (start) p.set('start', String(start));
  if (api) p.set('enablejsapi', '1');
  return 'https://www.youtube-nocookie.com/embed/' + id + '?' + p.toString();
}

function ytOpen(box, start) {
  if (box.dataset.loaded === '1') return;
  const usesApi = box.dataset.api === '1';
  const frame = document.createElement('iframe');
  frame.src = ytEmbedUrl(box.dataset.id, start, usesApi);
  frame.title = box.dataset.title || '';
  frame.allow = YT_ALLOW;
  frame.allowFullscreen = true;
  box.appendChild(frame);
  box.dataset.loaded = '1';
  if (usesApi) ytLoadApi();
}

document.querySelectorAll('.yt').forEach(box => {
  const btn = box.querySelector('.yt-play');
  if (btn) btn.addEventListener('click', () => ytOpen(box));
});

/* The chapter list drives one player, so that one loads the IFrame API:
   a second chapter click should seek rather than reload the video. The
   API script is only fetched once that player is actually opened. */
let chapterPlayer = null;
let ytApiRequested = false;

function ytLoadApi() {
  if (ytApiRequested) return;
  ytApiRequested = true;
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
}

window.onYouTubeIframeAPIReady = function () {
  const frame = document.querySelector('.yt[data-api="1"] iframe');
  if (frame) chapterPlayer = new YT.Player(frame);
};

document.querySelectorAll('[data-seek]').forEach(btn => {
  btn.addEventListener('click', () => {
    const box = document.querySelector('.yt[data-api="1"]');
    if (!box) return;
    const at = Number(btn.dataset.seek);
    if (box.dataset.loaded !== '1') {
      ytOpen(box, at);
    } else if (chapterPlayer && chapterPlayer.seekTo) {
      chapterPlayer.seekTo(at, true);
      chapterPlayer.playVideo();
    }
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

window.addEventListener('scroll', updateNav, { passive: true });
document.addEventListener('DOMContentLoaded', updateNav);
