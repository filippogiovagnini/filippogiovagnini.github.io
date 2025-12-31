const THREE = require('three');
const ParticleSystem = require('./ParticleSystem');
const { InteractiveElements } = require('./InteractiveElements');
const PerformanceMonitor = require('./PerformanceMonitor');
const ContentAnimations = require('./ContentAnimations');

/**
 * AnimationManager - Central coordinator for all Three.js animations
 * Handles scene initialization, performance monitoring, and lifecycle management
 */
class AnimationManager {
    constructor(options = {}) {
        this.options = {
            canvas: null,
            enablePerformanceMonitoring: true,
            ...options
        };
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isInitialized = false;
        this.isRunning = false;
        this.animationId = null;
        
        // Animation components
        this.particleSystem = null;
        this.interactiveElements = null;
        this.performanceMonitor = null;
        this.contentAnimations = null;
        
        // Performance monitoring (legacy - will be replaced by PerformanceMonitor)
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        
        // Device detection
        this.deviceType = this.detectDeviceType();
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.resize = this.resize.bind(this);
    }
    
    /**
     * Initialize the Three.js scene, camera, and renderer
     */
    init() {
        try {
            // Initialize performance monitor first
            this.performanceMonitor = new PerformanceMonitor({
                targetFPS: { desktop: 60, tablet: 45, mobile: 30 }
            });
            
            // Check if animations should be enabled
            if (!this.performanceMonitor.shouldEnableAnimations()) {
                console.log('Animations disabled due to performance monitor settings');
                return false;
            }
            
            // Create scene
            this.scene = new THREE.Scene();
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75, 
                window.innerWidth / window.innerHeight, 
                0.1, 
                1000
            );
            this.camera.position.z = 5;
            
            // Create renderer with performance-based settings
            const qualitySettings = this.performanceMonitor.getQualitySettings();
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.options.canvas,
                alpha: true,
                antialias: qualitySettings.antialias
            });
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Add canvas to DOM if not provided
            if (!this.options.canvas) {
                this.renderer.domElement.style.position = 'fixed';
                this.renderer.domElement.style.top = '0';
                this.renderer.domElement.style.left = '0';
                this.renderer.domElement.style.zIndex = '-1';
                this.renderer.domElement.style.pointerEvents = 'none';
                document.body.appendChild(this.renderer.domElement);
            }
            
            // Add resize listener
            window.addEventListener('resize', this.resize);
            
            // Initialize particle system with performance-based settings
            try {
                this.particleSystem = new ParticleSystem(this.scene, this.deviceType);
                // Update particle system with quality settings if it has an updateQuality method
                if (this.particleSystem.updateQuality) {
                    this.particleSystem.updateQuality(qualitySettings);
                }
            } catch (error) {
                console.warn('Failed to initialize particle system:', error);
                // Continue without particle system - graceful degradation
            }
            
            // Initialize interactive elements
            try {
                this.interactiveElements = new InteractiveElements(this.scene, this.camera, this.deviceType);
            } catch (error) {
                console.warn('Failed to initialize interactive elements:', error);
                // Continue without interactive elements - graceful degradation
            }
            
            // Initialize content animations
            try {
                this.contentAnimations = new ContentAnimations({
                    staggerDelay: this.deviceType === 'mobile' ? 150 : 100,
                    revealThreshold: 0.1
                });
                this.contentAnimations.init();
            } catch (error) {
                console.warn('Failed to initialize content animations:', error);
                // Continue without content animations - graceful degradation
            }
            
            // Set up performance monitor event listeners
            this.setupPerformanceListeners();
            
            this.isInitialized = true;
            console.log('AnimationManager initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize AnimationManager:', error);
            return false;
        }
    }
    
    /**
     * Start the animation loop
     */
    start() {
        if (!this.isInitialized) {
            console.warn('AnimationManager not initialized. Call init() first.');
            return false;
        }
        
        if (this.isRunning) {
            return true;
        }
        
        this.isRunning = true;
        this.animate();
        console.log('Animation started');
        return true;
    }
    
    /**
     * Stop the animation loop
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isRunning = false;
        console.log('Animation stopped');
    }
    
    /**
     * Animation loop
     */
    animate() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(this.animate);
        
        // Calculate delta time
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        
        // Update particle system
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
        
        // Update interactive elements
        if (this.interactiveElements) {
            this.interactiveElements.update(deltaTime);
        }
        
        // Performance monitoring with PerformanceMonitor
        if (this.performanceMonitor) {
            this.performanceMonitor.updateMetrics();
        } else if (this.options.enablePerformanceMonitoring) {
            // Fallback to legacy performance monitoring
            this.updatePerformanceMetrics();
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Set up performance monitor event listeners
     */
    setupPerformanceListeners() {
        if (!this.performanceMonitor) return;
        
        // Listen for quality changes
        window.addEventListener('animationQualityChange', (event) => {
            const { quality, settings } = event.detail;
            console.log(`Quality changed to ${quality}:`, settings);
            
            // Update particle system if it exists
            if (this.particleSystem && this.particleSystem.updateQuality) {
                this.particleSystem.updateQuality(settings);
            }
            
            // Update interactive elements if needed
            if (this.interactiveElements && this.interactiveElements.updateQuality) {
                this.interactiveElements.updateQuality(settings);
            }
        });
        
        // Listen for visibility changes
        window.addEventListener('animationVisibilityChange', (event) => {
            const { visible } = event.detail;
            if (visible) {
                if (!this.isRunning) {
                    this.start();
                }
            } else {
                if (this.isRunning) {
                    this.stop();
                }
            }
        });
    }
    
    /**
     * Handle window resize
     */
    resize() {
        if (!this.isInitialized) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        if (this.performanceMonitor) {
            return this.performanceMonitor.getMetrics();
        }
        
        // Fallback to legacy metrics
        return {
            fps: this.fps,
            deviceType: this.deviceType,
            isRunning: this.isRunning
        };
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stop();
        
        // Dispose performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.dispose();
            this.performanceMonitor = null;
        }
        
        // Dispose particle system
        if (this.particleSystem) {
            this.particleSystem.dispose();
            this.particleSystem = null;
        }
        
        // Dispose interactive elements
        if (this.interactiveElements) {
            this.interactiveElements.dispose();
            this.interactiveElements = null;
        }
        
        // Dispose content animations
        if (this.contentAnimations) {
            this.contentAnimations.dispose();
            this.contentAnimations = null;
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
        
        window.removeEventListener('resize', this.resize);
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isInitialized = false;
        
        console.log('AnimationManager disposed');
    }
}

module.exports = AnimationManager;