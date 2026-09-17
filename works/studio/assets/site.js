/* ==========================================================================
   OAK STUDIO — site.js
   header / scroll progress / reveal / hero parallax + waveform /
   ticker / count-up / room switcher / schedule + 更新デモ / flow / form
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- boot */
  window.addEventListener('load', function () { document.body.classList.add('is-ready'); });
  setTimeout(function () { document.body.classList.add('is-ready'); }, 700);

  /* ---------------------------------------------------------------- nav */
  var tog = $('.navtog'), gnav = $('#gnav');
  if (tog && gnav) {
    tog.addEventListener('click', function () {
      var open = gnav.classList.toggle('open');
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      tog.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    gnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        gnav.classList.remove('open');
        tog.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------- header state + progress */
  var hdr = $('.hdr'), bar = $('.progress i'), heroBg = $('.hero__bg');
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset;
    if (hdr) hdr.classList.toggle('is-scrolled', y > 40);
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
    if (heroBg && !reduce && y < window.innerHeight * 1.2) {
      heroBg.style.transform = 'translate3d(0,' + (y * 0.18) + 'px,0)';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------- reveal */
  var revealables = $$('.rv, .memo');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------------------------------------------------------- ticker */
  var tick = $('.ticker__t');
  if (tick) { tick.innerHTML += tick.innerHTML; }

  /* ---------------------------------------------------------------- count-up */
  var nums = $$('[data-count]');
  if (nums.length) {
    var seen = new WeakSet();
    var run = function (el) {
      if (seen.has(el)) return;
      seen.add(el);
      var target = parseFloat(el.getAttribute('data-count'));
      if (reduce) { el.firstChild.nodeValue = String(target); return; }
      var t0 = null, dur = 1100;
      var step = function (t) {
        if (!t0) t0 = t;
        var k = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - k, 3);
        el.firstChild.nodeValue = String(Math.round(target * e));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) run(en.target); });
      }, { threshold: 0.5 });
      nums.forEach(function (el) { io2.observe(el); });
    } else { nums.forEach(run); }
  }

  /* ---------------------------------------------------------------- flow line */
  var flow = $('.flow');
  if (flow && 'IntersectionObserver' in window) {
    var io3 = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { flow.style.setProperty('--fp', '100%'); io3.unobserve(flow); }
      });
    }, { threshold: 0.3 });
    io3.observe(flow);
  }

  /* ---------------------------------------------------------------- waveform */
  var wave = $('.hero__wave canvas');
  if (wave && !reduce) {
    var ctx = wave.getContext('2d'), w = 0, h = 0;
    var visible = true, raf = null, resizeRaf = null;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = wave.parentNode.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      wave.width = w * dpr; wave.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', function () {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(function () { resizeRaf = null; size(); });
    });

    function amp(p, t) {
      // layered sines + slow envelope -> looks like a recorded waveform
      var env = 0.34 + 0.66 * Math.abs(Math.sin(p * 2.1 + t * 0.16));
      var v = Math.sin(p * 41 + t * 1.6) * 0.5
            + Math.sin(p * 97 - t * 2.3) * 0.28
            + Math.sin(p * 17 + t * 0.9) * 0.34
            + Math.sin(p * 233 + t * 3.1) * 0.12;
      return Math.min(1, Math.abs(v) * env);
    }
    function frame(ms) {
      if (!visible) { raf = null; return; }
      raf = requestAnimationFrame(frame);
      var t = ms / 1000;
      ctx.clearRect(0, 0, w, h);
      var mid = h * 0.56, bw = 3, gap = 3, max = h * 0.40;
      for (var x = 0; x < w; x += bw + gap) {
        var p = x / w;
        var a = amp(p, t) * max;
        var fade = Math.min(1, p * 6) * Math.min(1, (1 - p) * 6);
        ctx.fillStyle = 'rgba(230,193,147,' + (0.30 * fade).toFixed(3) + ')';
        ctx.fillRect(x, mid - a, bw, a * 2);
        ctx.fillStyle = 'rgba(192,138,74,' + (0.55 * fade).toFixed(3) + ')';
        ctx.fillRect(x, mid - a * 0.42, bw, a * 0.84);
      }
      // centre line + time ticks
      ctx.fillStyle = 'rgba(230,193,147,.22)';
      ctx.fillRect(0, mid, w, 1);
      ctx.fillStyle = 'rgba(230,193,147,.16)';
      for (var i = 0; i < w; i += 48) ctx.fillRect(i, h - 10, 1, 7);
    }
    function play() { if (!raf) raf = requestAnimationFrame(frame); }
    function pause() { visible = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }
    play();
    var onScreen = true;
    function sync() {
      if (onScreen && !document.hidden) { visible = true; play(); } else { pause(); }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; sync(); })
        .observe(wave.parentNode);
    }
    document.addEventListener('visibilitychange', sync);
  }

  /* ---------------------------------------------------------------- rooms */
  var tabs = $$('.roomtab');
  if (tabs.length) {
    var stage = $('#roomstage'), body = $('#roombody');
    var select = function (i, focus) {
      tabs.forEach(function (t, n) {
        t.setAttribute('aria-selected', n === i ? 'true' : 'false');
        t.setAttribute('tabindex', n === i ? '0' : '-1');
      });
      if (body && tabs[i].id) body.setAttribute('aria-labelledby', tabs[i].id);
      $$('#roomstage img').forEach(function (im, n) { im.classList.toggle('on', n === i); });
      var tag = $('#roomstage .tag');
      if (tag) tag.textContent = tabs[i].getAttribute('data-tag');
      if (body) {
        body.innerHTML = document.getElementById(tabs[i].getAttribute('data-panel')).innerHTML;
        body.classList.remove('roomfade'); void body.offsetWidth; body.classList.add('roomfade');
      }
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    select(0);
  }

  /* ---------------------------------------------------------------- schedule */
  var WD = ['日', '月', '火', '水', '木', '金', '土'];
  var CYCLE = ['○', '△', '×', '-'];
  var CLS = { '○': 'mk-o', '△': 'mk-t', '×': 'mk-x', '-': 'mk-n' };
  var LABEL = { '○': '空きあり', '△': '一部空き', '×': '予約済み', '-': '休業日' };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function today() { var t = new Date(); return ymd(t.getFullYear(), t.getMonth() + 1, t.getDate()); }

  var cal = document.getElementById('schedule-calendar');
  var digest = document.getElementById('schedule-digest');

  if ((cal || digest) && window.SCHEDULE) {
    var months = (function () {
      var set = {}; for (var k in SCHEDULE) set[k.slice(0, 7)] = 1;
      return Object.keys(set).sort();
    })();

    function headRow() {
      var h = '<thead><tr><th scope="col">日付</th>';
      SCHEDULE_ROOMS.forEach(function (r) { h += '<th scope="col">' + r + '</th>'; });
      return h + '</tr></thead>';
    }
    function rowCls(dt, key, marks) {
      var c = [];
      if (dt.getDay() === 0) c.push('sun');
      if (dt.getDay() === 6) c.push('sat');
      if (marks && marks[0] === '-') c.push('off');
      return c.length ? ' class="' + c.join(' ') + '"' : '';
    }
    function cellHtml(key, i, mark, editable) {
      var cls = 'cell ' + (CLS[mark] || 'mk-n');
      if (editable) {
        return '<td><button type="button" class="' + cls + '" data-key="' + key +
          '" data-i="' + i + '" aria-label="' + LABEL[mark] + '（クリックで変更）">' + mark + '</button></td>';
      }
      return '<td><span class="' + cls + '" role="img" aria-label="' + LABEL[mark] + '">' + mark + '</span></td>';
    }

    /* ----- month calendar ----- */
    if (cal) {
      var cur = months.indexOf(today().slice(0, 7)); if (cur < 0) cur = 0;
      var mLabel = document.getElementById('sch-month');
      var prev = document.getElementById('sch-prev');
      var next = document.getElementById('sch-next');
      var upd = document.getElementById('sch-updated');
      if (upd && window.SCHEDULE_UPDATED) upd.textContent = 'LAST UPDATE ' + SCHEDULE_UPDATED.replace(/-/g, '.');

      function renderMonth() {
        var editing = !!(demo && demo.checked);
        var ym = months[cur], y = +ym.slice(0, 4), m = +ym.slice(5, 7);
        var last = new Date(y, m, 0).getDate();
        var h = '<table class="sch">' + headRow() + '<tbody>';
        for (var d = 1; d <= last; d++) {
          var key = ymd(y, m, d), dt = new Date(y, m - 1, d);
          var marks = SCHEDULE[key] || ['-', '-', '-'];
          h += '<tr' + rowCls(dt, key, marks) + '><th scope="row"><span class="d">' + pad(d) +
            '</span><span class="w">' + WD[dt.getDay()] + '</span></th>';
          for (var i = 0; i < SCHEDULE_ROOMS.length; i++) h += cellHtml(key, i, marks[i], editing);
          h += '</tr>';
        }
        cal.innerHTML = h + '</tbody></table>';
        mLabel.textContent = y + '.' + pad(m);
        prev.disabled = (cur === 0);
        next.disabled = (cur === months.length - 1);
        cal.firstChild.classList.add('roomfade');
      }
      prev.addEventListener('click', function () { if (cur > 0) { cur--; renderMonth(); } });
      next.addEventListener('click', function () { if (cur < months.length - 1) { cur++; renderMonth(); } });
      renderMonth();

      /* ----- 更新デモ ----- */
      var demo = document.getElementById('demo-switch');
      var code = document.getElementById('codebox');
      var wrapEl = document.getElementById('schedule-calendar');

      function paintCode(hotKey) {
        if (!code) return;
        var keys = Object.keys(SCHEDULE).sort();
        var at = hotKey ? keys.indexOf(hotKey) : 0;
        var from = Math.max(0, at - 3), rows = keys.slice(from, from + 7);
        var out = '<span class="fn">assets/schedule-data.js</span>';
        out += '<span class="row c">/* ○ 空き ／ △ 一部空き ／ × 予約済み ／ - 休業 */</span>';
        rows.forEach(function (k) {
          var v = SCHEDULE[k].map(function (x) { return '"' + x + '"'; }).join(',');
          out += '<span class="row' + (k === hotKey ? ' hot' : '') + '">  <span class="k">"' + k +
            '"</span>: [<span class="v">' + v + '</span>],</span>';
        });
        code.innerHTML = out;
      }
      paintCode(null);

      if (demo) {
        demo.addEventListener('change', function () {
          wrapEl.classList.toggle('is-editable', demo.checked);
          renderMonth();
        });
      }
      cal.addEventListener('click', function (e) {
        var b = e.target.closest('.cell');
        if (!b || !demo || !demo.checked) return;
        var key = b.getAttribute('data-key'), i = +b.getAttribute('data-i');
        if (!SCHEDULE[key]) return;
        var nextMark = CYCLE[(CYCLE.indexOf(SCHEDULE[key][i]) + 1) % CYCLE.length];
        SCHEDULE[key][i] = nextMark;
        b.textContent = nextMark;
        b.className = 'cell ' + CLS[nextMark] + ' bump';
        b.setAttribute('aria-label', LABEL[nextMark] + '（クリックで変更）');
        setTimeout(function () { b.classList.remove('bump'); }, 420);
        paintCode(key);
      });
    }

    /* ----- TOP digest (直近7日) ----- */
    if (digest) {
      var keys = Object.keys(SCHEDULE).sort(), t = today(), from = 0;
      for (var i2 = 0; i2 < keys.length; i2++) { if (keys[i2] >= t) { from = i2; break; } }
      var slice = keys.slice(from, from + 7);
      var hh = '<table class="sch">' + headRow() + '<tbody>';
      slice.forEach(function (k) {
        var p = k.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
        hh += '<tr' + rowCls(dt, k, SCHEDULE[k]) + '><th scope="row"><span class="d">' +
          (+p[1]) + '/' + pad(+p[2]) + '</span><span class="w">' + WD[dt.getDay()] + '</span></th>';
        SCHEDULE[k].forEach(function (mk, i3) { hh += cellHtml(k, i3, mk, false); });
        hh += '</tr>';
      });
      digest.innerHTML = hh + '</tbody></table>';
      var du = document.getElementById('digest-updated');
      if (du && window.SCHEDULE_UPDATED) du.textContent = 'LAST UPDATE ' + SCHEDULE_UPDATED.replace(/-/g, '.');
    }
  }

  /* ---------------------------------------------------------------- form */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var msg = document.getElementById('form-msg');
      msg.hidden = false;
      msg.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      form.reset();
    });
  }

  /* ---------------------------------------------------------------- misc */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
