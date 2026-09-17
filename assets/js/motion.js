(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealItems = document.querySelectorAll('[data-reveal], [data-stagger]');
  var navigation = document.querySelector('.experience-nav');
  var flowPulses = document.querySelectorAll('.flow-pulse__main');
  var flowContainer = document.querySelector('.flow-pulse');
  var scrollStopTimer;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries, observerInstance) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observerInstance.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach(function (item) { observer.observe(item); });

  var hero = document.querySelector('.experience-hero');
  var heroTitle = document.querySelector('.hero-title');
  var ticking = false;
  function updateScrollState() {
    var scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    var scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    var flowProgress = scrollProgress;
    if (flowContainer) {
      var flowStart = flowContainer.getBoundingClientRect().top + window.scrollY;
      var flowTravel = Math.max(flowContainer.offsetHeight - window.innerHeight, 1);
      flowProgress = Math.max(0, Math.min(1, (window.scrollY - flowStart) / flowTravel));
    }
    flowPulses.forEach(function (flowPulse) {
      flowPulse.style.strokeDashoffset = String(1000 - (flowProgress * 1000));
      flowPulse.style.opacity = String(.18 + (flowProgress * .82));
    });
    if (navigation) navigation.classList.toggle('is-scrolled', window.scrollY > 40);
    if (hero && heroTitle) {
      var heroProgress = Math.min(window.scrollY / window.innerHeight, 1);
      heroTitle.style.transform = 'translate3d(0, ' + (heroProgress * 80) + 'px, 0)';
      hero.style.setProperty('--hero-progress', heroProgress);
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) window.requestAnimationFrame(updateScrollState);
    ticking = true;
    document.body.classList.add('is-scrolling');
    window.clearTimeout(scrollStopTimer);
    scrollStopTimer = window.setTimeout(function () { document.body.classList.remove('is-scrolling'); }, 180);
  }, { passive: true });
  updateScrollState();
}());
