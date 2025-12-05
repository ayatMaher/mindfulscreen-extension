﻿import { BackendService, defaultBackendConfig } from '../utils/backendConfig';

class SyncManager {
  private backendService: BackendService;

  constructor() {
    this.backendService = new BackendService(defaultBackendConfig);
    this.setupSyncAlarm();
  }

  private setupSyncAlarm() {
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name === 'syncData') {
        await this.performSync();
      }
    });
  }

  private async performSync() {
    if (!this.backendService.isAuthenticated()) return;

    const today = new Date().toISOString().split('T')[0];
    const result = await chrome.storage.local.get(['activities', `daily_${today}`, 'userSettings']);

    try {
      const success = await this.backendService.syncData(
        result.activities || [],
        {
          dailySummary: result[`daily_${today}`] || null,
          settings: result.userSettings || null
        }
      );

      if (success) {
        console.log('✅ Auto-sync completed successfully');
        const now = new Date().toLocaleTimeString();
        await chrome.storage.local.set({ lastSyncTime: now });
      } else {
        console.warn('⚠️ Auto-sync failed');
      }
    } catch (error) {
      console.error('❌ Auto-sync error:', error);
    }
  }

  async syncNow() {
    return this.performSync();
  }
}

class WellnessTracker {
  private currentTab: chrome.tabs.Tab | null = null;
  private startTime: number = 0;
  private sessionStartTime: number = 0;
  private breakAlarmName = 'break-reminder';
  private syncManager: SyncManager | null = null;

  constructor() {
    console.log('🧠 MindfulScreen - Wellness Features Active!');
    this.startTracking();
    this.setupBreakAlarms();
    this.loadUserSettings();

    // Initialize sync manager
    this.syncManager = new SyncManager();
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
          maxSocialTime: 60, // minutes
          maxEntertainmentTime: 120,
          maxShoppingTime: 60
        },
        detailedTracking: false,
        analyticsEnabled: true,
        achievementNotifications: true,
        weeklyReports: true
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
    if (!settings.enableNotifications ||
      !settings.notificationSettings?.breakReminders) return;

    const sessionDuration = Date.now() - this.sessionStartTime;
    const sessionMinutes = Math.floor(sessionDuration / (1000 * 60));

    // Check if we're in scheduled break hours
    if (settings.breakSchedule?.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [startHour, startMinute] = settings.breakSchedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = settings.breakSchedule.endTime.split(':').map(Number);
      // Skip weekends if disabled
      if (!settings.breakSchedule.weekendsEnabled) {
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        if (day === 0 || day === 6) return;
      }
      // Check if within schedule
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      if (currentTimeInMinutes < startTimeInMinutes ||
        currentTimeInMinutes > endTimeInMinutes) {
        return; // Outside of scheduled hours
      }
    }
    // Check break interval
    const breakInterval = settings.breakInterval || 60;
    if (sessionMinutes > 0 && sessionMinutes % breakInterval === 0) {
      // Skip if user snoozed recently
      const lastSnooze = await this.getLastSnoozeTime();
      if (lastSnooze && (Date.now() - lastSnooze) < (settings.notificationSettings?.snoozeDuration || 5) * 60 * 1000) {
        return;
      }

      this.showBreakNotification(sessionMinutes, breakInterval);
    }

    // Check daily limits
    await this.checkDailyLimits();
  }

  private async getLastSnoozeTime(): Promise<number | null> {
    const result = await chrome.storage.local.get(['lastSnoozeTime']);
    return result.lastSnoozeTime || null;
  }
  private async checkDailyLimits() {
    const today = new Date().toISOString().split('T')[0];
    const key = `daily_${today}`;
    const result = await chrome.storage.local.get([key, 'userSettings', 'lastLimitNotification']);

    const dailyData = result[key];
    const settings = result.userSettings;
    const lastNotification = result.lastLimitNotification || {};


    if (!dailyData || !settings || !settings.notificationSettings?.dailyLimits) return;

    const totalMinutes = Math.floor(dailyData.totalTime / 60);
    const socialMinutes = Math.floor(dailyData.categories.social / 60);
    const entertainmentMinutes = Math.floor(dailyData.categories.entertainment / 60);
    const shoppingMinutes = Math.floor(dailyData.categories.shopping / 60);

    // Check daily time limit with thresholds
    const thresholds = [0.5, 0.8, 0.9, 1.0]; // 50%, 80%, 90%, 100%
    thresholds.forEach(threshold => {
      const limitMinutes = settings.dailyLimit * threshold;
      if (totalMinutes >= limitMinutes &&
        totalMinutes < limitMinutes + 1 && // Prevent repeated notifications
        (!lastNotification.daily || lastNotification.daily < limitMinutes)) {

        let message = '';
        if (threshold === 0.5) message = `You've used 50% of your daily limit (${totalMinutes}m)`;
        else if (threshold === 0.8) message = `You're approaching your daily limit (${totalMinutes}m)`;
        else if (threshold === 0.9) message = `You're very close to your daily limit (${totalMinutes}m)`;
        else if (threshold === 1.0) message = `You've reached your daily limit of ${totalMinutes} minutes!`;

        this.showLimitNotification('daily', message, threshold === 1.0);

        // Update last notification time
        lastNotification.daily = limitMinutes;
        chrome.storage.local.set({ lastLimitNotification: lastNotification });
      }
    });

    // // Check daily time limit
    // if (totalMinutes >= settings.dailyLimit) {
    //   this.showLimitNotification('daily', totalMinutes);
    // }

    // // Check social media limit
    // if (socialMinutes >= (settings.goals.maxSocialTime || 60)) {
    //   this.showLimitNotification('social', socialMinutes);
    // }

    // // Check entertainment limit (if set)
    // if (settings.goals.maxEntertainmentTime && 
    //     entertainmentMinutes >= settings.goals.maxEntertainmentTime) {
    //   this.showLimitNotification('entertainment', entertainmentMinutes);
    // }

    // // Check shopping limit (if set)
    // if (settings.goals.maxShoppingTime && 
    //     shoppingMinutes >= settings.goals.maxShoppingTime) {
    //   this.showLimitNotification('shopping', shoppingMinutes);
    // }
  }

  private async showBreakNotification(sessionMinutes: number, breakInterval: number) {
    const settings = await this.getUserSettings();

    let urgencyLevel = 'normal';
    let title = '🌿 Time for a Break!';
    let message = `You've been browsing for ${sessionMinutes} minutes. Take a 5-minute break!`;

    if (sessionMinutes >= breakInterval * 2) {
      urgencyLevel = 'urgent';
      title = '⏰ Extended Session Alert';
      message = `You've been browsing for ${sessionMinutes} minutes. Please take a longer break!`;
    } else if (sessionMinutes >= breakInterval * 3) {
      urgencyLevel = 'critical';
      title = '🚨 Extended Focus Required!';
      message = `${sessionMinutes} minutes of continuous browsing. Time for a significant break!`;
    }
    // Create notification with enhanced buttons
    const notificationId = `break-reminder-${Date.now()}`;
    const buttons: chrome.notifications.ButtonOptions[] = [
      { title: 'Take 5 min break' },
      { title: 'Snooze 10 min' },
      { title: 'Dismiss' }
    ];

    if (settings.notificationSettings?.urgentMode && urgencyLevel === 'critical') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: title,
        message: message,
        buttons: buttons,
        priority: 2,
        requireInteraction: true
      });
    } else {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: title,
        message: message,
        buttons: buttons,
        priority: urgencyLevel === 'normal' ? 0 : 1
      });
    }
    // Track break reminders
    const breakEvent = {
      type: 'break_reminder',
      timestamp: new Date().toISOString(),
      sessionDuration: sessionMinutes,
      urgencyLevel: urgencyLevel,
      notificationId: notificationId,
      dismissed: false
    };

    const result = await chrome.storage.local.get(['breakEvents']);
    const breakEvents = result.breakEvents || [];
    breakEvents.push(breakEvent);
    if (breakEvents.length > 50) breakEvents.shift();
    await chrome.storage.local.set({ breakEvents });
  }

  private showLimitNotification(type: string, message: string, isUrgent: boolean = false) {
    const titles = {
      daily: '⏰ Daily Limit',
      social: '👥 Social Media',
      entertainment: '🎮 Entertainment',
      shopping: '🛒 Shopping'
    };

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: titles[type as keyof typeof titles] || 'Limit Alert',
      message: message,
      priority: isUrgent ? 2 : 1,
      buttons: isUrgent ? [{ title: 'Take Action' }] : undefined
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

      // Trigger sync if enabled
      await this.triggerSyncIfNeeded();

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
        maxSocialTime: 60,
        maxEntertainmentTime: 120,
        maxShoppingTime: 60
      },
      detailedTracking: false,
      analyticsEnabled: true,
      achievementNotifications: true,
      weeklyReports: true
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

  private async triggerSyncIfNeeded() {
    if (!this.syncManager) return;

    try {
      const syncSettings = await chrome.storage.local.get(['syncSettings']);
      if (syncSettings.syncSettings?.enabled) {
        this.syncManager.syncNow();
      }
    } catch (error) {
      console.error('Sync trigger failed:', error);
    }
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);

  // If it's a break reminder, open a helpful article
  if (notificationId.includes('break-reminder')) {
    chrome.tabs.create({
      url: 'https://www.healthline.com/health/eye-health/20-20-20-rule'
    });
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log('Button clicked:', notificationId, buttonIndex);

  if (notificationId.includes('break-reminder')) {
    const settings = await chrome.storage.local.get(['userSettings']);
    const snoozeDuration = settings.userSettings?.notificationSettings?.snoozeDuration || 10;

    if (buttonIndex === 0) {
      // "Take break" button - start 5 minute timer
      console.log('Starting break timer...');
      chrome.alarms.create('break-timer', { delayInMinutes: 5 });

      // Track break taken
      const result = await chrome.storage.local.get(['breakEvents']);
      const breakEvents = result.breakEvents || [];
      const lastEvent = breakEvents[breakEvents.length - 1];
      if (lastEvent && lastEvent.notificationId === notificationId) {
        lastEvent.actionTaken = 'break_started';
        lastEvent.actionTime = new Date().toISOString();
        await chrome.storage.local.set({ breakEvents });
      }

    } else if (buttonIndex === 1) {
      // "Snooze" button
      console.log(`Snoozing for ${snoozeDuration} minutes...`);
      const now = Date.now();
      await chrome.storage.local.set({ lastSnoozeTime: now });

      // Track snooze
      const result = await chrome.storage.local.get(['breakEvents']);
      const breakEvents = result.breakEvents || [];
      const lastEvent = breakEvents[breakEvents.length - 1];
      if (lastEvent && lastEvent.notificationId === notificationId) {
        lastEvent.actionTaken = 'snoozed';
        lastEvent.snoozeDuration = snoozeDuration;
        lastEvent.actionTime = new Date().toISOString();
        await chrome.storage.local.set({ breakEvents });
      }

    } else if (buttonIndex === 2) {
      // "Dismiss" button
      console.log('Notification dismissed');

      // Track dismissal
      const result = await chrome.storage.local.get(['breakEvents']);
      const breakEvents = result.breakEvents || [];
      const lastEvent = breakEvents[breakEvents.length - 1];
      if (lastEvent && lastEvent.notificationId === notificationId) {
        lastEvent.actionTaken = 'dismissed';
        lastEvent.dismissed = true;
        lastEvent.actionTime = new Date().toISOString();
        await chrome.storage.local.set({ breakEvents });
      }
    }

    // Clear the notification
    chrome.notifications.clear(notificationId);
  }
});

chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {
  if (notificationId.includes('break-reminder') && byUser) {
    // User manually closed the notification
    const result = await chrome.storage.local.get(['breakEvents']);
    const breakEvents = result.breakEvents || [];
    const lastEvent = breakEvents[breakEvents.length - 1];
    if (lastEvent && lastEvent.notificationId === notificationId) {
      lastEvent.actionTaken = 'closed_manually';
      lastEvent.dismissed = true;
      lastEvent.actionTime = new Date().toISOString();
      await chrome.storage.local.set({ breakEvents });
    }
  }
});

// Break timer alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'break-timer') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: '✅ Break Complete!',
      message: 'Your 5-minute break is over. Ready to continue?',
      priority: 0
    });

    chrome.alarms.clear('break-timer');
  }
});

// Initialize
new WellnessTracker();