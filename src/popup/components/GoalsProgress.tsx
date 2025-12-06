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

  // Check if dailySummary exists before accessing its properties
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

  // Now we can safely access dailySummary properties
  const productiveMinutes = Math.floor(dailySummary.categories.productive / 60);
  const socialMinutes = Math.floor(dailySummary.categories.social / 60);
  const entertainmentMinutes = Math.floor(dailySummary.categories.entertainment / 60);
  const shoppingMinutes = Math.floor(dailySummary.categories.shopping / 60);
  const totalMinutes = Math.floor(dailySummary.totalTime / 60);
  const newsMinutes = Math.floor(dailySummary.categories.news / 60);

  const productiveProgress = calculateProgress(productiveMinutes, settings.goals.dailyProductiveTime);
  const socialProgress = calculateProgress(socialMinutes, settings.goals.maxSocialTime);
  const dailyProgress = calculateProgress(totalMinutes, settings.dailyLimit);
  const entertainmentProgress = settings.goals.maxEntertainmentTime ?
    calculateProgress(entertainmentMinutes, settings.goals.maxEntertainmentTime) : 0;
  const shoppingProgress = settings.goals.maxShoppingTime ?
    calculateProgress(shoppingMinutes, settings.goals.maxShoppingTime) : 0;

  return (
    <div className="goals-card">
      <h3>🎯 Your Goals Progress</h3>

      {/* Productive Time Goal - Always show this one */}
      <div className="goal-item">
        <div className="goal-header">
          <span className="goal-emoji">💼</span>
          <span className="goal-title">Productive Time</span>
          <span className="goal-stats">{productiveMinutes}m / {settings.goals.dailyProductiveTime}m</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill productive-fill"
            style={{
              width: `${productiveProgress}%`,
              transition: 'width 0.8s ease-in-out'
            }}
          ></div>
        </div>
        <div className="goal-percentage">{productiveProgress}%</div>
      </div>

      {/* Social Media Limit - Always show this one */}
      <div className="goal-item">
        <div className="goal-header">
          <span className="goal-emoji">👥</span>
          <span className="goal-title">Social Media Limit</span>
          <span className="goal-stats">{socialMinutes}m / {settings.goals.maxSocialTime}m</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill productive-fill"
            style={{
              width: `${productiveProgress}%`,
              transition: 'width 0.8s ease-in-out'
            }}
          ></div>
        </div>
        <div className="goal-percentage">{socialProgress}%</div>
      </div>

      {/* Daily Time Limit - Always show this one */}
      <div className="goal-item">
        <div className="goal-header">
          <span className="goal-emoji">⏰</span>
          <span className="goal-title">Daily Time Limit</span>
          <span className="goal-stats">{totalMinutes}m / {settings.dailyLimit}m</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill productive-fill"
            style={{
              width: `${productiveProgress}%`,
              transition: 'width 0.8s ease-in-out'
            }}
          ></div>
        </div>
        <div className="goal-percentage">{dailyProgress}%</div>
      </div>

      {/* Entertainment Limit - Only show if set */}
      {settings.goals.maxEntertainmentTime && (
        <div className="goal-item">
          <div className="goal-header">
            <span className="goal-emoji">🎮</span>
            <span className="goal-title">Entertainment Limit</span>
            <span className="goal-stats">{entertainmentMinutes}m / {settings.goals.maxEntertainmentTime}m</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill productive-fill"
              style={{
                width: `${productiveProgress}%`,
                transition: 'width 0.8s ease-in-out'
              }}
            ></div>
          </div>
          <div className="goal-percentage">{entertainmentProgress}%</div>
        </div>
      )}

      {/* Shopping Limit - Only show if set */}
      {settings.goals.maxShoppingTime && (
        <div className="goal-item">
          <div className="goal-header">
            <span className="goal-emoji">🛒</span>
            <span className="goal-title">Shopping Limit</span>
            <span className="goal-stats">{shoppingMinutes}m / {settings.goals.maxShoppingTime}m</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill productive-fill"
              style={{
                width: `${productiveProgress}%`,
                transition: 'width 0.8s ease-in-out'
              }}
            ></div>
          </div>
          <div className="goal-percentage">{shoppingProgress}%</div>
        </div>
      )}

      <div className="goals-tips">
        <h4>💡 Tips for Today</h4>
        <ul>
          {productiveProgress < 50 && <li>Try focusing on productive tasks for the next hour</li>}
          {socialProgress > 80 && <li>Consider taking a break from social media</li>}
          {entertainmentProgress > 80 && settings.goals.maxEntertainmentTime && (
            <li>You're approaching your entertainment limit</li>
          )}
          {shoppingProgress > 80 && settings.goals.maxShoppingTime && (
            <li>You're approaching your shopping limit</li>
          )}
          {dailyProgress > 80 && <li>You're close to your daily limit. Time for a digital detox!</li>}
          {productiveProgress >= 100 && <li>Great job on hitting your productive goal! 🎉</li>}
        </ul>
      </div>
    </div>
  );
};

export default GoalsProgress;