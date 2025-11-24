import React from 'react';
import { DailySummary, UserSettings } from '../popup';

interface GoalsProgressProps {
  dailySummary: DailySummary | null;
  settings: UserSettings;
}

const GoalsProgress: React.FC<GoalsProgressProps> = ({ dailySummary, settings }) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const calculateProgress = (current: number, goal: number): number => {
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  if (!dailySummary) {
    return (
      <div className="goals-card">
        <h3>🎯 Your Goals</h3>
        <div className="empty-state">
          <p>No data yet today</p>
          <p>Start browsing to track progress</p>
        </div>
      </div>
    );
  }

  const productiveMinutes = Math.floor(dailySummary.categories.productive / 60);
  const socialMinutes = Math.floor(dailySummary.categories.social / 60);
  const totalMinutes = Math.floor(dailySummary.totalTime / 60);

  const productiveProgress = calculateProgress(productiveMinutes, settings.goals.dailyProductiveTime);
  const socialProgress = calculateProgress(socialMinutes, settings.goals.maxSocialTime);
  const dailyProgress = calculateProgress(totalMinutes, settings.dailyLimit);

  return (
    <div className="goals-card">
      <h3>🎯 Your Goals Progress</h3>
      
      <div className="goal-item">
        <div className="goal-header">
          <span className="goal-emoji">💼</span>
          <span className="goal-title">Productive Time</span>
          <span className="goal-stats">{productiveMinutes}m / {settings.goals.dailyProductiveTime}m</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill productive-fill"
            style={{ width: `${productiveProgress}%` }}
          ></div>
        </div>
        <div className="goal-percentage">{productiveProgress}%</div>
      </div>

      <div className="goal-item">
        <div className="goal-header">
          <span className="goal-emoji">👥</span>
          <span className="goal-title">Social Media Limit</span>
          <span className="goal-stats">{socialMinutes}m / {settings.goals.maxSocialTime}m</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill social-fill"
            style={{ width: `${socialProgress}%` }}
          ></div>
        </div>
        <div className="goal-percentage">{socialProgress}%</div>
      </div>

      <div className="goal-item">
        <div className="goal-header">
          <span className="goal-emoji">⏰</span>
          <span className="goal-title">Daily Time Limit</span>
          <span className="goal-stats">{totalMinutes}m / {settings.dailyLimit}m</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill daily-fill"
            style={{ width: `${dailyProgress}%` }}
          ></div>
        </div>
        <div className="goal-percentage">{dailyProgress}%</div>
      </div>

      <div className="goals-tips">
        <h4>💡 Tips for Today</h4>
        <ul>
          {productiveProgress < 50 && <li>Try focusing on productive tasks for the next hour</li>}
          {socialProgress > 80 && <li>Consider taking a break from social media</li>}
          {dailyProgress > 80 && <li>You're close to your daily limit. Time for a digital detox!</li>}
          {productiveProgress >= 100 && <li>Great job on hitting your productive goal! 🎉</li>}
        </ul>
      </div>
    </div>
  );
};

export default GoalsProgress;