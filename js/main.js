// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();

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
