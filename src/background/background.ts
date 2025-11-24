class WellnessTracker {
  private currentTab: chrome.tabs.Tab | null = null;
  private startTime: number = 0;
  private sessionStartTime: number = 0;
  private breakAlarmName = 'break-reminder';

  constructor() {
    console.log('🧠 MindfulScreen Day 3 - Wellness Features Active!');
    this.startTracking();
    this.setupBreakAlarms();
    this.loadUserSettings();
  }

  private async loadUserSettings() {
    // Initialize default settings
    const result = await chrome.storage.local.get(['userSettings']);
    if (!result.userSettings) {
      const defaultSettings = {
        breakInterval: 60, // minutes
        dailyLimit: 240, // minutes (4 hours)
        enableNotifications: true,
        goals: {
          dailyProductiveTime: 120, // minutes
          maxSocialTime: 60 // minutes
        }
      };
      await chrome.storage.local.set({ userSettings: defaultSettings });
    }
  }

  private startTracking() {
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabSwitch(activeInfo.tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        this.handleTabSwitch(tabId);
      }
    });

    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        this.stopTracking();
      } else {
        // Reset session timer when returning to browser
        this.sessionStartTime = Date.now();
      }
    });

    // Track idle time
    chrome.idle.onStateChanged.addListener((newState) => {
      if (newState === 'active') {
        this.sessionStartTime = Date.now();
      }
    });
  }

  private setupBreakAlarms() {
    // Clear any existing alarms
    chrome.alarms.clear(this.breakAlarmName);

    // Create break reminder alarm
    chrome.alarms.create(this.breakAlarmName, {
      delayInMinutes: 1, // Start checking after 1 minute
      periodInMinutes: 1 // Check every minute
    });

    // Handle alarm
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === this.breakAlarmName) {
        this.checkForBreakReminder();
      }
    });
  }

  private async checkForBreakReminder() {
    const settings = await this.getUserSettings();
    if (!settings.enableNotifications) return;

    const sessionDuration = Date.now() - this.sessionStartTime;
    const sessionMinutes = Math.floor(sessionDuration / (1000 * 60));

    // Check if it's time for a break (every X minutes)
    if (sessionMinutes > 0 && sessionMinutes % settings.breakInterval === 0) {
      this.showBreakNotification(sessionMinutes);
    }

    // Check daily limits
    await this.checkDailyLimits();
  }

  private async checkDailyLimits() {
    const today = new Date().toISOString().split('T')[0];
    const key = `daily_${today}`;
    const result = await chrome.storage.local.get([key, 'userSettings']);
    
    const dailyData = result[key];
    const settings = result.userSettings;

    if (!dailyData || !settings) return;

    const totalMinutes = Math.floor(dailyData.totalTime / 60);
    const socialMinutes = Math.floor(dailyData.categories.social / 60);

    // Check daily time limit
    if (totalMinutes >= settings.dailyLimit) {
      this.showLimitNotification('daily', totalMinutes);
    }

    // Check social media limit
    if (socialMinutes >= settings.goals.maxSocialTime) {
      this.showLimitNotification('social', socialMinutes);
    }
  }

  private async showBreakNotification(sessionMinutes: number) {
    const settings = await this.getUserSettings();
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: '🌿 Time for a Break!',
      message: `You've been browsing for ${sessionMinutes} minutes. Take a 5-minute break!`,
      buttons: [
        { title: 'Take 5 min break' }
      ],
      priority: 1
    });

    // Track break reminders
    const breakEvent = {
      type: 'break_reminder',
      timestamp: new Date().toISOString(),
      sessionDuration: sessionMinutes
    };

    const result = await chrome.storage.local.get(['breakEvents']);
    const breakEvents = result.breakEvents || [];
    breakEvents.push(breakEvent);
    if (breakEvents.length > 50) breakEvents.shift();
    await chrome.storage.local.set({ breakEvents });
  }

  private showLimitNotification(type: string, currentMinutes: number) {
    const messages = {
      daily: `You've reached your daily limit of ${currentMinutes} minutes. Consider taking a longer break!`,
      social: `You've spent ${currentMinutes} minutes on social media today. Time to focus!`
    };

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: '🎯 Goal Reminder',
      message: messages[type as keyof typeof messages],
      priority: 1
    });
  }

  private async handleTabSwitch(tabId: number) {
    this.stopTracking();

    chrome.tabs.get(tabId, (tab) => {
      if (tab.url && this.isValidUrl(tab.url)) {
        this.currentTab = tab;
        this.startTime = Date.now();
        
        // Update session start time if this is a new session
        if (!this.sessionStartTime) {
          this.sessionStartTime = Date.now();
        }
      }
    });
  }

  private stopTracking() {
    if (!this.currentTab || !this.startTime) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - this.startTime) / 1000);

    if (duration > 3) {
      this.saveActivity(this.currentTab, duration);
    }

    this.currentTab = null;
    this.startTime = 0;
  }

  private async saveActivity(tab: chrome.tabs.Tab, duration: number) {
    const domain = this.getDomain(tab.url || '');
    const category = this.classifyWebsite(domain);
    const categoryInfo = this.getCategoryInfo(category);

    const activity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: tab.url,
      title: tab.title || 'Unknown Page',
      timestamp: new Date().toISOString(),
      domain: domain,
      category: category,
      duration: duration,
      categoryInfo: categoryInfo
    };

    try {
      // Save activity
      const result = await chrome.storage.local.get(['activities']);
      const activities = result.activities || [];
      activities.push(activity);
      if (activities.length > 20) activities.shift();
      await chrome.storage.local.set({ activities });

      // Update daily summary
      await this.updateDailySummary(category, duration);

      // Check goals
      await this.checkGoals(category, duration);

      console.log(`✅ ${categoryInfo.name} activity: ${domain} (${duration}s)`);
    } catch (error) {
      console.error('❌ Error saving activity:', error);
    }
  }

  private async checkGoals(category: string, duration: number) {
    const today = new Date().toISOString().split('T')[0];
    const key = `daily_${today}`;
    const result = await chrome.storage.local.get([key, 'userSettings', 'achievements']);
    
    const dailyData = result[key];
    const settings = result.userSettings;
    const achievements = result.achievements || [];

    if (!dailyData || !settings) return;

    // Check productive time goal
    const productiveMinutes = Math.floor(dailyData.categories.productive / 60);
    if (productiveMinutes >= settings.goals.dailyProductiveTime) {
      const achievementId = 'productive_goal_met';
      if (!achievements.some((a: any) => a.id === achievementId)) {
        achievements.push({
          id: achievementId,
          type: 'goal_met',
          title: 'Productivity Champion!',
          description: `Completed ${productiveMinutes} minutes of productive time`,
          timestamp: new Date().toISOString(),
          emoji: '🏆'
        });
        await chrome.storage.local.set({ achievements });
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: '🎉 Achievement Unlocked!',
          message: 'You reached your daily productive time goal!',
          priority: 1
        });
      }
    }
  }

  private async updateDailySummary(category: string, duration: number) {
    const today = new Date().toISOString().split('T')[0];
    const key = `daily_${today}`;

    const result = await chrome.storage.local.get([key]);
    const dailyData = result[key] || {
      totalTime: 0,
      categories: {
        productive: 0,
        social: 0,
        entertainment: 0,
        shopping: 0,
        other: 0
      }
    };

    dailyData.totalTime += duration;
    dailyData.categories[category] += duration;

    await chrome.storage.local.set({ [key]: dailyData });
  }

  private async getUserSettings() {
    const result = await chrome.storage.local.get(['userSettings']);
    return result.userSettings || {
      breakInterval: 60,
      dailyLimit: 240,
      enableNotifications: true,
      goals: {
        dailyProductiveTime: 120,
        maxSocialTime: 60
      }
    };
  }

  private classifyWebsite(domain: string): string {
    const domainLower = domain.toLowerCase();
    const productive = ['github.com', 'stackoverflow.com', 'gitlab.com', 'docs.google.com', 'notion.so'];
    const social = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'reddit.com'];
    const entertainment = ['youtube.com', 'netflix.com', 'spotify.com', 'twitch.tv'];
    const shopping = ['amazon.com', 'ebay.com', 'etsy.com'];

    if (productive.some(site => domainLower.includes(site))) return 'productive';
    if (social.some(site => domainLower.includes(site))) return 'social';
    if (entertainment.some(site => domainLower.includes(site))) return 'entertainment';
    if (shopping.some(site => domainLower.includes(site))) return 'shopping';
    return 'other';
  }

  private getCategoryInfo(category: string) {
    const info = {
      productive: { emoji: '💼', color: '#10b981', name: 'Productive' },
      social: { emoji: '👥', color: '#3b82f6', name: 'Social' },
      entertainment: { emoji: '🎮', color: '#ef4444', name: 'Entertainment' },
      shopping: { emoji: '🛒', color: '#8b5cf6', name: 'Shopping' },
      other: { emoji: '🌐', color: '#6b7280', name: 'Other' }
    };
    return info[category as keyof typeof info] || info.other;
  }

  private isValidUrl(url: string): boolean {
    return !url.startsWith('chrome://') && !url.startsWith('about:');
  }

  private getDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // "Take break" button clicked
    chrome.notifications.clear(notificationId);
  }
});

new WellnessTracker();