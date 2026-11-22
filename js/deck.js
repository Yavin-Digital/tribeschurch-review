(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length, current = 0;
  var bar = document.getElementById('progressBar');
  var counter = document.getElementById('counter');
  var prev = document.getElementById('prevBtn'), next = document.getElementById('nextBtn');
  var toc = document.getElementById('toc'), tocList = document.getElementById('tocList');
  var tocOpen = document.getElementById('tocOpen'), tocClose = document.getElementById('tocClose');

  slides.forEach(function (s, i) {
    s.id = s.id || 'slide-' + (i + 1);
    s.setAttribute('aria-label', 'Slide ' + (i + 1) + ' of ' + total + ': ' + (s.dataset.title || ''));
    var li = document.createElement('li'), a = document.createElement('a');
    a.href = '#' + s.id; a.textContent = s.dataset.title || ('Slide ' + (i + 1));
    a.addEventListener('click', function (e) { e.preventDefault(); closeToc(); go(i); });
    li.appendChild(a); tocList.appendChild(li);
  });
  var links = tocList.querySelectorAll('a');
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var locking = false, lockTimer = 0, lockStart = 0, root = document.documentElement;

  function update(i) {
    current = i;
    bar.style.width = ((i + 1) / total * 100) + '%';
    counter.textContent = (i + 1) + ' / ' + total;
    prev.disabled = i === 0; next.disabled = i === total - 1;
    if (prev.disabled && document.activeElement === prev) next.focus();
    else if (next.disabled && document.activeElement === next) prev.focus();
    links.forEach(function (l, k) { l.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  }
  function go(i) {
    i = Math.max(0, Math.min(total - 1, i));
    slides[i].scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    update(i);
    settle(true);
    if (history.replaceState) history.replaceState(null, '', '#' + slides[i].id);
  }
  // Hold the counter on the target slide until the programmatic scroll has stopped
  function settle(start) {
    if (start) { locking = true; lockStart = Date.now(); }
    clearTimeout(lockTimer);
    lockTimer = setTimeout(function () { locking = false; detect(); }, 200);
  }
  function detect() {
    if (locking) return;
    var mid = window.innerHeight * 0.4, best = 0;
    for (var i = 0; i < total; i++) { if (slides[i].getBoundingClientRect().top <= mid) best = i; }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) best = total - 1;
    if (best !== current) update(best);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (locking && Date.now() - lockStart < 4000) settle(false);
    if (!ticking) { ticking = true; requestAnimationFrame(function () { detect(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener('resize', detect);

  prev.addEventListener('click', function () { go(current - 1); });
  next.addEventListener('click', function () { go(current + 1); });

  document.addEventListener('keydown', function (e) {
    if (!toc.hidden) {
      if (e.key === 'Escape') { closeToc(); return; }
      if (e.key === 'Tab') {
        var f = toc.querySelectorAll('a[href],button:not([disabled])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1], a = document.activeElement;
        if (!toc.contains(a)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); go(current + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); go(current - 1); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(total - 1); }
  });

  // Horizontal swipe = next / previous (vertical swipe is normal scrolling)
  var sx = 0, sy = 0, st = 0;
  document.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!toc.hidden) return;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - st < 800) go(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  function openToc() { toc.hidden = false; root.classList.add('toc-open'); tocOpen.setAttribute('aria-expanded', 'true'); (links[current] || tocClose).focus(); }
  function closeToc() { toc.hidden = true; root.classList.remove('toc-open'); tocOpen.setAttribute('aria-expanded', 'false'); tocOpen.focus(); }
  tocOpen.addEventListener('click', openToc);
  tocClose.addEventListener('click', closeToc);
  toc.addEventListener('click', function (e) { if (e.target === toc) closeToc(); });

  var hid = '';
  try { hid = decodeURIComponent(location.hash.slice(1)); } catch (err) { hid = ''; }
  var h = hid ? document.getElementById(hid) : null;
  var start = h ? slides.indexOf(h) : 0;
  update(start < 0 ? 0 : start);
  if (start > 0) slides[start].scrollIntoView({ behavior: 'instant', block: 'start' });
})();
