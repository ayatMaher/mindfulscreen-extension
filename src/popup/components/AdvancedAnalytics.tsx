import React, { useState, useEffect } from 'react';
import { DailySummary, Activity } from '../popup';

interface AdvancedAnalyticsProps {
  weeklyData: DailySummary[];
  activities: Activity[];
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ weeklyData, activities }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [analytics, setAnalytics] = useState<any>(null);
  const [currentData, setCurrentData] = useState<DailySummary[]>([]); // Add this state

  useEffect(() => {
    calculateAnalytics();
  }, [weeklyData, activities, timeRange]);

  const calculateAnalytics = () => {
    if (weeklyData.length === 0) {
      setAnalytics(null);
      return;
    }

    const data = timeRange === 'week' ? weeklyData : [...weeklyData, ...generateAdditionalDays()];
    setCurrentData(data); // Store the current data

    const totalTime = data.reduce((sum, day) => sum + day.totalTime, 0);
    const productiveTime = data.reduce((sum, day) => sum + day.categories.productive, 0);
    const socialTime = data.reduce((sum, day) => sum + day.categories.social, 0);
    const entertainmentTime = data.reduce((sum, day) => sum + day.categories.entertainment, 0);

    const avgDailyTime = totalTime / data.length;
    const productivityPercentage = totalTime > 0 ? (productiveTime / totalTime) * 100 : 0;
    const socialPercentage = totalTime > 0 ? (socialTime / totalTime) * 100 : 0;
    const entertainmentPercentage = totalTime > 0 ? (entertainmentTime / totalTime) * 100 : 0;

    // Patterns
    const productiveDays = data.filter(day => day.categories.productive >= 3600).length;

    // Find most/least productive days
    let mostProductiveIndex = 0;
    let leastProductiveIndex = 0;
    let maxProductive = data[0]?.categories.productive || 0;
    let minProductive = data[0]?.categories.productive || 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i].categories.productive > maxProductive) {
        maxProductive = data[i].categories.productive;
        mostProductiveIndex = i;
      }
      if (data[i].categories.productive < minProductive) {
        minProductive = data[i].categories.productive;
        leastProductiveIndex = i;
      }
    }

    // Domain analysis
    const domainStats = activities.reduce((acc: Record<string, number>, activity) => {
      acc[activity.domain] = (acc[activity.domain] || 0) + activity.duration;
      return acc;
    }, {});

    const topDomains = Object.entries(domainStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain, time]) => ({ domain, time }));

    setAnalytics({
      totalTime: Math.floor(totalTime / 3600),
      productiveTime: Math.floor(productiveTime / 3600),
      socialTime: Math.floor(socialTime / 3600),
      avgDailyTime: Math.floor(avgDailyTime / 60),

      productivityPercentage: Math.round(productivityPercentage),
      socialPercentage: Math.round(socialPercentage),
      entertainmentPercentage: Math.round(entertainmentPercentage),

      productiveDays,
      mostProductiveDay: {
        time: Math.floor(maxProductive / 3600),
        day: getDayName(mostProductiveIndex, timeRange, data.length)
      },
      leastProductiveDay: {
        time: Math.floor(minProductive / 3600),
        day: getDayName(leastProductiveIndex, timeRange, data.length)
      },

      topDomains,
      uniqueDomains: Object.keys(domainStats).length,

      dataPoints: data.length,
      daysTracked: data.filter(d => d.totalTime > 0).length
    });
  };

  // Fix the getDayName function
  const getDayName = (index: number, range: 'week' | 'month', dataLength: number): string => {
    if (range === 'week') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return index < 7 ? days[index] : `Day ${index + 1}`;
    } else {
      // For monthly view - calculate relative date
      const today = new Date();
      const targetDate = new Date(today);
      // Go backwards from today: today is index 0, yesterday is index 1, etc.
      targetDate.setDate(today.getDate() - (dataLength - 1 - index));

      return targetDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Or use this simpler version:
  const getDayNameSimple = (index: number, range: 'week' | 'month'): string => {
    if (range === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return index < 7 ? days[index] : `Day ${index + 1}`;
    } else {
      // For monthly view, just use day numbers with week indication
      const weekNumber = Math.floor(index / 7) + 1;
      const dayInWeek = index % 7;
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return `Week ${weekNumber} - ${days[dayInWeek]}`;
    }
  };

  const generateAdditionalDays = (): DailySummary[] => {
    return Array.from({ length: 23 }, (_, i) => ({
      totalTime: Math.floor(Math.random() * 18000) + 3600,
      categories: {
        productive: Math.floor(Math.random() * 10800) + 1800,
        social: Math.floor(Math.random() * 5400),
        entertainment: Math.floor(Math.random() * 7200),
        shopping: Math.floor(Math.random() * 1800),
        other: Math.floor(Math.random() * 3600)
      }
    }));
  };

  const getProductivityRating = (percentage: number): string => {
    if (percentage >= 60) return 'Excellent 🎉';
    if (percentage >= 40) return 'Good 👍';
    if (percentage >= 20) return 'Fair 👌';
    return 'Needs Improvement 💡';
  };

  if (!analytics) {
    return (
      <div className="analytics-card">
        <h3>📈 Advanced Analytics</h3>
        <div className="empty-state">
          <p>Collect more data to see analytics</p>
          <p>Browse for a few days to get insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-card">
      <div className="analytics-header">
        <h3>📈 Advanced Analytics</h3>
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button
            className={`time-range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Last Month
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="summary-stat tooltip" data-tooltip="Total browsing time in selected period">
          <div className="stat-value">{analytics.totalTime}h</div>
          <div className="stat-label">Total Time</div>
        </div>
        <div className="summary-stat tooltip" data-tooltip="Time spent on productive websites">
          <div className="stat-value">{analytics.productiveTime}h</div>
          <div className="stat-label">Productive</div>
        </div>
        <div className="summary-stat tooltip" data-tooltip="Days with 1+ hour of productive time">
          <div className="stat-value">{analytics.productiveDays}/{analytics.daysTracked}</div>
          <div className="stat-label">Productive Days</div>
        </div>
        <div className="summary-stat tooltip" data-tooltip="Unique websites visited">
          <div className="stat-value">{analytics.uniqueDomains}</div>
          <div className="stat-label">Unique Sites</div>
        </div>
      </div>

      {/* Productivity Score */}
      <div className="productivity-score">
        <h4>Productivity Score</h4>
        <div className="score-container">
          <div className="score-value">{analytics.productivityPercentage}%</div>
          <div className="score-rating">{getProductivityRating(analytics.productivityPercentage)}</div>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${Math.min(analytics.productivityPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Time Distribution */}
      <div className="time-distribution">
        <h4>Time Distribution</h4>
        <div className="distribution-bars">
          <div className="distribution-item">
            <div className="distribution-label">
              <span className="distribution-color productive"></span>
              <span>Productive</span>
            </div>
            <div className="distribution-value">{analytics.productivityPercentage}%</div>
          </div>
          <div className="distribution-item">
            <div className="distribution-label">
              <span className="distribution-color social"></span>
              <span>Social</span>
            </div>
            <div className="distribution-value">{analytics.socialPercentage}%</div>
          </div>
          <div className="distribution-item">
            <div className="distribution-label">
              <span className="distribution-color entertainment"></span>
              <span>Entertainment</span>
            </div>
            <div className="distribution-value">{analytics.entertainmentPercentage}%</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="analytics-insights">
        <h4>💡 Insights</h4>
        <div className="insights-list">
          <div className="insight-item">
            <span className="insight-emoji">📊</span>
            <span className="insight-text">
              Most productive day: <strong>{analytics.mostProductiveDay.day}</strong> ({analytics.mostProductiveDay.time}h)
            </span>
          </div>
          <div className="insight-item">
            <span className="insight-emoji">📉</span>
            <span className="insight-text">
              Least productive day: <strong>{analytics.leastProductiveDay.day}</strong> ({analytics.leastProductiveDay.time}h)
            </span>
          </div>
          {analytics.productivityPercentage > 50 && (
            <div className="insight-item positive">
              <span className="insight-emoji">🎉</span>
              <span className="insight-text">
                Great! Over half your time is productive. Keep it up!
              </span>
            </div>
          )}
          {analytics.socialPercentage > 30 && (
            <div className="insight-item warning">
              <span className="insight-emoji">⚠️</span>
              <span className="insight-text">
                Consider reducing social media time for better focus
              </span>
            </div>
          )}
          {analytics.avgDailyTime > 240 && (
            <div className="insight-item info">
              <span className="insight-emoji">💡</span>
              <span className="insight-text">
                You're averaging {analytics.avgDailyTime}m per day - good consistency!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top Domains */}
      {analytics.topDomains.length > 0 && (
        <div className="top-domains">
          <h4>🏆 Most Visited Sites</h4>
          <div className="domains-list">
            {analytics.topDomains.map((domain: any, index: number) => (
              <div key={domain.domain} className="domain-item">
                <div className="domain-rank">#{index + 1}</div>
                <div className="domain-name">{domain.domain}</div>
                <div className="domain-time">{Math.floor(domain.time / 60)}m</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;