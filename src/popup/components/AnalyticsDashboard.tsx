// src/popup/components/AnalyticsDashboard.tsx
import React from 'react';
import { Activity, DailySummary } from '../popup';

interface AnalyticsDashboardProps {
  activities: Activity[];
  dailySummary: DailySummary | null;
  weeklyData: DailySummary[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  activities,
  dailySummary,
  weeklyData
}) => {
  const calculateProductivityTrend = () => {
    if (weeklyData.length < 2) return 0;
    
    const recentProductivity = weeklyData[weeklyData.length - 1].categories.productive / 
                             weeklyData[weeklyData.length - 1].totalTime;
    const previousProductivity = weeklyData[weeklyData.length - 2].categories.productive / 
                                weeklyData[weeklyData.length - 2].totalTime;
    
    return ((recentProductivity - previousProductivity) / previousProductivity) * 100;
  };

  const getMostVisitedDomains = () => {
    const domainMap: { [domain: string]: number } = {};
    
    activities.forEach(activity => {
      domainMap[activity.domain] = (domainMap[activity.domain] || 0) + activity.duration;
    });

    return Object.entries(domainMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const calculateAverageSessionLength = () => {
    if (activities.length === 0) return 0;
    
    const totalDuration = activities.reduce((sum, activity) => sum + activity.duration, 0);
    return Math.floor(totalDuration / activities.length);
  };

  const productivityTrend = calculateProductivityTrend();
  const topDomains = getMostVisitedDomains();
  const avgSessionLength = calculateAverageSessionLength();

  return (
    <div className="analytics-card">
      <h3>📈 Advanced Analytics</h3>
      
      <div className="analytics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-emoji">📊</span>
            <span className="metric-title">Productivity Trend</span>
          </div>
          <div className={`metric-value ${productivityTrend >= 0 ? 'positive' : 'negative'}`}>
            {productivityTrend >= 0 ? '+' : ''}{productivityTrend.toFixed(1)}%
          </div>
          <div className="metric-description">
            vs previous period
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-emoji">⏱️</span>
            <span className="metric-title">Avg Session</span>
          </div>
          <div className="metric-value">
            {Math.floor(avgSessionLength / 60)}m {avgSessionLength % 60}s
          </div>
          <div className="metric-description">
            per website visit
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-emoji">🌐</span>
            <span className="metric-title">Unique Sites</span>
          </div>
          <div className="metric-value">
            {new Set(activities.map(a => a.domain)).size}
          </div>
          <div className="metric-description">
            visited today
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-emoji">🔄</span>
            <span className="metric-title">Activity Count</span>
          </div>
          <div className="metric-value">
            {activities.length}
          </div>
          <div className="metric-description">
            tracking sessions
          </div>
        </div>
      </div>

      <div className="top-domains-section">
        <h4>🏆 Top Domains Today</h4>
        <div className="domains-list">
          {topDomains.map(([domain, duration], index) => (
            <div key={domain} className="domain-item">
              <div className="domain-rank">#{index + 1}</div>
              <div className="domain-name">{domain}</div>
              <div className="domain-time">
                {Math.floor(duration / 60)}m {duration % 60}s
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;