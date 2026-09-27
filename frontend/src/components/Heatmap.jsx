import React, { useState, useMemo } from 'react';
import { getHeatmap } from '../context/AppContext';
import '../styles/dashboard.css';

export default function CalendarMonth({ email }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const hm = useMemo(() => getHeatmap(email), [email]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate days for the calendar grid
  const { days, totalSessionsThisMonth } = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let totalMonthCount = 0;
    const daysArray = [];

    // Empty lead cells for offset
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push({ empty: true, id: `empty-${i}` });
    }

    // Actual month days
    for (let d = 1; d <= daysInMonth; d++) {
      // Format as YYYY-MM-DD in local time
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = hm[dateKey] || 0;
      totalMonthCount += count;

      daysArray.push({
        empty: false,
        dayNum: d,
        dateKey,
        count,
        isToday: dateKey === todayStr,
      });
    }

    return { days: daysArray, totalSessionsThisMonth: totalMonthCount };
  }, [year, month, hm, todayStr]);

  // Encouraging message based on monthly focus blocks
  const getEncouragement = (count) => {
    if (count === 0) return "A fresh month & endless potential! Log your first focus block today ☕";
    if (count <= 5) return "Gentle progress underway! You're building great study momentum 🌿";
    if (count <= 15) return "In a fantastic rhythm! Your consistency is blooming ✨";
    return "Unstoppable focus queen! Your dedication is truly inspiring 👑";
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Intensity level helper
  const getIntensityClass = (count) => {
    if (count === 0) return 'intensity-0';
    if (count === 1) return 'intensity-1';
    if (count === 2) return 'intensity-2';
    return 'intensity-3';
  };

  return (
    <div className="calendar-month-card">
      {/* Month Header & Controls */}
      <div className="cal-header">
        <div className="cal-title-wrap">
          <span className="cal-month-title">{monthName} {year}</span>
          <span className="cal-sessions-badge">{totalSessionsThisMonth} focus blocks</span>
        </div>
        <div className="cal-nav-btns">
          <button className="cal-nav-btn" onClick={handleToday} title="Go to Current Month">Today</button>
          <button className="cal-nav-btn" onClick={handlePrevMonth} title="Previous Month">‹</button>
          <button className="cal-nav-btn" onClick={handleNextMonth} title="Next Month">›</button>
        </div>
      </div>

      {/* Days of Week Row */}
      <div className="cal-weekdays-row">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dw) => (
          <div key={dw} className="cal-weekday">{dw}</div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="cal-days-grid">
        {days.map((item, index) => {
          if (item.empty) {
            return <div key={item.id} className="cal-day-cell empty" />;
          }

          const intensityCls = getIntensityClass(item.count);

          return (
            <div
              key={item.dateKey || index}
              className={`cal-day-cell ${intensityCls} ${item.isToday ? 'is-today' : ''}`}
              title={`${item.dateKey}: ${item.count} session${item.count !== 1 ? 's' : ''} completed`}
            >
              <span className="cal-day-num">{item.dayNum}</span>
              {item.count > 0 && <span className="cal-dot-count">{item.count}</span>}
            </div>
          );
        })}
      </div>

      {/* Dynamic Encouraging Message Banner */}
      <div className="cal-encouragement-box">
        <span className="cal-enc-text">{getEncouragement(totalSessionsThisMonth)}</span>
      </div>

      {/* Intensity Legend */}
      <div className="cal-legend-row">
        <span className="cal-legend-label">Less</span>
        <div className="cal-legend-dots">
          <span className="legend-box intensity-0" title="0 sessions" />
          <span className="legend-box intensity-1" title="1 session" />
          <span className="legend-box intensity-2" title="2 sessions" />
          <span className="legend-box intensity-3" title="3+ sessions" />
        </div>
        <span className="cal-legend-label">More</span>
      </div>
    </div>
  );
}
