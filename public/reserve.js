// Brook Hill Events — roster-verified reservations.
//
// Reuses the disco app's deployed `verifyStudent` Cloud Function and the shared
// `brookhill-disco-2026` Firestore. A student reserving a session enters their
// first name + date of birth (+ optional group); we verify SERVER-SIDE against
// the roster (which never reaches the browser) and, on a match, write a doc at
//     sessions/{sessionId}/rsvps/{studentId}
// Live "going" counts come from one collectionGroup('rsvps') listener.
//
// Consumed by: recreation.html / social-rooms.html (init + reserve), the staff
// dashboard (initDb + its own query) and my-reservations.html (identify + cancel).
(function () {
  var GROUPS = ['1C-NIA', '1G'];

  var BHA = window.BHAReserve = {
    category: '',          // set by each schedule page before init()
    _db: null,
    _functions: null,
    _counts: {},           // sessionId -> going count
    _mine: {},             // sessionId -> true if this student is going
    _verifying: false,
    _pending: null,        // session meta awaiting verification (reserve mode)
    _mode: 'reserve',      // 'reserve' | 'identify'
    _onId: null,           // callback for identify mode
  };

  // ── stable per-session id (must match the one schedule.js renders) ──
  BHA.sessionId = function (category, date, time) {
    return category + '_' + date + '_' + String(time || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // ── remembered check-in (shared key with the disco app) ──
  function remembered() {
    try { return JSON.parse(localStorage.getItem('bha_checked_in_student') || 'null'); }
    catch (e) { return null; }
  }
  function remember(stu) {
    try { localStorage.setItem('bha_checked_in_student', JSON.stringify(stu)); } catch (e) {}
  }
  BHA.current = function () { return remembered(); };

  // ── Firebase ──
  // initDb(): just connect (staff dashboard / my-reservations run their own queries).
  BHA.initDb = function () {
    try {
      if (typeof firebase === 'undefined' || !window.BHA_FIREBASE_CONFIG) return false;
      if (!firebase.apps.length) firebase.initializeApp(window.BHA_FIREBASE_CONFIG);
      BHA._db = firebase.firestore();
      BHA._functions = firebase.functions();
      return true;
    } catch (e) { console.warn('Reserve init:', e); return false; }
  };

  // init(category): connect + live counts for a schedule page.
  BHA.init = function (category) {
    BHA.category = category;
    if (BHA.initDb()) BHA._subscribe();
  };

  // One collection-group listener feeds every session's count on this page.
  BHA._subscribe = function () {
    if (!BHA._db) return;
    var mySid = (remembered() || {}).studentId || null;
    BHA._db.collectionGroup('rsvps').onSnapshot(function (snap) {
      var counts = {}, mine = {};
      snap.forEach(function (doc) {
        var d = doc.data() || {};
        if (d.category !== BHA.category || !d.sessionId) return; // ignore disco rsvps
        if (d.status === 'going') {
          counts[d.sessionId] = (counts[d.sessionId] || 0) + 1;
          if (mySid && doc.id === mySid) mine[d.sessionId] = true;
        }
      });
      BHA._counts = counts;
      BHA._mine = mine;
      BHA._renderCounts();
    }, function (err) { console.warn('rsvp snapshot:', err); });
  };

  BHA._renderCounts = function () {
    document.querySelectorAll('[data-rsvp]').forEach(function (slot) {
      var sid = slot.getAttribute('data-rsvp');
      var n = BHA._counts[sid] || 0;
      var mine = !!BHA._mine[sid];
      var cnt = slot.querySelector('.rsvp-cnt');
      var btn = slot.querySelector('.rsvp-btn');
      if (cnt) cnt.textContent = '👥 ' + n + ' going';
      if (btn) {
        btn.classList.toggle('in', mine);
        btn.textContent = mine ? "✓ You're in" : 'Reserve a spot';
      }
    });
  };

  // ── low-level write ──
  BHA._write = function (sid, category, meta, stu, status) {
    if (!BHA._db) return Promise.reject(new Error('offline'));
    return BHA._db.collection('sessions').doc(sid).collection('rsvps').doc(stu.studentId).set({
      status: status,
      name: stu.name,
      group: stu.group || '',
      studentId: stu.studentId,
      sessionId: sid,
      category: category,
      date: meta.date,
      time: meta.time || '',
      loc: meta.loc || '',
      at: new Date().toISOString()
    });
  };

  // ── reserve / cancel ──
  // Called by the schedule list. Toggles: if already in → cancel; else reserve.
  BHA.toggle = function (session) {
    var sid = BHA.sessionId(BHA.category, session.date, session.time);
    var stu = remembered();
    if (stu && stu.studentId) {
      var goin = BHA._mine[sid];
      BHA._write(sid, BHA.category, session, stu, goin ? 'declined' : 'going')
        .then(function () { toast(goin ? 'Reservation cancelled' : "You're in! 🎉"); })
        .catch(function () { toast('Something went wrong — try again', true); });
      return;
    }
    BHA._openModal(session, 'reserve');
  };

  // Cancel a reservation given its stored rsvp record (My Reservations page).
  BHA.cancel = function (r) {
    var stu = remembered();
    if (!stu || !stu.studentId) return Promise.reject(new Error('no-id'));
    return BHA._write(r.sessionId, r.category, { date: r.date, time: r.time, loc: r.loc }, stu, 'declined');
  };

  // Identify-only check-in (no session) — used by My Reservations.
  BHA.identify = function (onDone) {
    var stu = remembered();
    if (stu && stu.studentId) { if (onDone) onDone(stu); return; }
    BHA._onId = onDone || null;
    BHA._openModal(null, 'identify');
  };

  // ── check-in modal ──
  BHA._openModal = function (session, mode) {
    BHA._pending = session;
    BHA._mode = mode || 'reserve';
    var m = document.getElementById('bha-modal');
    m.querySelector('#bm-first').value = '';
    m.querySelector('#bm-dob').value = '';
    m.querySelector('#bm-group').value = '';
    BHA._setErr('');
    var title = m.querySelector('.bm-title');
    var when = m.querySelector('#bm-when');
    var note = m.querySelector('.bm-note');
    var go = m.querySelector('#bm-go');
    if (BHA._mode === 'identify') {
      title.textContent = 'Check in';
      when.textContent = '';
      note.textContent = 'Check in against the camp roster to see your reservations.';
      go.textContent = 'Check in';
    } else {
      title.textContent = 'Reserve a spot';
      var dt = new Date(session.date + 'T00:00:00');
      when.textContent = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) +
        ' · ' + (session.time || '');
      note.textContent = 'Check in against the camp roster so we know who’s coming.';
      go.textContent = 'Reserve my spot';
    }
    m.classList.add('open');
    setTimeout(function () { m.querySelector('#bm-first').focus(); }, 60);
  };
  BHA._closeModal = function () {
    var m = document.getElementById('bha-modal');
    if (m) m.classList.remove('open');
    BHA._pending = null;
  };
  BHA._setErr = function (msg) {
    var e = document.getElementById('bm-err');
    if (e) { e.textContent = msg || ''; e.style.display = msg ? 'block' : 'none'; }
  };

  BHA._submit = function () {
    if (BHA._verifying) return;
    if (BHA._mode === 'reserve' && !BHA._pending) return;
    var m = document.getElementById('bha-modal');
    var first = m.querySelector('#bm-first').value.trim();
    var dob = m.querySelector('#bm-dob').value;
    var group = m.querySelector('#bm-group').value;
    if (!first) { BHA._setErr('Enter your first name'); return; }
    if (!dob) { BHA._setErr('Pick your date of birth'); return; }
    if (!BHA._functions) { BHA._setErr('Check-in is offline right now — please see a chaperone.'); return; }
    BHA._verifying = true;
    BHA._setErr('Checking the roster…');
    BHA._functions.httpsCallable('verifyStudent')({ first: first, dob: dob, group: group })
      .then(function (res) {
        var data = (res && res.data) || {};
        BHA._verifying = false;
        if (!data.match) {
          BHA._setErr("We couldn't find you on the roster. Double-check your name, group and date of birth — or see a chaperone.");
          return;
        }
        var stu = { name: data.firstName || first, studentId: data.studentId, group: data.group || group || '' };
        remember(stu);
        if (BHA._mode === 'identify') {
          var cb = BHA._onId; BHA._onId = null;
          BHA._closeModal();
          if (cb) cb(stu);
          return;
        }
        var session = BHA._pending;
        BHA._closeModal();
        BHA._write(BHA.sessionId(BHA.category, session.date, session.time), BHA.category, session, stu, 'going')
          .then(function () { toast("You're in! 🎉"); })
          .catch(function () { toast('Saved your check-in, but reserving failed — try again', true); });
      })
      .catch(function (e) {
        console.warn('verifyStudent:', e);
        BHA._verifying = false;
        BHA._setErr('Check-in failed — check your connection and try again.');
      });
  };

  // ── tiny toast ──
  function toast(msg, isErr) {
    var t = document.getElementById('bha-toast');
    if (!t) { t = document.createElement('div'); t.id = 'bha-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = 'show' + (isErr ? ' err' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.className = ''; }, 2600);
  }
  BHA.toast = toast;

  // ── inject modal markup once ──
  function injectModal() {
    if (document.getElementById('bha-modal')) return;
    var opts = GROUPS.map(function (g) { return '<option value="' + g + '">' + g + '</option>'; }).join('');
    var div = document.createElement('div');
    div.id = 'bha-modal';
    div.innerHTML =
      '<div class="bm-card">' +
        '<div class="bm-title">Reserve a spot</div>' +
        '<div class="bm-when" id="bm-when"></div>' +
        '<p class="bm-note">Check in against the camp roster so we know who’s coming.</p>' +
        '<label class="bm-lab">First name</label>' +
        '<input id="bm-first" class="bm-in" type="text" autocomplete="given-name" placeholder="Your first name">' +
        '<label class="bm-lab">Date of birth</label>' +
        '<input id="bm-dob" class="bm-in" type="date">' +
        '<label class="bm-lab">Group <span class="bm-opt">(optional)</span></label>' +
        '<select id="bm-group" class="bm-in"><option value="">Select your group…</option>' + opts + '</select>' +
        '<div id="bm-err" class="bm-err"></div>' +
        '<button id="bm-go" class="bm-go">Reserve my spot</button>' +
        '<button id="bm-cancel" class="bm-cancel">Cancel</button>' +
      '</div>';
    document.body.appendChild(div);
    div.addEventListener('click', function (e) { if (e.target === div) BHA._closeModal(); });
    document.getElementById('bm-go').addEventListener('click', BHA._submit);
    document.getElementById('bm-cancel').addEventListener('click', BHA._closeModal);
    document.getElementById('bm-dob').addEventListener('keydown', function (e) { if (e.key === 'Enter') BHA._submit(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectModal);
  else injectModal();
})();
