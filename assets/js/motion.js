(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealItems = document.querySelectorAll('[data-reveal], [data-stagger]');
  var navigation = document.querySelector('.experience-nav');
  var flowPulses = document.querySelectorAll('.flow-pulse__main');
  var flowContainer = document.querySelector('.flow-pulse');
  var scrollTitles = document.querySelectorAll('.section-heading, .cta-heading, .service-row h2, .team-card h2');
  var scrollTitlePositions = [];
  var scrollStopTimer;
  var filamentCanvas = document.querySelector('.hero-filaments');

  scrollTitles.forEach(function (title) {
    title.classList.add('scroll-title');
    var titlePosition = title;
    var documentTop = 0;
    while (titlePosition) {
      documentTop += titlePosition.offsetTop;
      titlePosition = titlePosition.offsetParent;
    }
    scrollTitlePositions.push(documentTop);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
    return;
  }

  function initHeroFilaments() {
    if (!filamentCanvas) return;

    var context = filamentCanvas.getContext('2d');
    var hero = filamentCanvas.parentElement;
    var filaments = [];
    var pointer = { x: 0, y: 0, active: false };
    var width = 0;
    var height = 0;
    var pixelRatio = 1;
    var animationFrame;

    function createFilaments() {
      filaments = [];
      var count = width < 600 ? 20 : 40;
      var centerX = width * .5;
      var centerY = height * .38;

      for (var index = 0; index < count; index += 1) {
        var angle = (Math.PI * 2 * index / count) + (Math.random() - .5) * .035;
        var distanceX = Math.cos(angle) > 0 ? (width - centerX) / Math.cos(angle) : -centerX / Math.cos(angle);
        var distanceY = Math.sin(angle) > 0 ? (height - centerY) / Math.sin(angle) : -centerY / Math.sin(angle);
        var distance = Math.min(Math.abs(distanceX), Math.abs(distanceY));
        var endX = centerX + Math.cos(angle) * distance;
        var endY = centerY + Math.sin(angle) * distance;

        filaments.push({
          angle: angle,
          amplitude: 14 + Math.random() * 26,
          endX: endX,
          endY: endY,
          phase: Math.random() * Math.PI * 2,
          speed: .00028 + Math.random() * .00024,
          width: .7 + Math.random() * 1
        });
      }
    }

    function resize() {
      var bounds = hero.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      filamentCanvas.width = width * pixelRatio;
      filamentCanvas.height = height * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      createFilaments();
    }

    function draw(timestamp) {
      context.clearRect(0, 0, width, height);
      var centerX = width * .5;
      var centerY = height * .38;

      filaments.forEach(function (filament) {
        context.beginPath();
        context.moveTo(centerX, centerY);

        for (var pointIndex = 1; pointIndex <= 32; pointIndex += 1) {
          var progress = pointIndex / 32;
          var baseX = centerX + (filament.endX - centerX) * progress;
          var baseY = centerY + (filament.endY - centerY) * progress;
          var wave = Math.sin(timestamp * filament.speed + filament.phase + progress * 5.5) * filament.amplitude * Math.sin(progress * Math.PI);
          var normalX = -Math.sin(filament.angle);
          var normalY = Math.cos(filament.angle);
          var interaction = 0;

          if (pointer.active) {
            var mouseDistanceX = baseX - pointer.x;
            var mouseDistanceY = baseY - pointer.y;
            var mouseDistance = Math.sqrt(mouseDistanceX * mouseDistanceX + mouseDistanceY * mouseDistanceY);
            var influence = Math.exp(-(mouseDistance * mouseDistance) / (2 * 210 * 210));
            var mouseNormalDistance = (mouseDistanceX * normalX + mouseDistanceY * normalY) / (mouseDistance || 1);
            interaction = influence * mouseNormalDistance * 92;
            wave += interaction * Math.sin(progress * Math.PI);
          }

          var pointX = baseX + normalX * wave;
          var pointY = baseY + normalY * wave;
          if (pointIndex === 32) {
            pointX = filament.endX;
            pointY = filament.endY;
          }
          context.lineTo(pointX, pointY);
        }

        context.strokeStyle = 'rgba(180, 239, 255, ' + (.24 + Math.abs(Math.sin(filament.phase)) * .18) + ')';
        context.lineWidth = filament.width;
        context.stroke();
      });

      animationFrame = window.requestAnimationFrame(draw);
    }

    hero.addEventListener('pointermove', function (event) {
      var bounds = hero.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    });
    hero.addEventListener('pointerleave', function () { pointer.active = false; });
    window.addEventListener('resize', resize);
    resize();
    animationFrame = window.requestAnimationFrame(draw);
  }

  initHeroFilaments();

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
      flowPulse.style.opacity = String(.78 + (flowProgress * .82));
    });
    if (navigation) navigation.classList.toggle('is-scrolled', window.scrollY > 40);
    if (hero && heroTitle) {
      var heroProgress = Math.min(window.scrollY / window.innerHeight, 1);
      heroTitle.style.transform = 'translate3d(0, ' + (heroProgress * 80) + 'px, 0)';
      hero.style.setProperty('--hero-progress', heroProgress);
    }
    scrollTitles.forEach(function (title, index) {
      var titleProgress = (window.scrollY + window.innerHeight * .5 - scrollTitlePositions[index] - title.offsetHeight * .5) / window.innerHeight;
      var titleOffset = Math.max(-40, Math.min(40, titleProgress * 28));
      title.style.transform = 'translate3d(0, ' + titleOffset + 'px, 0)';
    });
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
