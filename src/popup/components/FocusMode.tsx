import React, { useState, useEffect } from 'react';

interface FocusModeProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

const FocusMode: React.FC<FocusModeProps> = ({ isActive, onToggle }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Focus session completed
      setIsRunning(false);
      onToggle(false);
      // Show completion notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: '🎉 Focus Session Complete!',
        message: 'Great job! Take a 5-minute break.',
        priority: 2
      });
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onToggle]);

  const startFocusSession = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setIsRunning(true);
    onToggle(true);
  };

  const stopFocusSession = () => {
    setIsRunning(false);
    onToggle(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="focus-card">
      <h3>🎯 Focus Mode</h3>
      
      {!isActive ? (
        <div className="focus-setup">
          <p>Block distracting websites and focus on deep work</p>
          <div className="focus-presets">
            <button 
              className="focus-preset" 
              onClick={() => startFocusSession(25)}
            >
              🍅 25 min
            </button>
            <button 
              className="focus-preset" 
              onClick={() => startFocusSession(50)}
            >
              ⏰ 50 min
            </button>
            <button 
              className="focus-preset" 
              onClick={() => startFocusSession(90)}
            >
              🚀 90 min
            </button>
          </div>
          <div className="focus-custom">
            <input 
              type="number" 
              placeholder="Custom minutes" 
              min="5" 
              max="180"
              className="focus-input"
            />
            <button className="btn btn-primary">Start</button>
          </div>
        </div>
      ) : (
        <div className="focus-active">
          <div className="focus-timer">
            <div className="timer-display">{formatTime(timeLeft)}</div>
            <div className="timer-label">
              {isRunning ? 'Stay focused...' : 'Paused'}
            </div>
          </div>
          
          <div className="focus-controls">
            <button 
              className={`btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? '⏸️ Pause' : '▶️ Resume'}
            </button>
            <button 
              className="btn btn-danger" 
              onClick={stopFocusSession}
            >
              ⏹️ Stop
            </button>
          </div>
          
          <div className="focus-stats">
            <div className="focus-stat">
              <span>Websites Blocked:</span>
              <strong>12</strong>
            </div>
            <div className="focus-stat">
              <span>Focus Streak:</span>
              <strong>3 days</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusMode;