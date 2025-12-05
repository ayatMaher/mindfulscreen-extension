import React, { useState, useEffect } from 'react';
import { BackendService } from '../../utils/backendConfig';

interface Achievement {
  _id: string;
  type: string;
  title: string;
  description: string;
  emoji: string;
  earnedAt: string;
  metadata?: any;
}

interface AchievementBadgesProps {
  backendService: BackendService;
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ backendService }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (backendService.isAuthenticated()) {
      loadAchievements();
    }
  }, [backendService]);

  const loadAchievements = async () => {
    if (!backendService.isAuthenticated()) return;

    setLoading(true);
    try {
      // Try to fetch from backend
      const response = await fetch(
        `${backendService['config'].baseUrl}/api/achievements/recent`,
        {
          headers: {
            'Authorization': `Bearer ${backendService['authToken']}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements || []);
      } else {
        // Fallback to local storage if backend fails
        loadLocalAchievements();
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
      loadLocalAchievements();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalAchievements = async () => {
    const result = await chrome.storage.local.get(['achievements']);
    setAchievements(result.achievements || []);
  };

  const getAchievementTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      productivity: '#10b981', // Green
      focus: '#8b5cf6',       // Purple
      'time_management': '#3b82f6', // Blue
      streak: '#f59e0b',      // Amber
      milestone: '#ec4899',   // Pink
      consistency: '#6366f1'  // Indigo
    };
    return colors[type] || '#6b7280'; // Gray default
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      productivity: 'Productivity',
      focus: 'Focus',
      'time_management': 'Time Management',
      streak: 'Streak',
      milestone: 'Milestone',
      consistency: 'Consistency'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!backendService.isAuthenticated()) {
    return (
      <div className="achievements-card">
        <h3>🏆 Achievements</h3>
        <div className="auth-prompt">
          <p>Sign in to unlock achievements and track your progress!</p>
          <div className="achievement-preview">
            <div className="preview-badge locked">
              <span className="badge-emoji">🔒</span>
              <span className="badge-title">Productivity Pro</span>
            </div>
            <div className="preview-badge locked">
              <span className="badge-emoji">🔒</span>
              <span className="badge-title">Focus Master</span>
            </div>
            <div className="preview-badge locked">
              <span className="badge-emoji">🔒</span>
              <span className="badge-title">Weekly Warrior</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="achievements-card">
        <h3>🏆 Achievements</h3>
        <div className="loading-achievements">
          <p>Loading your achievements...</p>
        </div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="achievements-card">
        <h3>🏆 Achievements</h3>
        <div className="empty-achievements">
          <div className="empty-icon">🎯</div>
          <p>No achievements yet!</p>
          <p>Keep browsing productively to earn your first badge.</p>
          <div className="upcoming-achievements">
            <h4>Upcoming Challenges:</h4>
            <ul>
              <li>📚 Read for 2+ hours to earn "Bookworm"</li>
              <li>💼 Complete 5+ productive sessions for "Focus Master"</li>
              <li>🔥 Browse productively for 3 days straight for "Streak Starter"</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-card">
      <div className="achievements-header">
        <h3>🏆 Your Achievements</h3>
        <div className="achievement-count">
          {achievements.length} earned
        </div>
      </div>

      <div className="achievements-stats">
        <div className="stat-item">
          <div className="stat-value">{achievements.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {new Set(achievements.map(a => a.type)).size}
          </div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {formatDate(achievements[0]?.earnedAt || '')}
          </div>
          <div className="stat-label">Latest</div>
        </div>
      </div>

      <div className="achievements-grid">
        {achievements.slice(0, 6).map((achievement) => (
          <div
            key={achievement._id || achievement.title}
            className="achievement-badge"
            style={{
              borderColor: getAchievementTypeColor(achievement.type),
              backgroundColor: `${getAchievementTypeColor(achievement.type)}10`
            }}
          >
            <div className="badge-header">
              <div className="badge-emoji">{achievement.emoji}</div>
              <div className="badge-type" style={{ color: getAchievementTypeColor(achievement.type) }}>
                {getTypeLabel(achievement.type)}
              </div>
            </div>
            <div className="badge-title">{achievement.title}</div>
            <div className="badge-description">{achievement.description}</div>
            <div className="badge-footer">
              <div className="badge-date">{formatDate(achievement.earnedAt)}</div>
              <div className="badge-indicator" style={{ backgroundColor: getAchievementTypeColor(achievement.type) }}></div>
            </div>
          </div>
        ))}
      </div>

      {achievements.length > 6 && (
        <div className="view-all-link">
          <button className="btn-link">
            View all {achievements.length} achievements →
          </button>
        </div>
      )}

      <div className="achievement-tips">
        <h4>💡 Tips to earn more:</h4>
        <ul>
          <li>Complete 2+ hours of productive work in a day</li>
          <li>Maintain a 3-day productive streak</li>
          <li>Limit social media to under 30% of your browsing time</li>
          <li>Start your productive work before 9 AM</li>
        </ul>
      </div>
    </div>
  );
};

export default AchievementBadges;