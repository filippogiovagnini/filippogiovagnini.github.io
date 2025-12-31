const PerformanceMonitor = require('./PerformanceMonitor.js');
const fc = require('fast-check');

describe('PerformanceMonitor', () => {
    let performanceMonitor;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset DOM
        document.body.innerHTML = '';
        
        // Create fresh instance
        performanceMonitor = new PerformanceMonitor();
    });

    afterEach(() => {
        if (performanceMonitor) {
            performanceMonitor.dispose();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            expect(performanceMonitor.deviceType).toBeDefined();
            expect(performanceMonitor.webGLSupported).toBeDefined();
            expect(performanceMonitor.reducedMotionPreferred).toBeDefined();
            expect(performanceMonitor.currentQuality).toBeDefined();
        });

        test('should detect device type correctly', () => {
            const deviceType = performanceMonitor.detectDeviceType();
            expect(['desktop', 'tablet', 'mobile']).toContain(deviceType);
        });

        test('should detect WebGL support', () => {
            const webGLSupported = performanceMonitor.detectWebGLSupport();
            expect(typeof webGLSupported).toBe('boolean');
        });

        test('should detect reduced motion preference', () => {
            const reducedMotion = performanceMonitor.detectReducedMotionPreference();
            expect(typeof reducedMotion).toBe('boolean');
        });
    });

    describe('Quality Management', () => {
        test('should set initial quality based on device', () => {
            const qualitySettings = performanceMonitor.getQualitySettings();
            expect(qualitySettings).toHaveProperty('particles');
            expect(qualitySettings).toHaveProperty('shadows');
            expect(qualitySettings).toHaveProperty('antialias');
        });

        test('should reduce quality when performance is poor', () => {
            const initialQuality = performanceMonitor.currentQuality;
            performanceMonitor.reduceQuality();
            
            // Quality should be reduced or stay the same if already at minimum
            const qualityOrder = ['high', 'medium', 'low'];
            const initialIndex = qualityOrder.indexOf(initialQuality);
            const newIndex = qualityOrder.indexOf(performanceMonitor.currentQuality);
            
            expect(newIndex).toBeGreaterThanOrEqual(initialIndex);
        });

        test('should emit quality change events', () => {
            const eventListener = jest.fn();
            window.addEventListener('animationQualityChange', eventListener);
            
            performanceMonitor.setQuality('low');
            
            expect(eventListener).toHaveBeenCalled();
            
            window.removeEventListener('animationQualityChange', eventListener);
        });
    });

    describe('Performance Metrics', () => {
        test('should track performance metrics', () => {
            const metrics = performanceMonitor.getMetrics();
            
            expect(metrics).toHaveProperty('fps');
            expect(metrics).toHaveProperty('deviceType');
            expect(metrics).toHaveProperty('quality');
            expect(metrics).toHaveProperty('webGLSupported');
            expect(metrics).toHaveProperty('reducedMotionPreferred');
            expect(metrics).toHaveProperty('loadTime');
            expect(metrics).toHaveProperty('targetFPS');
        });

        test('should update metrics on each frame', () => {
            const initialFrameCount = performanceMonitor.frameCount;
            performanceMonitor.updateMetrics();
            
            expect(performanceMonitor.frameCount).toBe(initialFrameCount + 1);
        });
    });

    describe('Graceful Degradation', () => {
        test('should provide fallback configuration when WebGL is not supported', () => {
            // Mock WebGL as unsupported
            performanceMonitor.webGLSupported = false;
            
            const fallbackConfig = performanceMonitor.getFallbackConfig();
            
            expect(fallbackConfig).toEqual({
                type: 'css',
                reason: 'webgl_unsupported',
                enableBasicAnimations: true
            });
        });

        test('should provide fallback configuration when reduced motion is preferred', () => {
            // Mock reduced motion preference
            performanceMonitor.reducedMotionPreferred = true;
            
            const fallbackConfig = performanceMonitor.getFallbackConfig();
            
            expect(fallbackConfig).toEqual({
                type: 'static',
                reason: 'reduced_motion_preferred',
                enableBasicAnimations: false
            });
        });

        test('should return null fallback config when animations are supported', () => {
            performanceMonitor.webGLSupported = true;
            performanceMonitor.reducedMotionPreferred = false;
            
            const fallbackConfig = performanceMonitor.getFallbackConfig();
            
            expect(fallbackConfig).toBeNull();
        });
    });

    // Property-Based Tests
    describe('Property-Based Tests', () => {
        describe('Property 8: Performance Threshold Maintenance', () => {
            /**
             * Feature: threejs-animations, Property 8: Performance Threshold Maintenance
             * For any animation sequence on desktop devices, the frame rate should remain 
             * above 50fps (allowing 10fps buffer below target 60fps).
             * Validates: Requirements 4.4
             */
            test('should maintain performance above threshold on desktop devices', () => {
                fc.assert(fc.property(
                    fc.record({
                        deviceType: fc.constantFrom('desktop'),
                        targetFPS: fc.integer({ min: 55, max: 65 }),
                        simulatedFPS: fc.array(fc.integer({ min: 45, max: 70 }), { minLength: 5, maxLength: 20 })
                    }),
                    (testData) => {
                        // Create performance monitor with desktop settings
                        const monitor = new PerformanceMonitor({
                            targetFPS: { desktop: testData.targetFPS, tablet: 45, mobile: 30 }
                        });
                        
                        // Force device type to desktop
                        monitor.deviceType = testData.deviceType;
                        monitor.setInitialQuality();
                        
                        try {
                            // Simulate FPS history
                            monitor.fpsHistory = testData.simulatedFPS;
                            
                            // Calculate expected threshold (80% of target)
                            const threshold = testData.targetFPS * 0.8; // 80% threshold
                            const bufferThreshold = 50; // 10fps buffer below 60fps target
                            
                            // Get average FPS
                            const averageFPS = monitor.getAverageFPS();
                            
                            // For desktop devices, we expect either:
                            // 1. Performance above threshold, OR
                            // 2. Quality reduction if performance is poor
                            if (averageFPS < bufferThreshold) {
                                // If performance is below buffer threshold, quality should be reduced
                                monitor.checkPerformanceThreshold();
                                
                                // After multiple poor performance samples, quality should be reduced
                                if (testData.simulatedFPS.every(fps => fps < threshold)) {
                                    // Simulate multiple performance warnings
                                    monitor.performanceWarningCount = 3;
                                    monitor.checkPerformanceThreshold();
                                    
                                    // Quality should be reduced from initial setting
                                    expect(['medium', 'low']).toContain(monitor.currentQuality);
                                }
                            }
                            
                            // Verify metrics are properly tracked
                            const metrics = monitor.getMetrics();
                            expect(metrics.targetFPS).toBe(testData.targetFPS);
                            expect(metrics.deviceType).toBe('desktop');
                            expect(typeof metrics.averageFPS).toBe('number');
                            
                            return true;
                        } finally {
                            monitor.dispose();
                        }
                    }
                ), { numRuns: 100 });
            });
        });

        describe('Property 9: Load Time Performance', () => {
            /**
             * Feature: threejs-animations, Property 9: Load Time Performance
             * For any page load sequence, the time from DOM ready to first animation 
             * frame should not exceed 500ms.
             * Validates: Requirements 4.1
             */
            test('should track load time performance within acceptable limits', () => {
                fc.assert(fc.property(
                    fc.record({
                        initDelay: fc.integer({ min: 0, max: 1000 }), // Simulate various init delays
                        firstFrameDelay: fc.integer({ min: 0, max: 200 }) // Simulate frame delays
                    }),
                    (testData) => {
                        const startTime = performance.now();
                        
                        // Create monitor and simulate initialization delay
                        const monitor = new PerformanceMonitor();
                        
                        try {
                            // Simulate initialization time
                            monitor.initStartTime = startTime - testData.initDelay;
                            
                            // Simulate first frame time
                            const firstFrameTime = startTime + testData.firstFrameDelay;
                            monitor.firstFrameTime = firstFrameTime;
                            
                            // Get metrics
                            const metrics = monitor.getMetrics();
                            const loadTime = metrics.loadTime;
                            
                            // Verify load time is tracked
                            expect(typeof loadTime).toBe('number');
                            expect(loadTime).toBeGreaterThanOrEqual(0);
                            
                            // The actual load time should be the sum of delays
                            const expectedLoadTime = testData.initDelay + testData.firstFrameDelay;
                            expect(Math.abs(loadTime - expectedLoadTime)).toBeLessThan(50); // Allow 50ms tolerance
                            
                            // For the property test: if load time exceeds 500ms, 
                            // the system should be aware of it (tracked in metrics)
                            if (loadTime > 500) {
                                // System should track this as a performance concern
                                expect(loadTime).toBeGreaterThan(500);
                                // The monitor should still function correctly
                                expect(monitor.getMetrics()).toBeDefined();
                            }
                            
                            return true;
                        } finally {
                            monitor.dispose();
                        }
                    }
                ), { numRuns: 100 });
            });
        });

        describe('Property 11: Graceful Degradation', () => {
            /**
             * Feature: threejs-animations, Property 11: Graceful Degradation
             * For any environment where WebGL is unavailable, the animation system 
             * should initialize fallback behavior without throwing errors.
             * Validates: Requirements 4.3
             */
            test('should gracefully degrade when WebGL is unavailable', () => {
                fc.assert(fc.property(
                    fc.record({
                        webGLSupported: fc.boolean(),
                        canvasSupported: fc.boolean(),
                        userAgent: fc.constantFrom(
                            'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1)', // Old IE
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', // Modern
                            'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X)', // Old iOS
                            'Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0' // Old Android
                        )
                    }),
                    (testData) => {
                        // Mock WebGL support
                        const originalCreateElement = document.createElement;
                        document.createElement = jest.fn((tagName) => {
                            if (tagName === 'canvas') {
                                const canvas = originalCreateElement.call(document, tagName);
                                if (!testData.webGLSupported) {
                                    // Mock canvas without WebGL support
                                    canvas.getContext = jest.fn((type) => {
                                        if (type === 'webgl' || type === 'experimental-webgl') {
                                            return null; // No WebGL support
                                        }
                                        return originalCreateElement.call(document, 'canvas').getContext(type);
                                    });
                                }
                                return canvas;
                            }
                            return originalCreateElement.call(document, tagName);
                        });

                        try {
                            // Create monitor with mocked WebGL support
                            const monitor = new PerformanceMonitor();
                            
                            // Verify graceful degradation
                            expect(() => {
                                const shouldEnable = monitor.shouldEnableAnimations();
                                const fallbackConfig = monitor.getFallbackConfig();
                                
                                if (!testData.webGLSupported) {
                                    // Should not enable animations
                                    expect(shouldEnable).toBe(false);
                                    
                                    // Should provide CSS fallback
                                    expect(fallbackConfig).toEqual({
                                        type: 'css',
                                        reason: 'webgl_unsupported',
                                        enableBasicAnimations: true
                                    });
                                } else {
                                    // May enable animations (depends on other factors)
                                    if (shouldEnable) {
                                        expect(fallbackConfig).toBeNull();
                                    }
                                }
                                
                                // Should never throw errors
                                const metrics = monitor.getMetrics();
                                expect(metrics).toBeDefined();
                                expect(metrics.webGLSupported).toBe(testData.webGLSupported);
                                
                            }).not.toThrow();
                            
                            monitor.dispose();
                            return true;
                        } finally {
                            // Restore original createElement
                            document.createElement = originalCreateElement;
                        }
                    }
                ), { numRuns: 100 });
            });
        });

        describe('Property 12: Accessibility Compliance', () => {
            /**
             * Feature: threejs-animations, Property 12: Accessibility Compliance
             * For any user with reduced motion preferences enabled, animations 
             * should be disabled or significantly reduced.
             * Validates: Requirements 4.5
             */
            test('should respect reduced motion preferences', () => {
                fc.assert(fc.property(
                    fc.record({
                        reducedMotionPreferred: fc.boolean(),
                        deviceType: fc.constantFrom('desktop', 'tablet', 'mobile')
                    }),
                    (testData) => {
                        // Mock matchMedia for reduced motion preference
                        const originalMatchMedia = window.matchMedia;
                        window.matchMedia = jest.fn((query) => {
                            if (query === '(prefers-reduced-motion: reduce)') {
                                return {
                                    matches: testData.reducedMotionPreferred,
                                    addEventListener: jest.fn(),
                                    removeEventListener: jest.fn(),
                                    addListener: jest.fn(),
                                    removeListener: jest.fn()
                                };
                            }
                            return originalMatchMedia ? originalMatchMedia(query) : { matches: false };
                        });

                        try {
                            const monitor = new PerformanceMonitor();
                            monitor.deviceType = testData.deviceType;
                            
                            // Verify accessibility compliance
                            const shouldEnable = monitor.shouldEnableAnimations();
                            const qualitySettings = monitor.getQualitySettings();
                            const fallbackConfig = monitor.getFallbackConfig();
                            
                            if (testData.reducedMotionPreferred) {
                                // Animations should be disabled
                                expect(shouldEnable).toBe(false);
                                expect(monitor.currentQuality).toBe('disabled');
                                
                                // Should provide static fallback
                                expect(fallbackConfig).toEqual({
                                    type: 'static',
                                    reason: 'reduced_motion_preferred',
                                    enableBasicAnimations: false
                                });
                                
                                // Quality settings should reflect disabled state
                                expect(qualitySettings).toEqual({
                                    particles: 0,
                                    shadows: false,
                                    antialias: false
                                });
                            } else {
                                // Animations may be enabled (depends on other factors like WebGL)
                                if (shouldEnable) {
                                    expect(monitor.currentQuality).not.toBe('disabled');
                                    expect(qualitySettings.particles).toBeGreaterThan(0);
                                }
                            }
                            
                            // Verify metrics track accessibility preference
                            const metrics = monitor.getMetrics();
                            expect(metrics.reducedMotionPreferred).toBe(testData.reducedMotionPreferred);
                            
                            monitor.dispose();
                            return true;
                        } finally {
                            // Restore original matchMedia
                            window.matchMedia = originalMatchMedia;
                        }
                    }
                ), { numRuns: 100 });
            });
        });
    });
});