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
  var scrollProgressBar;

  function initScrollProgress() {
    scrollProgressBar = document.createElement('div');
    scrollProgressBar.className = 'scroll-progress';
    scrollProgressBar.setAttribute('role', 'progressbar');
    scrollProgressBar.setAttribute('aria-label', 'Avanzamento della pagina');
    scrollProgressBar.setAttribute('aria-valuemin', '0');
    scrollProgressBar.setAttribute('aria-valuemax', '100');
    scrollProgressBar.innerHTML = '<span></span>';
    document.body.appendChild(scrollProgressBar);
  }

  initScrollProgress();

  function initMobileMenu() {
    var navigation = document.querySelector('.experience-nav');
    var menu = document.querySelector('.experience-nav-center, .experience-nav-links');
    if (!navigation || !menu) return;

    menu.id = 'mobile-navigation';
    var toggle = document.createElement('button');
    toggle.className = 'mobile-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'mobile-navigation');
    toggle.innerHTML = '<span></span><span></span><span></span><b>menu</b>';
    (navigation.querySelector('.experience-nav-shell') || navigation).appendChild(toggle);

    function closeMenu() {
      navigation.classList.remove('is-menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var isOpen = navigation.classList.toggle('is-menu-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    menu.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
    document.addEventListener('click', function (event) {
      if (!navigation.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
  }

  initMobileMenu();

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
        var points = [{ x: centerX, y: centerY }];

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
            interaction = influence * mouseNormalDistance * 48;
            wave += interaction * Math.sin(progress * Math.PI);
          }

          var pointX = baseX + normalX * wave;
          var pointY = baseY + normalY * wave;
          if (pointIndex === 32) {
            pointX = filament.endX;
            pointY = filament.endY;
          }
          points.push({ x: pointX, y: pointY });
        }

        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (var curveIndex = 1; curveIndex < points.length - 1; curveIndex += 1) {
          var midpointX = (points[curveIndex].x + points[curveIndex + 1].x) * .5;
          var midpointY = (points[curveIndex].y + points[curveIndex + 1].y) * .5;
          context.quadraticCurveTo(points[curveIndex].x, points[curveIndex].y, midpointX, midpointY);
        }
        var finalPoint = points[points.length - 1];
        var previousPoint = points[points.length - 2];
        context.quadraticCurveTo(previousPoint.x, previousPoint.y, finalPoint.x, finalPoint.y);
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
    if (scrollProgressBar) {
      var progressPercent = Math.round(scrollProgress * 100);
      scrollProgressBar.firstElementChild.style.transform = 'scaleX(' + scrollProgress + ')';
      scrollProgressBar.setAttribute('aria-valuenow', String(progressPercent));
    }
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
      var titleOffset = Math.max(-40, Math.min(40, titleProgress * 2)) - 10;
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
