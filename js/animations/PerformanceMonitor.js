/**
 * PerformanceMonitor - Monitors and manages animation performance
 * Handles frame rate tracking, quality adjustment, WebGL detection, and accessibility
 */
class PerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            targetFPS: { desktop: 60, tablet: 45, mobile: 30 },
            performanceThreshold: 0.8, // 80% of target FPS
            qualityAdjustmentDelay: 2000, // 2 seconds before adjusting quality
            ...options
        };
        
        // Performance tracking
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.currentFPS = 60;
        this.fpsHistory = [];
        this.maxHistoryLength = 60; // Keep 60 frames of history
        
        // Quality settings
        this.currentQuality = 'high';
        this.qualityLevels = {
            high: { particles: 2000, shadows: true, antialias: true },
            medium: { particles: 1000, shadows: false, antialias: true },
            low: { particles: 500, shadows: false, antialias: false }
        };
        
        // Device and capability detection
        this.deviceType = this.detectDeviceType();
        this.webGLSupported = this.detectWebGLSupport();
        this.reducedMotionPreferred = this.detectReducedMotionPreference();
        
        // Performance adjustment tracking
        this.lastQualityAdjustment = 0;
        this.performanceWarningCount = 0;
        
        // Load time tracking
        this.initStartTime = performance.now();
        this.firstFrameTime = null;
        
        // Bind methods
        this.onVisibilityChange = this.onVisibilityChange.bind(this);
        this.onReducedMotionChange = this.onReducedMotionChange.bind(this);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set initial quality based on device
        this.setInitialQuality();
    }
    
    /**
     * Detect device type for performance optimization
     */
    detectDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
        const isTablet = /ipad|android(?!.*mobile)/.test(userAgent) || 
                        (window.innerWidth >= 768 && window.innerWidth <= 1024);
        
        if (isMobile && !isTablet) return 'mobile';
        if (isTablet) return 'tablet';
        return 'desktop';
    }
    
    /**
     * Detect WebGL support with comprehensive testing
     */
    detectWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                return false;
            }
            
            // Test basic WebGL functionality
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            
            if (!vertexShader || !fragmentShader) {
                return false;
            }
            
            // Clean up test objects
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            
            return true;
        } catch (error) {
            console.warn('WebGL detection failed:', error);
            return false;
        }
    }
    
    /**
     * Detect reduced motion preference
     */
    detectReducedMotionPreference() {
        if (!window.matchMedia) {
            return false;
        }
        
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    /**
     * Set up event listeners for performance monitoring
     */
    setupEventListeners() {
        // Listen for visibility changes to pause/resume animations
        if (typeof document.addEventListener !== 'undefined') {
            document.addEventListener('visibilitychange', this.onVisibilityChange);
        }
        
        // Listen for reduced motion preference changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', this.onReducedMotionChange);
            } else if (mediaQuery.addListener) {
                // Fallback for older browsers
                mediaQuery.addListener(this.onReducedMotionChange);
            }
        }
    }
    
    /**
     * Set initial quality based on device capabilities
     */
    setInitialQuality() {
        if (!this.webGLSupported) {
            this.currentQuality = 'disabled';
            return;
        }
        
        if (this.reducedMotionPreferred) {
            this.currentQuality = 'disabled';
            return;
        }
        
        switch (this.deviceType) {
            case 'mobile':
                this.currentQuality = 'low';
                break;
            case 'tablet':
                this.currentQuality = 'medium';
                break;
            case 'desktop':
            default:
                this.currentQuality = 'high';
                break;
        }
    }
    
    /**
     * Update performance metrics (call this every frame)
     */
    updateMetrics() {
        const currentTime = performance.now();
        
        // Track first frame time for load performance
        if (this.firstFrameTime === null) {
            this.firstFrameTime = currentTime;
        }
        
        this.frameCount++;
        
        // Calculate FPS every second
        const timeDelta = currentTime - this.lastTime;
        if (timeDelta >= 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / timeDelta);
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Add to history
            this.fpsHistory.push(this.currentFPS);
            if (this.fpsHistory.length > this.maxHistoryLength) {
                this.fpsHistory.shift();
            }
            
            // Check if quality adjustment is needed
            this.checkPerformanceThreshold();
        }
    }
    
    /**
     * Check if performance is below threshold and adjust quality
     */
    checkPerformanceThreshold() {
        if (this.currentQuality === 'disabled' || this.currentQuality === 'low') {
            return; // Already at minimum quality or disabled
        }
        
        const targetFPS = this.options.targetFPS[this.deviceType];
        const threshold = targetFPS * this.options.performanceThreshold;
        const currentTime = performance.now();
        
        // Only adjust quality if enough time has passed since last adjustment
        if (currentTime - this.lastQualityAdjustment < this.options.qualityAdjustmentDelay) {
            return;
        }
        
        // Check average FPS over recent history
        if (this.fpsHistory.length >= 5) {
            const recentFPS = this.fpsHistory.slice(-5);
            const averageFPS = recentFPS.reduce((sum, fps) => sum + fps, 0) / recentFPS.length;
            
            if (averageFPS < threshold) {
                this.performanceWarningCount++;
                
                // Reduce quality after multiple warnings
                if (this.performanceWarningCount >= 3) {
                    this.reduceQuality();
                    this.performanceWarningCount = 0;
                    this.lastQualityAdjustment = currentTime;
                }
            } else {
                // Reset warning count if performance is good
                this.performanceWarningCount = 0;
            }
        }
    }
    
    /**
     * Reduce animation quality to improve performance
     */
    reduceQuality() {
        const qualityOrder = ['high', 'medium', 'low'];
        const currentIndex = qualityOrder.indexOf(this.currentQuality);
        
        if (currentIndex < qualityOrder.length - 1) {
            this.currentQuality = qualityOrder[currentIndex + 1];
            console.log(`Performance: Reduced quality to ${this.currentQuality}`);
            
            // Emit quality change event for animation components to respond
            this.emitQualityChange();
        }
    }
    
    /**
     * Emit quality change event
     */
    emitQualityChange() {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('animationQualityChange', {
                detail: {
                    quality: this.currentQuality,
                    settings: this.getQualitySettings()
                }
            });
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Get current quality settings
     */
    getQualitySettings() {
        if (this.currentQuality === 'disabled') {
            return { particles: 0, shadows: false, antialias: false };
        }
        
        return this.qualityLevels[this.currentQuality] || this.qualityLevels.low;
    }
    
    /**
     * Get comprehensive performance metrics
     */
    getMetrics() {
        const loadTime = this.firstFrameTime ? this.firstFrameTime - this.initStartTime : null;
        
        return {
            fps: this.currentFPS,
            averageFPS: this.getAverageFPS(),
            deviceType: this.deviceType,
            quality: this.currentQuality,
            webGLSupported: this.webGLSupported,
            reducedMotionPreferred: this.reducedMotionPreferred,
            loadTime: loadTime,
            targetFPS: this.options.targetFPS[this.deviceType],
            performanceWarnings: this.performanceWarningCount
        };
    }
    
    /**
     * Get average FPS from recent history
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) {
            return this.currentFPS;
        }
        
        return Math.round(
            this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
        );
    }
    
    /**
     * Check if animations should be enabled
     */
    shouldEnableAnimations() {
        return this.webGLSupported && !this.reducedMotionPreferred && this.currentQuality !== 'disabled';
    }
    
    /**
     * Get graceful fallback configuration
     */
    getFallbackConfig() {
        if (!this.webGLSupported) {
            return {
                type: 'css',
                reason: 'webgl_unsupported',
                enableBasicAnimations: true
            };
        }
        
        if (this.reducedMotionPreferred) {
            return {
                type: 'static',
                reason: 'reduced_motion_preferred',
                enableBasicAnimations: false
            };
        }
        
        return null;
    }
    
    /**
     * Handle visibility change events
     */
    onVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, consider pausing animations
            this.emitVisibilityChange(false);
        } else {
            // Page is visible, resume animations
            this.emitVisibilityChange(true);
        }
    }
    
    /**
     * Handle reduced motion preference changes
     */
    onReducedMotionChange(event) {
        this.reducedMotionPreferred = event.matches;
        
        if (this.reducedMotionPreferred) {
            this.currentQuality = 'disabled';
            console.log('Reduced motion preference enabled, disabling animations');
        } else {
            this.setInitialQuality();
            console.log('Reduced motion preference disabled, re-enabling animations');
        }
        
        this.emitQualityChange();
    }
    
    /**
     * Emit visibility change event
     */
    emitVisibilityChange(visible) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('animationVisibilityChange', {
                detail: { visible }
            });
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Force quality level (for testing or manual override)
     */
    setQuality(quality) {
        if (quality === 'disabled' || this.qualityLevels[quality]) {
            this.currentQuality = quality;
            this.emitQualityChange();
            console.log(`Performance: Quality manually set to ${quality}`);
        }
    }
    
    /**
     * Clean up resources and event listeners
     */
    dispose() {
        // Remove event listeners
        if (typeof document.removeEventListener !== 'undefined') {
            document.removeEventListener('visibilitychange', this.onVisibilityChange);
        }
        
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', this.onReducedMotionChange);
            } else if (mediaQuery.removeListener) {
                // Fallback for older browsers
                mediaQuery.removeListener(this.onReducedMotionChange);
            }
        }
        
        // Clear history
        this.fpsHistory = [];
        
        console.log('PerformanceMonitor disposed');
    }
}

module.exports = PerformanceMonitor;