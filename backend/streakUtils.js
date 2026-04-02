/**
 * Calculates the current consecutive-day streak from a heatmap data Map.
 * Counts backwards from today until a day with 0 sessions is found.
 *
 * @param {Map<string,number>} data  Mongoose Map: { 'YYYY-MM-DD': count }
 * @returns {number}
 */
function calcStreak(data) {
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const count = data.get ? data.get(key) : (data[key] || 0);
    if (count > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

module.exports = { calcStreak };
