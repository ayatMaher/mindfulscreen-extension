import React from 'react';
import { DailySummary } from '../popup';

interface StatsCardsProps {
  dailySummary: DailySummary | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ dailySummary }) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProductivityScore = (): number => {
    if (!dailySummary) return 0;

    const productiveTime = dailySummary.categories.productive;
    const totalTime = dailySummary.totalTime;

    return totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
  };

  if (!dailySummary) {
    return (
      <div className="stats-cards">
        <div className="summary-card">
          <h3>Today's Summary</h3>
          <div className="empty-state">
            <p>No data collected yet today</p>
            <p>Start browsing to see your stats</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-cards">
      <div className="summary-card gradient-bg">
        <h3>Today's Summary</h3>
        <div className="stats-grid">
          <div className="stat">
            <div className="stat-label">Total Time</div>
            <div className="stat-value">{formatTime(dailySummary.totalTime)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Productivity</div>
            <div className="stat-value">{getProductivityScore()}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;