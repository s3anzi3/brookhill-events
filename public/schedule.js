// Renders a schedule list for a Brook Hill Events category from window.BHA_SCHEDULE.
(function () {
  function fmtTime(t) {
    return String(t || '').replace(/pm/i, ' PM').replace(/am/i, ' AM').trim();
  }
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  window.renderSchedule = function (containerId, items, accent) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!items || !items.length) {
      el.innerHTML = '<div class="empty">No sessions scheduled yet — check back soon. 🗓️</div>';
      return;
    }
    const today = todayISO();
    el.innerHTML = '';
    items.forEach(function (s, i) {
      const dt = new Date(s.date + 'T00:00:00');
      const weekday = dt.toLocaleDateString('en-US', { weekday: 'long' });
      const month = dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const day = String(dt.getDate());
      const isPast = s.date < today;
      const isToday = s.date === today;

      const a = document.createElement('div');
      a.className = 'slot' + (isPast ? ' past' : '');
      a.style.animationDelay = (Math.min(i, 12) * 0.04) + 's';

      let tag = '';
      if (isToday) tag = '<span class="tag today">● TODAY</span>';
      else if (isPast) tag = '<span class="tag done">Done</span>';

      const loc = (s.loc && s.loc.toLowerCase() !== 'n/a') ? s.loc : 'TBD';

      a.innerHTML =
        '<div class="badge" style="background:linear-gradient(150deg,' + accent + ' 0%, rgba(0,0,0,0.32) 140%);box-shadow:0 4px 18px ' + accent + '40;">' +
          '<div class="m">' + month + '</div><div class="d">' + day + '</div>' +
        '</div>' +
        '<div class="info">' +
          '<div class="wd">' + weekday + '</div>' +
          '<div class="meta"><span>' + fmtTime(s.time) + '</span><span class="dot">·</span><span>📍 ' + loc + '</span></div>' +
          tag +
        '</div>';
      el.appendChild(a);
    });
  };
})();
