// src/popup/components/SmartRecommendations.tsx
import React from 'react';
import { Activity, DailySummary, UserSettings } from '../popup';

interface Recommendation {
  emoji: string;
  title: string;
  message: string;
  type: 'warning' | 'suggestion' | 'break';
}

interface SmartRecommendationsProps {
  activities: Activity[];
  dailySummary: DailySummary | null;
  settings: UserSettings;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  activities,
  dailySummary,
  settings
}) => {
  const getRecommendations = () => {
    const recommendations: Recommendation[] = [];

    if (!dailySummary) return recommendations;

    const socialTime = dailySummary.categories.social;
    const productiveTime = dailySummary.categories.productive;
    const totalTime = dailySummary.totalTime;

    // Social media usage recommendation
    if (socialTime > settings.goals.maxSocialTime * 60) {
      recommendations.push({
        emoji: '👥',
        title: 'Social Media Limit',
        message: `You've spent ${Math.floor(socialTime / 60)}m on social media. Consider taking a break.`,
        type: 'warning'
      });
    }

    // Productivity encouragement
    if (productiveTime < settings.goals.dailyProductiveTime * 60 * 0.5) {
      recommendations.push({
        emoji: '💼',
        title: 'Boost Productivity',
        message: 'Try focusing on productive tasks for the next hour.',
        type: 'suggestion'
      });
    }

    // Break reminder based on recent activity
    const recentActivities = activities.slice(-10);
    const recentDuration = recentActivities.reduce((sum, activity) => sum + activity.duration, 0);
    if (recentDuration > 45 * 60) { // 45 minutes
      recommendations.push({
        emoji: '☕',
        title: 'Time for a Break',
        message: 'You have been browsing for a while. Take a 5-minute break!',
        type: 'break'
      });
    }

    // Daily limit warning
    if (totalTime > settings.dailyLimit * 60 * 0.8) {
      recommendations.push({
        emoji: '⏰',
        title: 'Daily Limit Approaching',
        message: `You've used ${Math.floor(totalTime / 60)}m of your ${settings.dailyLimit}m daily limit.`,
        type: 'warning'
      });
    }

    return recommendations.slice(0, 3); // Max 3 recommendations
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-card">
        <h3>💡 Smart Tips</h3>
        <div className="empty-state">
          <p>Great job! Your digital habits look balanced.</p>
          <p>Keep maintaining this healthy routine!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-card">
      <h3>💡 Smart Recommendations</h3>
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className={`recommendation-item ${rec.type}`}>
            <div className="recommendation-emoji">{rec.emoji}</div>
            <div className="recommendation-content">
              <div className="recommendation-title">{rec.title}</div>
              <div className="recommendation-message">{rec.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartRecommendations;