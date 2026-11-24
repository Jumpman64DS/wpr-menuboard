// Menu board player for Wentzville (WPR) and Cottleville (CPR). Plain ES5 for older TV browsers.
// WPR is served at the site root and reads schedule.json. CPR is served at cpr/ and reads cpr/schedule.json.
// Options in the URL:  ?test=2027-01-01T12:00 simulates that local time (add &speed=30 to run faster).  ?debug=1 shows the overlay.
(function () {
  var stage = document.getElementById('stage'), dbg = document.getElementById('dbg');
  var q = {}; (location.search.replace('?', '').split('&')).forEach(function (p) { if (p) { var kv = p.split('='); q[kv[0]] = decodeURIComponent(kv[1] || ''); } });
  var TEST = q.test || '', SPEED = parseFloat(q.speed) || 1, T0 = new Date().getTime(), testBase = null;
  if (TEST) { var m = TEST.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/); testBase = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]); }
  if (TEST || q.debug) dbg.style.display = 'block';
  var CPR = /\/cpr(\/|$)/.test(location.pathname);
  var ROOT = CPR ? '../' : '';          // picture paths in the schedule are from the site root
  var STORE = CPR ? 'cpr' : 'wpr';
  var SCHED_KEY = CPR ? 'cprSched' : 'wprSched';
  var sched = null, adIdx = 0, deckPos = 0, lastDeck = '', sinceAd = 0, adSlots = 0, lastFile = '', logArr = [];
  window.__log = logArr;

  function asset(file) { return ROOT + file; }
  function fit() {  // scale the 1920x1080 stage to fill any screen, centered
    var w = window.innerWidth || document.documentElement.clientWidth, h = window.innerHeight || document.documentElement.clientHeight;
    var s = Math.min(w / 1920, h / 1080), x = (w - 1920 * s) / 2, y = (h - 1080 * s) / 2;
    var t = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
    stage.style.webkitTransform = t; stage.style.transform = t;
  }
  fit(); window.onresize = fit;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function now() {  // {date, dow (1=Mon..7=Sun), min since midnight}, in the TV's own time zone (or the simulated time)
    if (testBase !== null) {
      var d = new Date(testBase + (new Date().getTime() - T0) * SPEED);
      return { date: d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()), dow: d.getUTCDay() || 7, min: d.getUTCHours() * 60 + d.getUTCMinutes() };
    }
    var l = new Date();
    return { date: l.getFullYear() + '-' + pad(l.getMonth() + 1) + '-' + pad(l.getDate()), dow: l.getDay() || 7, min: l.getHours() * 60 + l.getMinutes() };
  }
  function mins(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function inList(a, v) { for (var i = 0; i < a.length; i++) { if (a[i] === v) return true; } return false; }

  // Same order as Displai: holiday list first, then the rules top to bottom. First match wins.
  function pickDeck(n) {
    var i, h, r;
    for (i = 0; i < (sched.holidays || []).length; i++) { h = sched.holidays[i];
      if (h.date === n.date && n.min >= mins(h.from) && n.min < mins(h.to)) return { deck: h.deck || 'holiday', why: 'HOLIDAY ' + h.name }; }
    for (i = 0; i < (sched.rules || []).length; i++) { r = sched.rules[i];
      if (inList(r.days, n.dow) && n.min >= mins(r.from) && n.min < mins(r.to)) return { deck: r.deck, why: r.name }; }
    return { deck: null, why: 'outside all windows' };
  }

  function get(url, cb) {
    var x = new XMLHttpRequest(); x.open('GET', url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + new Date().getTime(), true);
    x.onreadystatechange = function () { if (x.readyState === 4) { cb((x.status === 200 || (x.status === 0 && x.responseText)) ? x.responseText : null); } };
    try { x.send(); } catch (e) { cb(null); }
  }
  function loadSchedule(cb) {
    get('schedule.json', function (txt) {
      var ok = false;
      try { var j = JSON.parse(txt); if (j && j.decks && j.rules) { sched = j; ok = true; try { localStorage.setItem(SCHED_KEY, txt); } catch (e) {} } } catch (e) {}
      if (!ok && !sched) { try { var s = localStorage.getItem(SCHED_KEY); if (s) sched = JSON.parse(s); } catch (e) {} }  // keep last good copy
      if (cb) cb();
    });
  }

  // An ad shows only if not "enabled": false, it belongs to this store, and today's month-day is inside its optional "start".."end".
  // "stores" missing means both stores. "MM-DD" windows repeat yearly and may wrap over New Year.
  function forThisStore(a) {
    if (!a.stores || !a.stores.length) return true;
    return inList(a.stores, STORE);
  }
  function adOn(a, md) {
    if (a.enabled === false) { return false; }
    if (!a.start || !a.end) { return true; }
    return a.start <= a.end ? (md >= a.start && md <= a.end) : (md >= a.start || md <= a.end);
  }
  function adsToday(list, date) { var md = date.substring(5), out = [], i; for (i = 0; i < list.length; i++) { if (forThisStore(list[i]) && adOn(list[i], md)) { out.push(list[i]); } } return out; }
  function isVideo(f) { return /\.(mp4|webm)$/i.test(f); }
  var current = null;
  function clearStage() { while (stage.firstChild) { stage.removeChild(stage.firstChild); } current = null; }
  function show(file, done) {   // calls done(true) when shown, done(false) if it failed to load
    var el, fired = false, old = current;
    function fin(ok) { if (fired) { return; } fired = true; clearTimeout(tm);
      if (ok) { stage.appendChild(el); if (old && old.parentNode) { stage.removeChild(old); } current = el; }
      done(ok, el); }
    var tm = setTimeout(function () { fin(false); }, 8000);
    if (isVideo(file)) { el = document.createElement('video'); el.muted = true; el.setAttribute('muted', ''); el.setAttribute('playsinline', ''); el.preload = 'auto';
      el.oncanplay = function () { try { el.play(); } catch (e) {} fin(true); }; el.onerror = function () { fin(false); }; }
    else { el = document.createElement('img'); el.onload = function () { fin(true); }; el.onerror = function () { fin(false); }; }
    el.src = encodeURI(asset(file));
    if (isVideo(file)) { try { el.load(); } catch (e) {} }
  }

  function wait(sec, cb) { document.body.setAttribute('data-log', logArr.join(';')); setTimeout(cb, sec * 1000 / SPEED); }

  function step() {
    if (!sched) { loadSchedule(function () { wait(sched ? 0 : 5, step); }); return; }
    var n = now(), pick = pickDeck(n), item, kind = 'price', deck;
    var stamp = n.date + ' dow' + n.dow + ' ' + pad(Math.floor(n.min / 60)) + ':' + pad(n.min % 60);
    if (!pick.deck || !sched.decks[pick.deck]) {      // outside all windows -> blank (or a deck named in "outsideWindows")
      var out = sched.outsideWindows;
      if (out && out !== 'blank' && sched.decks[out]) { pick = { deck: out, why: 'outside windows -> ' + out }; }
      else { clearStage(); lastDeck = ''; lastFile = ''; dbg.textContent = 'time: ' + stamp + '\ndeck: (blank)  ' + pick.why; logArr.push('blank'); wait(10, step); return; }
    }
    deck = sched.decks[pick.deck];
    if (pick.deck !== lastDeck) { deckPos = 0; sinceAd = 0; lastFile = ''; lastDeck = pick.deck; }
    var adList = deck.ads ? adsToday(sched.ads || [], n.date).concat(adsToday(deck.extraAds || [], n.date)) : null;   // ads that are enabled, for this store, and inside their start/end window today
    var adsOnly = !!deck.adsOnly, hasSlides = deck.slides && deck.slides.length;
    var nxt = (!adsOnly && hasSlides) ? deck.slides[deckPos % deck.slides.length] : null;
    if (adList && adList.length && (adsOnly || sinceAd >= (sched.adEvery || 1))) {
      var rot = sched.menuInRotation, takeMenu = false;
      adSlots++;   // ad spots keep their cadence; showing the menu does not rewind the ad list
      if (rot && rot.file && rot.everyNthAd && adSlots % rot.everyNthAd === 0 && lastFile !== rot.file && (!nxt || nxt.file !== rot.file)) takeMenu = true;
      if (takeMenu) { item = { file: rot.file, seconds: rot.seconds || 10 }; kind = 'menu'; }
      else { item = adList[adIdx++ % adList.length]; kind = 'ad'; }
      sinceAd = 0;
    } else if (hasSlides) { item = deck.slides[deckPos++ % deck.slides.length]; sinceAd++; }
    else { clearStage(); lastFile = ''; dbg.textContent = 'time: ' + stamp + '\ndeck: ' + pick.deck + ' (no slides)'; logArr.push('blank'); wait(10, step); return; }
    lastFile = item.file;
    var secs = item.seconds || (kind === 'ad' ? (sched.adSeconds || 10) : 10), isVid = isVideo(item.file), auto = isVid && !item.seconds;
    dbg.textContent = 'time: ' + stamp + '\ndeck: ' + pick.deck + '  (' + pick.why + ')\nshowing: ' + kind + ' - ' + item.file;
    logArr.push(pick.deck + '|' + kind + '|' + item.file);
    show(item.file, function (ok, el) {
      if (!ok) { logArr.push('SKIPPED ' + item.file); wait(1, step); return; }
      if (auto && el && el.duration && isFinite(el.duration)) { secs = Math.ceil(el.duration * 10) / 10 + 0.2; }   // videos with no "seconds" play to their end
      wait(secs, step); });
  }

  loadSchedule(step);
  setInterval(function () { loadSchedule(); }, 5 * 60 * 1000);      // pick up schedule changes
  if (!TEST) { setInterval(function () { var n = now(); if (n.min === 240) { location.reload(); } }, 60000); }  // refresh page code ~4 AM
  // OPTIONAL offline cache; ignored by browsers that don't support it
  try { if (!TEST && 'serviceWorker' in navigator && /^https?:/.test(location.protocol)) { navigator.serviceWorker.register(asset('sw.js')); } } catch (e) {}
})();
