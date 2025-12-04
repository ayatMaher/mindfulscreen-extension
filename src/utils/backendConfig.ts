// src/utils/backendConfig.ts
export interface BackendConfig {
  baseUrl: string;
  apiKey?: string;
  syncInterval: number; // in minutes
  enabled: boolean;
}

export const defaultBackendConfig: BackendConfig = {
  baseUrl: 'http://localhost:3002', // Replace with your actual backend URL
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
    // Get device ID
    const deviceId = await this.getDeviceId();
    
    console.log('🔄 Sending login to:', `${this.config.baseUrl}/api/auth/login`);
    console.log('📱 Device ID:', deviceId);
    
    const response = await fetch(`${this.config.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        email: email, 
        password: password,
        deviceId: deviceId  // <-- ADD THIS
      })
    });

    console.log('📡 Login response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful:', data);
      
      if (data.token && data.user) {
        await this.saveAuthState(data.token, data.user._id || data.user.id);
        return true;
      } else {
        console.error('❌ Missing token or user in response:', data);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Login failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('🔥 Network error during login:', error);
    return false;
  }
}

 async register(email: string, password: string, name: string): Promise<boolean> {
  try {
    // Get or create device ID
    const deviceId = await this.getDeviceId();
    
    console.log('🔄 Sending registration to:', `${this.config.baseUrl}/api/auth/register`);
    console.log('📱 Device ID:', deviceId);
    
    const response = await fetch(`${this.config.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        email: email, 
        password: password, 
        name: name,
        deviceId: deviceId  // <-- ADD THIS
      })
    });

    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Registration successful:', data);
      
      if (data.token && data.user) {
        await this.saveAuthState(data.token, data.user._id || data.user.id);
        return true;
      } else {
        console.error('❌ Missing token or user in response:', data);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Registration failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('🔥 Network error during registration:', error);
    return false;
  }
}

  async syncData(activities: any[], dailySummary: any): Promise<boolean> {
  if (!this.authToken || !this.userId) {
    console.log('Not authenticated, skipping sync');
    return false;
  }

  try {
    const deviceId = await this.getDeviceId();
       const cleanActivities = activities.map(activity => {
      const { id, ...rest } = activity;
      return {
        ...rest,
        // Keep extensionId if you want to track duplicates
        extensionId: id
      };
    });
    const syncData = {
      userId: this.userId,
      deviceId: deviceId,  // Add deviceId
      activities: cleanActivities,
      dailySummary,
      timestamp: new Date().toISOString()
    };

    console.log('🔄 Sending sync data:', {
      userId: this.userId,
      activities: cleanActivities.length,
      hasSummary: !!dailySummary
    });

    const response = await fetch(`${this.config.baseUrl}/api/data/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify(syncData)
    });

    console.log('📡 Sync response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sync successful:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Sync failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('🔥 Network error during sync:', error);
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