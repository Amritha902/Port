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

// ===== Hero WAN topology with travelling packets =====
(function heroTopology(){
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  let nodes = [], edges = [], packets = [];

  // A deliberate backbone: a few core sites, each fanning out to edge sites.
  function buildTopology(){
    const cores = [
      { x: 0.24, y: 0.34 }, { x: 0.52, y: 0.62 }, { x: 0.78, y: 0.30 }
    ];
    const edgesRel = [
      { x: 0.10, y: 0.16 }, { x: 0.13, y: 0.58 }, { x: 0.34, y: 0.14 },
      { x: 0.36, y: 0.80 }, { x: 0.62, y: 0.20 }, { x: 0.66, y: 0.86 },
      { x: 0.88, y: 0.58 }, { x: 0.92, y: 0.14 }, { x: 0.46, y: 0.40 }
    ];

    nodes = [];
    cores.forEach(p => nodes.push({ bx: p.x, by: p.y, core: true, ph: Math.random() * Math.PI * 2 }));
    edgesRel.forEach(p => nodes.push({ bx: p.x, by: p.y, core: false, ph: Math.random() * Math.PI * 2 }));

    // core mesh
    edges = [[0, 1], [1, 2], [0, 2]];
    // each edge node attaches to its nearest core
    for (let i = cores.length; i < nodes.length; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < cores.length; c++) {
        const d = (nodes[i].bx - cores[c].x) ** 2 + (nodes[i].by - cores[c].y) ** 2;
        if (d < bestD) { bestD = d; best = c; }
      }
      edges.push([best, i]);
    }
    packets = edges.map((e, i) => ({ e: i, t: Math.random(), sp: 0.0016 + Math.random() * 0.0026 }));
  }

  function resize(){
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pos(n, time){
    // slow organic drift so the topology breathes without wandering
    return {
      x: n.bx * w + Math.sin(time * 0.00016 + n.ph) * 11,
      y: n.by * h + Math.cos(time * 0.00013 + n.ph * 1.4) * 9
    };
  }

  function frame(time){
    ctx.clearRect(0, 0, w, h);
    const pts = nodes.map(n => pos(n, time));

    ctx.lineWidth = 1;
    edges.forEach(([a, b]) => {
      ctx.strokeStyle = (nodes[a].core && nodes[b].core)
        ? 'rgba(14,107,99,0.30)'
        : 'rgba(255,255,255,0.055)';
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
      ctx.stroke();
    });

    packets.forEach(p => {
      p.t += p.sp;
      if (p.t > 1) p.t = 0;
      const [a, b] = edges[p.e];
      const x = pts[a].x + (pts[b].x - pts[a].x) * p.t;
      const y = pts[a].y + (pts[b].y - pts[a].y) * p.t;
      const fade = Math.sin(p.t * Math.PI);
      ctx.fillStyle = `rgba(31,168,155,${0.55 * fade})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    });

    nodes.forEach((n, i) => {
      const pt = pts[i];
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, n.core ? 3.2 : 1.9, 0, Math.PI * 2);
      ctx.fillStyle = n.core ? 'rgba(14,107,99,0.85)' : 'rgba(255,255,255,0.20)';
      ctx.fill();
      if (n.core) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 9 + Math.sin(time * 0.0013 + n.ph) * 2.4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(14,107,99,0.20)';
        ctx.stroke();
      }
    });

    requestAnimationFrame(frame);
  }

  buildTopology();
  resize();
  window.addEventListener('resize', () => { resize(); }, { passive: true });
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
