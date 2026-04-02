import React, { useMemo } from 'react';
import { getHeatmap } from '../context/AppContext';

function levelClass(n) {
  if (n >= 8) return 'l4';
  if (n >= 5) return 'l3';
  if (n >= 2) return 'l2';
  if (n >= 1) return 'l1';
  return '';
}

export default function Heatmap({ email, weeks = 18 }) {
  const hm = useMemo(() => getHeatmap(email), [email]);

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (weeks * 7 - 1));

    const days = [];
    const cur  = new Date(start);
    while (cur <= today) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }

    const grouped = [];
    for (let i = 0; i < days.length; i += 7) grouped.push(days.slice(i, i + 7));

    let lastMonth = -1;
    const monthLabels = grouped.map((wk, wi) => {
      const m = wk[0].getMonth();
      if (m !== lastMonth) { lastMonth = m; return wk[0].toLocaleString('default', { month: 'short' }); }
      return '';
    });

    return { grid: grouped, monthLabels };
  }, [weeks]);

  const todayStr = new Date().toDateString();

  return (
    <div className="hm-card">
      <div className="hm-title">
        Focus streak
        <span className="hm-title-sub">last {weeks} weeks</span>
      </div>

      {/* Month labels */}
      <div className="hm-months-row">
        {monthLabels.map((lbl, i) => (
          <div key={i} className="hm-month-lbl">{lbl}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="hm-grid">
        {grid.map((week, wi) => (
          <div key={wi} className="hm-week">
            {week.map((day, di) => {
              const key   = day.toISOString().split('T')[0];
              const count = hm[key] || 0;
              const isToday = day.toDateString() === todayStr;
              return (
                <div
                  key={di}
                  className={`hm-cell ${levelClass(count)} ${isToday ? 'today' : ''}`}
                  title={`${key}: ${count} session${count !== 1 ? 's' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="hm-legend">
        <span className="hm-legend-label">Less</span>
        {['', 'l1', 'l2', 'l3', 'l4'].map(cls => (
          <div key={cls} className={`hm-cell ${cls}`} style={{ flexShrink: 0 }} />
        ))}
        <span className="hm-legend-label">More</span>
      </div>
    </div>
  );
}
