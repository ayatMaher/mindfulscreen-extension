import React from 'react';
import { DailySummary } from '../popup';

interface ProductivityAnalyticsProps {
  weeklyData: DailySummary[];
}

const ProductivityAnalytics: React.FC<ProductivityAnalyticsProps> = ({ weeklyData }) => {
  const calculateStats = () => {
    const totalTime = weeklyData.reduce((sum, day) => sum + day.totalTime, 0);
    const productiveTime = weeklyData.reduce((sum, day) => sum + day.categories.productive, 0);
    const avgProductivity = totalTime > 0 ? (productiveTime / totalTime) * 100 : 0;
    
    const bestDay = weeklyData.reduce((best, day) => 
      day.categories.productive > best.categories.productive ? day : best
    );
    
    const peakHours = calculatePeakHours();

    return {
      avgProductivity: Math.round(avgProductivity),
      totalTime,
      productiveTime,
      bestDay,
      peakHours
    };
  };

  const calculatePeakHours = () => {
    // This would come from more detailed time tracking
    return { hour: 14, productivity: 85 }; // 2 PM, 85% productive
  };

  const stats = calculateStats();

  return (
    <div className="analytics-card">
      <h3>📊 Productivity Insights</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.avgProductivity}%</div>
          <div className="stat-label">Avg Productivity</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(stats.productiveTime / 3600)}h</div>
          <div className="stat-label">Productive Time</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.peakHours.hour}:00</div>
          <div className="stat-label">Peak Hour</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(stats.peakHours.productivity)}%</div>
          <div className="stat-label">Peak Productivity</div>
        </div>
      </div>
      
      <div className="insights">
        <h4>💡 This Week's Insights</h4>
        <ul>
          {stats.avgProductivity > 60 && <li>Great job maintaining high productivity!</li>}
          {stats.avgProductivity < 40 && <li>Try focusing on one task at a time to improve productivity</li>}
          <li>Your most productive time is around {stats.peakHours.hour}:00</li>
          <li>Consider scheduling important work during your peak hours</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductivityAnalytics;