// src/utils/backendConfig.ts
export interface BackendConfig {
  baseUrl: string;
  apiKey?: string;
  syncInterval: number; // in minutes
  enabled: boolean;
}

export const defaultBackendConfig: BackendConfig = {
  baseUrl: 'https://api.mindfulscreen.app', // Replace with your actual backend URL
  syncInterval: 15, // Sync every 15 minutes
  enabled: false // Disabled by default until user enables it
};

export class BackendService {
  private config: BackendConfig;
  private authToken: string | null = null;
  private userId: string | null = null;

  constructor(config: BackendConfig) {
    this.config = config;
    this.loadAuthState();
  }

  private async loadAuthState() {
    const result = await chrome.storage.local.get(['authToken', 'userId']);
    this.authToken = result.authToken || null;
    this.userId = result.userId || null;
  }

  private async saveAuthState(token: string, userId: string) {
    this.authToken = token;
    this.userId = userId;
    await chrome.storage.local.set({ authToken: token, userId });
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        await this.saveAuthState(data.token, data.userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async register(email: string, password: string, name: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      if (response.ok) {
        const data = await response.json();
        await this.saveAuthState(data.token, data.userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  }

  async syncData(activities: any[], dailySummary: any): Promise<boolean> {
    if (!this.authToken || !this.userId) {
      console.log('Not authenticated, skipping sync');
      return false;
    }

    try {
      const syncData = {
        userId: this.userId,
        activities,
        dailySummary,
        timestamp: new Date().toISOString(),
        deviceId: await this.getDeviceId()
      };

      const response = await fetch(`${this.config.baseUrl}/api/data/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(syncData)
      });

      return response.ok;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }

  async getInsights(): Promise<any> {
    if (!this.authToken || !this.userId) return null;

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/insights/${this.userId}?days=7`,
        {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        }
      );

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      return null;
    }
  }

  async logout() {
    this.authToken = null;
    this.userId = null;
    await chrome.storage.local.remove(['authToken', 'userId']);
  }

  isAuthenticated(): boolean {
    return !!this.authToken && !!this.userId;
  }

  private async getDeviceId(): Promise<string> {
    const result = await chrome.storage.local.get(['deviceId']);
    if (!result.deviceId) {
      const deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      await chrome.storage.local.set({ deviceId });
      return deviceId;
    }
    return result.deviceId;
  }
}