const { initAnimations, AnimationManager } = require('./index.js');

// Mock the AnimationManager
jest.mock('./AnimationManager.js', () => {
    return jest.fn().mockImplementation(() => ({
        init: jest.fn(() => true),
        start: jest.fn(),
        dispose: jest.fn()
    }));
});

// Mock the PerformanceMonitor
jest.mock('./PerformanceMonitor.js', () => {
    return jest.fn().mockImplementation(() => ({
        shouldEnableAnimations: jest.fn(() => true),
        getFallbackConfig: jest.fn(() => null),
        dispose: jest.fn()
    }));
});

describe('Animation System Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset console mocks
        console.warn = jest.fn();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    describe('WebGL support detection', () => {
        test('should initialize animations when WebGL is supported', () => {
            // WebGL is mocked as supported in jest.setup.js
            const result = initAnimations();
            
            expect(result).not.toBeNull();
            expect(AnimationManager).toHaveBeenCalled();
        });

        test('should return null when WebGL is not supported', () => {
            const PerformanceMonitor = require('./PerformanceMonitor.js');
            
            // Mock PerformanceMonitor to indicate WebGL not supported
            PerformanceMonitor.mockImplementation(() => ({
                shouldEnableAnimations: jest.fn(() => false),
                getFallbackConfig: jest.fn(() => ({
                    type: 'css',
                    reason: 'webgl_unsupported',
                    enableBasicAnimations: true
                })),
                dispose: jest.fn()
            }));
            
            const result = initAnimations();
            
            expect(result).toBeNull();
            expect(console.log).toHaveBeenCalledWith(
                'Animations disabled: webgl_unsupported'
            );
        });
    });

    describe('Reduced motion preference detection', () => {
        test('should respect reduced motion preference', () => {
            const PerformanceMonitor = require('./PerformanceMonitor.js');
            
            // Mock PerformanceMonitor to indicate reduced motion preferred
            PerformanceMonitor.mockImplementation(() => ({
                shouldEnableAnimations: jest.fn(() => false),
                getFallbackConfig: jest.fn(() => ({
                    type: 'static',
                    reason: 'reduced_motion_preferred',
                    enableBasicAnimations: false
                })),
                dispose: jest.fn()
            }));
            
            const result = initAnimations();
            
            expect(result).toBeNull();
            expect(console.log).toHaveBeenCalledWith(
                'Animations disabled: reduced_motion_preferred'
            );
        });

        test('should initialize when reduced motion is not preferred', () => {
            const PerformanceMonitor = require('./PerformanceMonitor.js');
            
            // Mock PerformanceMonitor to allow animations
            PerformanceMonitor.mockImplementation(() => ({
                shouldEnableAnimations: jest.fn(() => true),
                getFallbackConfig: jest.fn(() => null),
                dispose: jest.fn()
            }));
            
            const result = initAnimations();
            
            expect(result).not.toBeNull();
        });
    });

    describe('Animation manager initialization', () => {
        test('should create AnimationManager with correct options', () => {
            initAnimations();
            
            expect(AnimationManager).toHaveBeenCalledWith({
                enablePerformanceMonitoring: true
            });
        });

        test('should call init and start on AnimationManager', () => {
            const mockManager = {
                init: jest.fn(() => true),
                start: jest.fn(),
                dispose: jest.fn()
            };
            
            AnimationManager.mockImplementation(() => mockManager);
            
            const result = initAnimations();
            
            expect(mockManager.init).toHaveBeenCalled();
            expect(mockManager.start).toHaveBeenCalled();
            expect(result).toBe(mockManager);
        });

        test('should handle initialization failure', () => {
            const mockManager = {
                init: jest.fn(() => false),
                start: jest.fn(),
                dispose: jest.fn()
            };
            
            AnimationManager.mockImplementation(() => mockManager);
            
            const result = initAnimations();
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                'Failed to initialize animation manager'
            );
        });

        test('should handle exceptions during initialization', () => {
            AnimationManager.mockImplementation(() => {
                throw new Error('Initialization failed');
            });
            
            const result = initAnimations();
            
            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                'Error initializing animations:',
                expect.any(Error)
            );
        });
    });

    describe('Parcel bundling compatibility', () => {
        test('should export AnimationManager for bundling', () => {
            expect(AnimationManager).toBeDefined();
            expect(typeof AnimationManager).toBe('function');
        });

        test('should export initAnimations function', () => {
            expect(initAnimations).toBeDefined();
            expect(typeof initAnimations).toBe('function');
        });
    });
});