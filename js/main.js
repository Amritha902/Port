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

// ===== Active dock item on scroll =====
const sections = document.querySelectorAll('main section[id]');
const dockItems = document.querySelectorAll('.dock-item');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      dockItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-target') === id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

sections.forEach(s => navObserver.observe(s));

// ===== Scroll reveal =====
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('in'), i * 40);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ===== Terminal hero sequence =====
const cmd1 = document.getElementById('cmd1');
const out1 = document.getElementById('out1');
const line2 = document.getElementById('line2');
const cmd2 = document.getElementById('cmd2');
const out2 = document.getElementById('out2');
const typedRole = document.getElementById('typedRole');

function typeInto(el, text, speed){
  return new Promise(resolve => {
    let i = 0;
    (function step(){
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) setTimeout(step, speed);
      else resolve();
    })();
  });
}

const roles = [
  'Cloud & Network Engineer',
  'Data Systems Builder',
  'ECE @ VIT Chennai',
  'BS Data Science @ IIT Madras',
  'Co-Inventor, 2 Indian Patents'
];

function roleLoop(){
  let roleIndex = 0, charIndex = 0, deleting = false;
  (function tick(){
    const current = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      typedRole.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) { deleting = true; setTimeout(tick, 1600); return; }
    } else {
      charIndex--;
      typedRole.textContent = current.slice(0, charIndex);
      if (charIndex === 0) { deleting = false; roleIndex = (roleIndex + 1) % roles.length; }
    }
    setTimeout(tick, deleting ? 30 : 60);
  })();
}

async function runTerminal(){
  await typeInto(cmd1, 'whoami', 55);
  out1.style.display = 'block';
  await new Promise(r => setTimeout(r, 500));
  line2.style.display = 'flex';
  await typeInto(cmd2, 'cat role.current', 45);
  out2.style.display = 'block';
  roleLoop();
}

if (cmd1) runTerminal();

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
  const duration = 1200;
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
