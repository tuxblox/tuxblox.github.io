// Copyright © TuxBlox Project 2026

(function () {
  'use strict';

  function setupSlideshow() {
    var stage = document.querySelector('.showcase-stage');
    var slides = Array.prototype.slice.call(document.querySelectorAll('#slides .slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('#dots .dot-btn'));
    if (!stage || slides.length < 2) return;

    var i = 0;
    var timer = null;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function preload(n) {
      var img = slides[n] && slides[n].querySelector('img[data-src]');
      if (!img) return;
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    }

    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      preload((i + 1) % slides.length);
    }

    function start() {
      if (reduced || timer) return;
      timer = setInterval(function () { go(i + 1); }, 6000);
    }
    function stop() {
      clearInterval(timer);
      timer = null;
    }

    var prev = stage.querySelector('.prev');
    var next = stage.querySelector('.next');
    if (prev) prev.addEventListener('click', function () { go(i - 1); stop(); });
    if (next) next.addEventListener('click', function () { go(i + 1); stop(); });
    dots.forEach(function (d, k) {
      d.addEventListener('click', function () { go(k); stop(); });
    });

    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    stage.addEventListener('focusin', stop);

    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); stop(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); stop(); }
    });

    var x0 = null;
    stage.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX;
      stop();
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    }, { passive: true });

    preload(1);
    start();
  }

  var DISTROS = [
    ['arch', 'Arch Linux'], ['debian', 'Debian'], ['fedora', 'Fedora'], ['ubuntu', 'Ubuntu'],
    ['mint', 'Linux Mint'], ['manjaro', 'Manjaro'], ['nixos', 'NixOS'], ['opensuse', 'openSUSE'],
    ['pop-os', 'Pop!_OS'], ['gentoo', 'Gentoo'], ['kubuntu', 'Kubuntu'],
    ['rockylinux', 'Rocky Linux'], ['almalinux', 'AlmaLinux'], ['zorin-os', 'Zorin OS'],
    ['vanillaos', 'Vanilla OS'], ['mxlinux', 'MX Linux'], ['solus', 'Solus'],
    ['kdeneon', 'KDE neon'], ['deepin', 'deepin']
  ];

  function setupMarquee() {
    var track = document.getElementById('marquee-track');
    if (!track) return;

    var html = DISTROS.map(function (d) {
      return '<img src="/static/images/distros/' + d[0] + '.svg"' +
             ' alt="' + d[1] + '" title="' + d[1] + '" loading="lazy">';
    }).join('');

    track.innerHTML =
      '<div class="marquee-half">' + html + '</div>' +
      '<div class="marquee-half" aria-hidden="true">' + html + '</div>';
  }

  function init() {
    setupSlideshow();
    setupMarquee();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
