import React from 'react';
import { DailySummary } from '../popup';

interface WeeklyReportProps {
  weeklyData: DailySummary[];
}

const WeeklyReport: React.FC<WeeklyReportProps> = ({ weeklyData }) => {

  const calculateWeeklyStats = () => {
    const totalTime = weeklyData.reduce((sum, day) => sum + day.totalTime, 0);
    const productiveTime = weeklyData.reduce((sum, day) => sum + day.categories.productive, 0);
    const avgProductivity = totalTime > 0 ? (productiveTime / totalTime) * 100 : 0;

    const daysWithData = weeklyData.filter(day => day.totalTime > 0).length;

    return {
      totalTime: Math.floor(totalTime / 3600), // hours
      productiveTime: Math.floor(productiveTime / 3600),
      avgProductivity: Math.round(avgProductivity),
      daysTracked: daysWithData,
      avgDailyTime: Math.floor(totalTime / (daysWithData || 1) / 60) // minutes
    };
  };

  const stats = calculateWeeklyStats();

  const getProductivityMessage = () => {
    if (stats.avgProductivity >= 70) return "🎉 Excellent productivity this week!";
    if (stats.avgProductivity >= 50) return "👍 Good balance of productive time";
    return "💡 Consider focusing more on productive activities";
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="weekly-report-card">
      <h3>📅 Weekly Report</h3>

      <div className="report-header">
        <div className="week-stats">
          <div className="week-stat">
            <div className="stat-value">{stats.daysTracked}/7</div>
            <div className="stat-label">Days Tracked</div>
          </div>
          <div className="week-stat">
            <div className="stat-value">{stats.totalTime}h</div>
            <div className="stat-label">Total Time</div>
          </div>
          <div className="week-stat">
            <div className="stat-value">{stats.avgProductivity}%</div>
            <div className="stat-label">Productivity</div>
          </div>
        </div>
      </div>

      <div className="productivity-message">
        {getProductivityMessage()}
      </div>

      <div className="daily-breakdown">
        <h4>Daily Summary</h4>
        <div className="days-list">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const dayData = weeklyData[index];
            return (
              <div key={day} className="day-item">
                <span className="day-name">{day}</span>
                <div className="day-bar">
                  {dayData && dayData.totalTime > 0 ? (
                    <>
                      <div
                        className="day-productive"
                        style={{
                          width: `${(dayData.categories.productive / dayData.totalTime) * 100}%`
                        }}
                      ></div>
                      <div
                        className="day-other"
                        style={{
                          width: `${((dayData.totalTime - dayData.categories.productive) / dayData.totalTime) * 100}%`
                        }}
                      ></div>
                    </>
                  ) : (
                    <div className="day-empty"></div>
                  )}
                </div>
                <span className="day-time">
                  {dayData ? formatTime(dayData.totalTime) : '0m'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="weekly-insights">
        <h4>📈 Weekly Insights</h4>
        <ul>
          <li>You spent <strong>{stats.productiveTime}h</strong> on productive activities</li>
          <li>Average <strong>{stats.avgDailyTime}m</strong> per active day</li>
          <li>Tracked <strong>{stats.daysTracked}</strong> out of 7 days</li>
          {stats.avgProductivity > 60 && <li>Great job maintaining high productivity!</li>}
        </ul>
      </div>
    </div>
  );
};

export default WeeklyReport;