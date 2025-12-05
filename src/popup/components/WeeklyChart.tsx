import React from 'react';
import { DailySummary } from '../popup';

interface WeeklyChartProps {
  weeklyData: DailySummary[];
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ weeklyData }) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h` : `${minutes}m`;
  };

  const getMaxTime = () => {
    return Math.max(...weeklyData.map(day => day.totalTime), 1);
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="chart-card">
      <h3>📈 Weekly Overview</h3>
      <div className="chart-container">
        {weeklyData.map((day, index) => {
          const percentage = (day.totalTime / getMaxTime()) * 100;
          const productivePercentage = day.categories.productive > 0
            ? (day.categories.productive / day.totalTime) * 100
            : 0;

          return (
            <div key={index} className="chart-bar-container">
              <div className="chart-bar-label">{days[index]}</div>
              <div className="chart-bar">
                <div
                  className="chart-bar-productive"
                  style={{ height: `${percentage * 0.7}%` }}
                  title={`Productive: ${formatTime(day.categories.productive)}`}
                ></div>
                <div
                  className="chart-bar-other"
                  style={{ height: `${percentage * 0.3}%` }}
                  title={`Other: ${formatTime(day.totalTime - day.categories.productive)}`}
                ></div>
              </div>
              <div className="chart-bar-time">{formatTime(day.totalTime)}</div>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color productive"></div>
          <span>Productive</span>
        </div>
        <div className="legend-item">
          <div className="legend-color other"></div>
          <span>Other</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyChart;