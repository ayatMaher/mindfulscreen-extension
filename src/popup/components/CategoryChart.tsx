import React from 'react';
import { DailySummary } from '../popup';

interface CategoryChartProps {
  dailySummary: DailySummary;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ dailySummary }) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m` : `${seconds}s`;
  };

  const getCategoryInfo = (category: string) => {
    const info = {
      productive: { emoji: '💼', color: '#10b981', name: 'Productive' },
      social: { emoji: '👥', color: '#3b82f6', name: 'Social' },
      entertainment: { emoji: '🎮', color: '#ef4444', name: 'Entertainment' },
      shopping: { emoji: '🛒', color: '#8b5cf6', name: 'Shopping' },
      news: { emoji: '📰', color: '#f59e0b', name: 'News' },
      other: { emoji: '🌐', color: '#6b7280', name: 'Other' }
    };
    return info[category as keyof typeof info] || info.other;
  };

  return (
    <div className="category-card">
      <h3>Time by Category</h3>
      <div className="category-list">
        {Object.entries(dailySummary.categories)
          .sort(([, a], [, b]) => b - a) // Sort by time descending
          .slice(0, 6) // Take top 6
          .map(([category, time]) => {
            const info = getCategoryInfo(category);
            return (
              <div key={category} className="category-item">
                <div className="category-info">
                  <span className="category-emoji">{info.emoji}</span>
                  <span className="category-name">{info.name}</span>
                </div>
                <div className="category-time">{formatTime(time)}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CategoryChart;