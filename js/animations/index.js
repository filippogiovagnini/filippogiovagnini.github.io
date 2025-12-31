const AnimationManager = require('./AnimationManager.js');
const PerformanceMonitor = require('./PerformanceMonitor.js');
const ContentAnimations = require('./ContentAnimations.js');

/**
 * Initialize the animation system
 * This function sets up the Three.js animations for the website
 */
function initAnimations() {
    // Create performance monitor for capability detection
    const performanceMonitor = new PerformanceMonitor();
    
    // Check if animations should be enabled
    if (!performanceMonitor.shouldEnableAnimations()) {
        const fallbackConfig = performanceMonitor.getFallbackConfig();
        console.log(`Animations disabled: ${fallbackConfig.reason}`);
        
        // Clean up the temporary performance monitor
        performanceMonitor.dispose();
        
        return null;
    }
    
    try {
        const animationManager = new AnimationManager({
            enablePerformanceMonitoring: true
        });
        
        if (animationManager.init()) {
            animationManager.start();
            
            // Clean up the temporary performance monitor since AnimationManager has its own
            performanceMonitor.dispose();
            
            return animationManager;
        } else {
            console.error('Failed to initialize animation manager');
            performanceMonitor.dispose();
            return null;
        }
    } catch (error) {
        console.error('Error initializing animations:', error);
        performanceMonitor.dispose();
        return null;
    }
}

/**
 * Check if WebGL is supported
 */
function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!context;
    } catch (error) {
        return false;
    }
}

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

module.exports = { initAnimations, AnimationManager, PerformanceMonitor, isWebGLSupported, prefersReducedMotion };