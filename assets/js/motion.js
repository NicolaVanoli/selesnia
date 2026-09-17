(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealItems = document.querySelectorAll('[data-reveal], [data-stagger]');
  var navigation = document.querySelector('.experience-nav');
  var flowPulsePath = document.querySelector('.flow-pulse__main');
  var flowSecondaryPaths = document.querySelectorAll('.flow-pulse__secondary');
  var flowRailPath;
  var flowContainer = document.querySelector('.flow-pulse');
  var scrollTitles = document.querySelectorAll('.section-heading, .cta-heading, .service-row h2, .team-card h2');
  var scrollTitlePositions = [];
  var scrollStopTimer;
  var filamentCanvas = document.querySelector('.hero-filaments');
  var scrollProgressBar;
  var flowTarget = 0;
  var flowPosition = 0;

  function buildFlowPath() {
    if (!flowPulsePath || !flowContainer || !flowContainer.parentElement) return;
    var flowSvg = flowPulsePath.ownerSVGElement;
    var flowRoot = flowContainer.parentElement;
    var flowBounds = flowRoot.getBoundingClientRect();
    var flowHeight = Math.max(flowRoot.offsetHeight, 1);
    var sectionNodes = flowRoot.classList.contains('experience-section')
      ? [flowRoot]
      : Array.prototype.slice.call(flowRoot.querySelectorAll(':scope > .experience-section'));

    if (!sectionNodes.length) sectionNodes = [flowRoot];

    var points = sectionNodes.map(function (sectionNode, index) {
      var sectionBounds = sectionNode.getBoundingClientRect();
      var textNode = sectionNode.querySelector('.section-grid, .page-content > .section-grid') || sectionNode.firstElementChild;
      var textBounds = textNode ? textNode.getBoundingClientRect() : sectionBounds;
      var leftSafeX = textBounds.left - flowBounds.left + 350;
      var rightSafeX = textBounds.right - flowBounds.left - 350;
      var safeX = index % 2 === 0 ? leftSafeX : rightSafeX;

      return {
        x: Math.max(38, Math.min(962, safeX / Math.max(flowBounds.width, 1) * 1000)),
        startY: Math.max(0, (sectionBounds.top - flowBounds.top) / flowHeight * 1400),
        endY: Math.min(1400, (sectionBounds.bottom - flowBounds.top) / flowHeight * 1400)
      };
    });

    var firstPoint = points[0];
    var path = 'M' + firstPoint.x.toFixed(2) + ' 0 V' + firstPoint.startY.toFixed(2);
    points.forEach(function (point, index) {
      var nextPoint = points[index + 1];
      if (nextPoint) {
        var horizontalDirection = nextPoint.x >= point.x ? 1 : -1;
        var cornerRadius = Math.min(36, Math.abs(nextPoint.x - point.x) * .25);
        var horizontalStartX = point.x + horizontalDirection * cornerRadius;
        var horizontalEndX = nextPoint.x - horizontalDirection * cornerRadius;
        path += ' V' + (point.endY - cornerRadius).toFixed(2);
        path += ' Q' + point.x.toFixed(2) + ' ' + point.endY.toFixed(2) + ' ' + horizontalStartX.toFixed(2) + ' ' + point.endY.toFixed(2);
        path += ' H' + horizontalEndX.toFixed(2);
        path += ' Q' + nextPoint.x.toFixed(2) + ' ' + point.endY.toFixed(2) + ' ' + nextPoint.x.toFixed(2) + ' ' + (point.endY + cornerRadius).toFixed(2);
        path += ' V' + (nextPoint.endY - cornerRadius).toFixed(2);
      } else {
        path += ' V' + point.endY.toFixed(2);
      }
    });

    flowPulsePath.removeAttribute('d');
    flowSvg.setAttribute('viewBox', '0 0 1000 1400');
    flowContainer.querySelectorAll('.flow-pulse__rail').forEach(function (rail) { rail.remove(); });
    var rail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    rail.setAttribute('class', 'flow-pulse__rail');
    rail.setAttribute('d', path);
    flowSvg.insertBefore(rail, flowPulsePath);
    flowRailPath = rail;
    flowPulsePath.setAttribute('d', path);
    flowSecondaryPaths.forEach(function (secondaryPath) { secondaryPath.setAttribute('d', path); });
  }

  function updateIlluminatedFlow(pathTarget, progress) {
    if (!pathTarget || !flowRailPath) return;

    var pathLength = flowRailPath.getTotalLength();
    var visibleLength = Math.max(0, Math.min(pathLength, progress * pathLength));
    var sampleDistance = Math.max(8, pathLength / 180);
    var points = [];

    for (var distance = 0; distance <= visibleLength; distance += sampleDistance) {
      points.push(flowRailPath.getPointAtLength(distance));
    }

    var endPoint = flowRailPath.getPointAtLength(visibleLength);
    if (!points.length) points.push(endPoint);
    points.push(endPoint);

    var illuminatedPath = 'M' + points[0].x.toFixed(2) + ' ' + points[0].y.toFixed(2);
    for (var pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
      var currentPoint = points[pointIndex];
      var followingPoint = points[pointIndex + 1];
      var midpointX = (currentPoint.x + followingPoint.x) * .5;
      var midpointY = (currentPoint.y + followingPoint.y) * .5;
      illuminatedPath += ' Q' + currentPoint.x.toFixed(2) + ' ' + currentPoint.y.toFixed(2) + ' ' + midpointX.toFixed(2) + ' ' + midpointY.toFixed(2);
    }

    var finalControlPoint = points[points.length - 1];
    illuminatedPath += ' Q' + finalControlPoint.x.toFixed(2) + ' ' + finalControlPoint.y.toFixed(2) + ' ' + endPoint.x.toFixed(2) + ' ' + endPoint.y.toFixed(2);
    pathTarget.setAttribute('d', illuminatedPath);
  }

  if (flowPulsePath) {
    flowPulsePath.removeAttribute('d');
    buildFlowPath();
    window.addEventListener('resize', buildFlowPath);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildFlowPath);
  }

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
  }, { threshold:0.04, rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach(function (item) { observer.observe(item); });

  var hero = document.querySelector('.experience-hero');
  var heroTitle = document.querySelector('.hero-title');
  function updateScrollState() {
    var scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    var scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    if (scrollProgressBar) {
      var progressPercent = Math.round(scrollProgress * 100);
      scrollProgressBar.firstElementChild.style.transform = 'scaleX(' + scrollProgress + ')';
      scrollProgressBar.setAttribute('aria-valuenow', String(progressPercent));
    }
    var flowProgress = scrollProgress;
    if (flowContainer && flowContainer.parentElement) {
      var flowRoot = flowContainer.parentElement;
      var flowRootTop = flowRoot.getBoundingClientRect().top + window.scrollY;
      var flowRootHeight = Math.max(flowRoot.offsetHeight, 1);
      var visualFocus = window.scrollY + window.innerHeight * .5;
      flowProgress = Math.max(0, Math.min(1, (visualFocus - flowRootTop) / flowRootHeight));
    }
    flowTarget = flowProgress;
    flowPosition = flowTarget;
    updateIlluminatedFlow(flowPulsePath, flowPosition);
    flowSecondaryPaths.forEach(function (secondaryPath, index) {
      updateIlluminatedFlow(secondaryPath, Math.max(0, flowPosition - (.035 + index * .02)));
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
  }
  window.addEventListener('scroll', function () {
    updateScrollState();
    document.body.classList.add('is-scrolling');
    window.clearTimeout(scrollStopTimer);
    scrollStopTimer = window.setTimeout(function () { document.body.classList.remove('is-scrolling'); }, 180);
  }, { passive: true });
  updateScrollState();
}());
