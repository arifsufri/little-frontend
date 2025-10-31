/**
 * Keep-Alive Service for Render Backend
 * Prevents the backend from spinning down due to inactivity
 */

class KeepAliveService {
  private intervalId: NodeJS.Timeout | null = null;
  private isActive = false;
  private readonly baseUrl: string;
  private readonly interval: number;
  private readonly maxRetries: number;
  private retryCount = 0;

  constructor() {
    // Get backend URL from environment or default
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Get ping interval from environment or default to 10 minutes
    const intervalMinutes = parseInt(process.env.NEXT_PUBLIC_KEEP_ALIVE_INTERVAL || '10', 10);
    this.interval = intervalMinutes * 60 * 1000; // Convert minutes to milliseconds
    
    this.maxRetries = 3;
  }

  /**
   * Start the keep-alive service
   */
  start(): void {
    if (this.isActive) {
      console.log('🔄 Keep-alive service is already running');
      return;
    }

    // Only run in production or when explicitly enabled
    const shouldRun = process.env.NODE_ENV === 'production' || 
                     process.env.NEXT_PUBLIC_ENABLE_KEEP_ALIVE === 'true';

    if (!shouldRun) {
      console.log('⏸️ Keep-alive service disabled in development');
      return;
    }

    console.log('🚀 Starting keep-alive service...');
    console.log(`📡 Backend URL: ${this.baseUrl}`);
    console.log(`⏰ Ping interval: ${this.interval / 1000 / 60} minutes`);

    this.isActive = true;
    this.retryCount = 0;

    // Initial ping
    this.pingBackend();

    // Set up recurring pings
    this.intervalId = setInterval(() => {
      this.pingBackend();
    }, this.interval);
  }

  /**
   * Stop the keep-alive service
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    console.log('⏹️ Stopping keep-alive service...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isActive = false;
    this.retryCount = 0;
  }

  /**
   * Check if the service is currently active
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Get service status information
   */
  getStatus(): {
    isActive: boolean;
    baseUrl: string;
    interval: number;
    retryCount: number;
    nextPing?: number;
  } {
    return {
      isActive: this.isActive,
      baseUrl: this.baseUrl,
      interval: this.interval,
      retryCount: this.retryCount,
      nextPing: this.intervalId ? Date.now() + this.interval : undefined
    };
  }

  /**
   * Ping the backend health endpoint
   */
  private async pingBackend(): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Keep-alive ping successful (${responseTime}ms)`, {
          status: data.status,
          uptime: data.uptime ? `${Math.floor(data.uptime / 60)}m` : 'unknown',
          timestamp: new Date().toLocaleTimeString()
        });
        
        // Reset retry count on successful ping
        this.retryCount = 0;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.retryCount++;
      console.warn(`⚠️ Keep-alive ping failed (attempt ${this.retryCount}/${this.maxRetries}):`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString(),
        url: `${this.baseUrl}/health`
      });

      // If we've exceeded max retries, log a more serious warning
      if (this.retryCount >= this.maxRetries) {
        console.error('🚨 Keep-alive service: Max retries exceeded. Backend may be down.');
        // Reset retry count to continue trying
        this.retryCount = 0;
      }
    }
  }

  /**
   * Manual ping for testing purposes
   */
  async ping(): Promise<boolean> {
    try {
      await this.pingBackend();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const keepAliveService = new KeepAliveService();

export default keepAliveService;

// Export types for TypeScript
export type KeepAliveStatus = ReturnType<typeof keepAliveService.getStatus>;
