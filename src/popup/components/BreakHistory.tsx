import React, { useEffect, useState } from 'react';

interface BreakEvent {
  type: string;
  timestamp: string;
  sessionDuration: number;
  urgencyLevel: string;
  notificationId: string;
  dismissed: boolean;
  actionTaken?: string;
  actionTime?: string;
}

const BreakHistory: React.FC = () => {
  const [breakEvents, setBreakEvents] = useState<BreakEvent[]>([]);

  useEffect(() => {
    loadBreakHistory();
  }, []);

  const loadBreakHistory = async () => {
    const result = await chrome.storage.local.get(['breakEvents']);
    setBreakEvents(result.breakEvents || []);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEmoji = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'urgent': return '⏰';
      default: return '🌿';
    }
  };

  const getActionText = (action?: string) => {
    switch (action) {
      case 'break_started': return 'Break taken';
      case 'snoozed': return 'Snoozed';
      case 'dismissed': return 'Dismissed';
      case 'closed_manually': return 'Closed';
      default: return 'No action';
    }
  };

  return (
    <div className="break-history-card">
      <h3>📝 Break History</h3>
      
      {breakEvents.length === 0 ? (
        <div className="empty-state">
          <p>No break reminders yet</p>
          <p>Break reminders will appear here</p>
        </div>
      ) : (
        <div className="break-history-list">
          {breakEvents.slice().reverse().map((event, index) => (
            <div key={index} className="break-history-item">
              <span className="break-history-emoji">
                {getEmoji(event.urgencyLevel)}
              </span>
              <div className="break-history-content">
                <div>{event.sessionDuration}min session</div>
                <div className="break-history-time">
                  {formatTime(event.timestamp)}
                </div>
              </div>
              <span className="break-history-action">
                {getActionText(event.actionTaken)}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <button 
        className="btn btn-secondary"
        onClick={loadBreakHistory}
        style={{ marginTop: '12px', width: '100%' }}
      >
        🔄 Refresh History
      </button>
    </div>
  );
};

export default BreakHistory;