// ===== Preloader =====
(function preloader(){
  const el = document.getElementById('preloader');
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hold = reduced ? 0 : 1500;
  const start = performance.now();

  function dismiss(){
    const elapsed = performance.now() - start;
    setTimeout(() => {
      el.classList.add('done');
      document.body.classList.remove('loading');
    }, Math.max(0, hold - elapsed));
  }

  if (document.readyState === 'complete') dismiss();
  else window.addEventListener('load', dismiss);
  // never trap the page if load stalls
  setTimeout(dismiss, 4000);
})();

// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Site-wide particle field (parallax + scroll-reactive) =====
(function particleField(){
  const canvas = document.getElementById('fieldCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  let parts = [];
  const mouse = { x: -9999, y: -9999 };
  let scrollY = window.scrollY, vel = 0;

  const COUNT = () => Math.round(Math.min(96, Math.max(38, (w * h) / 20000)));

  function build(){
    parts = [];
    const n = COUNT();
    for (let i = 0; i < n; i++) {
      const depth = 0.25 + Math.random() * 0.75;      // 0.25 near .. 1 far
      parts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        depth,
        r: (1 - depth) * 2.0 + 0.6,                   // nearer = larger
        drift: (Math.random() - 0.5) * 0.10,
        ph: Math.random() * Math.PI * 2,
        teal: Math.random() < 0.34
      });
    }
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function onScroll(){
    const y = window.scrollY;
    vel += (y - scrollY);
    scrollY = y;
  }

  function frame(time){
    ctx.clearRect(0, 0, w, h);

    // scroll velocity decays; it stretches particles into short trails
    vel *= 0.90;
    const stretch = Math.max(-26, Math.min(26, vel * 0.55));

    for (const p of parts) {
      // travelling down the field: nearer particles move more (parallax)
      p.y -= vel * (1.05 - p.depth) * 0.55;
      p.x += p.drift + Math.sin(time * 0.0002 + p.ph) * 0.10;

      // wrap so the field is endless in both directions
      if (p.y < -40) p.y = h + 40;
      if (p.y > h + 40) p.y = -40;
      if (p.x < -40) p.x = w + 40;
      if (p.x > w + 40) p.x = -40;

      // gentle mouse repulsion, strongest on near particles
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      let ox = 0, oy = 0;
      if (d2 < 26000) {
        const f = (1 - d2 / 26000) * (1.15 - p.depth) * 26;
        const d = Math.sqrt(d2) || 1;
        ox = (dx / d) * f; oy = (dy / d) * f;
      }

      const x = p.x + ox, y = p.y + oy;
      const alpha = (1.05 - p.depth) * 0.55;

      if (Math.abs(stretch) > 1.2) {
        ctx.strokeStyle = p.teal
          ? `rgba(31,168,155,${alpha * 0.9})`
          : `rgba(255,255,255,${alpha * 0.5})`;
        ctx.lineWidth = p.r * 0.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + stretch * (1.05 - p.depth));
        ctx.stroke();
      } else {
        ctx.fillStyle = p.teal
          ? `rgba(31,168,155,${alpha})`
          : `rgba(255,255,255,${alpha * 0.55})`;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      p._x = x; p._y = y;
    }

    // constellation links between near neighbours
    for (let i = 0; i < parts.length; i++) {
      const a = parts[i];
      for (let j = i + 1; j < parts.length; j++) {
        const b = parts[j];
        const dx = a._x - b._x, dy = a._y - b._y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 15000) {
          const t = 1 - d2 / 15000;
          ctx.strokeStyle = `rgba(31,168,155,${t * 0.16})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a._x, a._y);
          ctx.lineTo(b._x, b._y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('mouseout', () => { mouse.x = -9999; mouse.y = -9999; });
  requestAnimationFrame(frame);
})();

// ===== Word-stagger reveal on display headings =====
(function wordStagger(){
  const targets = document.querySelectorAll('.hero-name, .section-title');
  targets.forEach(el => {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      span.style.transitionDelay = (i * 55) + 'ms';
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.word').forEach(word => word.classList.add('in'));
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => obs.observe(el));
})();

// ===== Hero parallax on scroll =====
(function heroParallax(){
  const inner = document.querySelector('.hero > .container');
  if (!inner) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > window.innerHeight) return;
    inner.style.transform = `translateY(${y * 0.16}px)`;
    inner.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.85)));
  }, { passive: true });
})();

// ===== Nav scroll state + progress bar =====
const nav = document.getElementById('nav');
const progressBar = document.getElementById('progressBar');

function onScroll(){
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 20);
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Mobile menu =====
const burger = document.getElementById('burger');
const navLinksEl = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  burger.classList.toggle('active');
  navLinksEl.classList.toggle('open');
});
navLinksEl.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('active');
    navLinksEl.classList.remove('open');
  });
});

// ===== Dock active state on scroll =====
const dockItems = document.querySelectorAll('.dock-item');
const dockTargetIds = ['home', 'about', 'experience', 'work', 'research', 'skills', 'contact'];
const dockSections = dockTargetIds.map(id => document.getElementById(id)).filter(Boolean);

const dockObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      dockItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-target') === id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

dockSections.forEach(s => dockObserver.observe(s));

// ===== Hero cursor glow =====
const heroSection = document.querySelector('.hero');
const heroGlow = document.getElementById('heroGlow');
if (heroSection && heroGlow && window.matchMedia('(pointer: fine)').matches) {
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    heroGlow.style.left = (e.clientX - rect.left) + 'px';
    heroGlow.style.top = (e.clientY - rect.top) + 'px';
  });
  heroSection.addEventListener('mouseenter', () => heroSection.classList.add('glow-active'));
  heroSection.addEventListener('mouseleave', () => heroSection.classList.remove('glow-active'));
}

// ===== Active nav link on scroll =====
const navLinkEls = document.querySelectorAll('.nav-link');
const navTargetIds = ['about', 'experience', 'work', 'contact'];
const navSections = navTargetIds.map(id => document.getElementById(id)).filter(Boolean);

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinkEls.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

navSections.forEach(s => navObserver.observe(s));

// ===== Scroll reveal =====
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('in'), i * 30);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ===== Rotating role text =====
const roles = [
  'Cloud & Network Engineer',
  'Data Systems Builder',
  'ECE @ VIT Chennai',
  'BS Data Science @ IIT Madras',
  'Co-Inventor, 2 Indian Patents'
];
const typedEl = document.getElementById('typedRole');
let roleIndex = 0, charIndex = 0, deleting = false;

function typeLoop(){
  const current = roles[roleIndex];
  if (!deleting) {
    charIndex++;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) { deleting = true; setTimeout(typeLoop, 1800); return; }
  } else {
    charIndex--;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) { deleting = false; roleIndex = (roleIndex + 1) % roles.length; }
  }
  setTimeout(typeLoop, deleting ? 30 : 60);
}
typeLoop();

// ===== Animated counters =====
const counters = document.querySelectorAll('.stat-num');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));

function animateCount(el){
  const target = parseFloat(el.getAttribute('data-count'));
  const isDecimal = el.getAttribute('data-decimal') === 'true';
  const duration = 1100;
  const start = performance.now();

  function step(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = isDecimal ? value.toFixed(2) : Math.round(value);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = isDecimal ? target.toFixed(2) : target;
  }
  requestAnimationFrame(step);
}

// ===== Live GitHub commit activity =====
(function loadCommits(){
  const list = document.getElementById('commitList');
  if (!list) return;

  function timeAgo(iso){
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return mins <= 1 ? 'just now' : mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 30) return days + 'd ago';
    const months = Math.floor(days / 30);
    if (months < 12) return months + 'mo ago';
    return Math.floor(months / 12) + 'y ago';
  }

  fetch('https://api.github.com/users/Amritha902/events/public?per_page=30')
    .then(res => {
      if (!res.ok) throw new Error('GitHub API error ' + res.status);
      return res.json();
    })
    .then(events => {
      const commits = [];
      events.filter(e => e.type === 'PushEvent').forEach(e => {
        (e.payload.commits || []).forEach(c => {
          commits.push({
            repo: e.repo.name,
            sha: c.sha,
            message: (c.message || '').split('\n')[0],
            date: e.created_at
          });
        });
      });
      commits.sort((a, b) => new Date(b.date) - new Date(a.date));
      const top = commits.slice(0, 5);

      list.innerHTML = '';
      if (top.length === 0) {
        const p = document.createElement('p');
        p.className = 'commit-empty';
        p.textContent = 'No recent public commits found.';
        list.appendChild(p);
        return;
      }

      top.forEach(c => {
        const row = document.createElement('a');
        row.className = 'commit-row';
        row.href = `https://github.com/${c.repo}/commit/${c.sha}`;
        row.target = '_blank';
        row.rel = 'noopener';

        const repoEl = document.createElement('span');
        repoEl.className = 'commit-repo';
        repoEl.textContent = c.repo.replace(/^Amritha902\//i, '');

        const msgEl = document.createElement('span');
        msgEl.className = 'commit-msg';
        msgEl.textContent = c.message;

        const timeEl = document.createElement('span');
        timeEl.className = 'commit-time';
        timeEl.textContent = timeAgo(c.date);

        row.appendChild(repoEl);
        row.appendChild(msgEl);
        row.appendChild(timeEl);
        list.appendChild(row);
      });
    })
    .catch(() => {
      list.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'commit-empty';
      p.textContent = 'Couldn’t load live activity right now — ';
      const a = document.createElement('a');
      a.href = 'https://github.com/Amritha902';
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'view on GitHub →';
      a.style.color = 'var(--teal)';
      p.appendChild(a);
      list.appendChild(p);
    });
})();
