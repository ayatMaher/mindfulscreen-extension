import React from 'react';
import { Activity } from '../popup';

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const formatShortTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m` : `${seconds}s`;
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (activities.length === 0) {
    return (
      <div className="activity-card">
        <h3>Recent Activity</h3>
        <div className="empty-state">
          <p>No activities tracked yet</p>
          <p>Browse websites to see your digital habits</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-card">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        <span className="activity-count">{activities.length} items</span>
      </div>
      <div className="activity-list">
        {activities.map((activity) => (
          <div key={activity.id || activity.timestamp} className="activity-item">
            <div className="activity-main">
              <div className="activity-title">{activity.title}</div>
              <div className="activity-badge" style={{ backgroundColor: `${activity.categoryInfo.color}20`, color: activity.categoryInfo.color }}>
                {activity.categoryInfo.emoji} {formatShortTime(activity.duration)}
              </div>
            </div>
            <div className="activity-meta">
              {activity.domain} • {formatTime(activity.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;