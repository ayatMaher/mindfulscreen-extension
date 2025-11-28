import React from 'react';
import { Activity, DailySummary } from '../popup';

interface DataManagerProps {
  activities: Activity[];
  dailySummary: DailySummary | null;
}

const DataManager: React.FC<DataManagerProps> = ({ activities, dailySummary }) => {
  
  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Website', 'Title', 'Category', 'Duration (s)'];
    const csvData = activities.map(activity => [
      new Date(activity.timestamp).toLocaleDateString(),
      new Date(activity.timestamp).toLocaleTimeString(),
      activity.domain,
      activity.title,
      activity.category,
      activity.duration.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    downloadFile(csvContent, 'mindfulscreen-data.csv', 'text/csv');
  };

  const exportToJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      activities: activities,
      summary: dailySummary
    };
    
    downloadFile(
      JSON.stringify(exportData, null, 2),
      'mindfulscreen-data.json',
      'application/json'
    );
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      chrome.storage.local.clear(() => {
        window.location.reload();
      });
    }
  };

  return (
    <div className="data-manager-card">
      <h3>📁 Data Management</h3>
      
      <div className="export-options">
        <div className="export-section">
          <h4>Export Your Data</h4>
          <p>Download your browsing history for analysis</p>
          
          <div className="export-buttons">
            <button className="btn btn-primary" onClick={exportToCSV}>
              📊 Export CSV
            </button>
            <button className="btn btn-primary" onClick={exportToJSON}>
              📝 Export JSON
            </button>
          </div>
          
          <div className="export-stats">
            <div className="stat">
              <span>Activities:</span>
              <strong>{activities.length}</strong>
            </div>
            <div className="stat">
              <span>Total Time:</span>
              <strong>{dailySummary ? Math.floor(dailySummary.totalTime / 60) : 0}m</strong>
            </div>
          </div>
        </div>

        <div className="danger-section">
          <h4>⚠️ Danger Zone</h4>
          <p>Permanently delete all your data</p>
          <button className="btn btn-danger" onClick={clearAllData}>
            🗑️ Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManager;