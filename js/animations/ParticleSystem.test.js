const fc = require('fast-check');
const ParticleSystem = require('./ParticleSystem');

// Mock Three.js for testing
const mockScene = {
    add: jest.fn(),
    remove: jest.fn()
};

// Mock THREE objects
const mockGeometry = {
    setAttribute: jest.fn(),
    dispose: jest.fn(),
    attributes: {
        position: { needsUpdate: false }
    }
};

const mockMaterial = {
    dispose: jest.fn()
};

const mockPoints = {};

// Mock THREE module
jest.mock('three', () => ({
    BufferGeometry: jest.fn(() => mockGeometry),
    BufferAttribute: jest.fn(),
    PointsMaterial: jest.fn(() => mockMaterial),
    Points: jest.fn(() => mockPoints),
    AdditiveBlending: 'AdditiveBlending'
}));

describe('ParticleSystem', () => {
    let particleSystem;
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset geometry mock
        mockGeometry.attributes.position.needsUpdate = false;
    });
    
    afterEach(() => {
        if (particleSystem) {
            particleSystem.dispose();
        }
    });
    
    describe('Property 1: Particle Animation Consistency', () => {
        /**
         * Feature: threejs-animations, Property 1: Particle Animation Consistency
         * For any valid animation frame, particles should have positions that change over time 
         * and remain within the viewport boundaries.
         * Validates: Requirements 1.1
         */
        test('particles should have positions that change over time and remain within boundaries', () => {
            fc.assert(fc.property(
                fc.constantFrom('desktop', 'tablet', 'mobile'),
                fc.float({ min: Math.fround(0.001), max: Math.fround(0.1) }),
                fc.integer({ min: 1, max: 10 }),
                (deviceType, deltaTime, updateCount) => {
                    // Create particle system
                    particleSystem = new ParticleSystem(mockScene, deviceType);
                    
                    // Get initial positions
                    const initialPositions = particleSystem.getParticlePositions();
                    expect(initialPositions.length).toBeGreaterThan(0);
                    
                    // Store initial positions for comparison
                    const initialSnapshot = [...initialPositions];
                    
                    // Update particles multiple times
                    let hasPositionChanged = false;
                    for (let i = 0; i < updateCount; i++) {
                        particleSystem.update(deltaTime);
                        
                        const currentPositions = particleSystem.getParticlePositions();
                        
                        // Check if positions have changed
                        for (let j = 0; j < Math.min(initialSnapshot.length, currentPositions.length); j++) {
                            if (Math.abs(initialSnapshot[j] - currentPositions[j]) > 0.0001) {
                                hasPositionChanged = true;
                                break;
                            }
                        }
                        
                        // Check boundary constraints
                        for (let j = 0; j < currentPositions.length; j += 3) {
                            const x = currentPositions[j];
                            const y = currentPositions[j + 1];
                            const z = currentPositions[j + 2];
                            
                            // Particles should stay within reasonable bounds
                            expect(x).toBeGreaterThanOrEqual(-10);
                            expect(x).toBeLessThanOrEqual(10);
                            expect(y).toBeGreaterThanOrEqual(-10);
                            expect(y).toBeLessThanOrEqual(10);
                            expect(z).toBeGreaterThanOrEqual(-5);
                            expect(z).toBeLessThanOrEqual(5);
                        }
                    }
                    
                    // Positions should change over time (animation consistency)
                    if (updateCount > 0 && deltaTime > 0) {
                        expect(hasPositionChanged).toBe(true);
                    }
                    
                    particleSystem.dispose();
                    particleSystem = null;
                }
            ), { numRuns: 100 });
        });
    });
    
    describe('Property 3: Color Palette Compliance', () => {
        /**
         * Feature: threejs-animations, Property 3: Color Palette Compliance
         * For any particle in the system, its color values should fall within 
         * the defined color palette range based on the primary color (#7a9b76).
         * Validates: Requirements 1.4
         */
        test('all particle colors should comply with the defined color palette', () => {
            fc.assert(fc.property(
                fc.constantFrom('desktop', 'tablet', 'mobile'),
                (deviceType) => {
                    // Create particle system
                    particleSystem = new ParticleSystem(mockScene, deviceType);
                    
                    // Get color palette
                    const palette = particleSystem.getColorPalette();
                    expect(palette).toContain('#7a9b76'); // Primary color must be present
                    
                    // Check that all colors in the system are from the palette
                    const colors = particleSystem.colors;
                    if (colors) {
                        for (let i = 0; i < colors.length; i += 3) {
                            const r = colors[i];
                            const g = colors[i + 1];
                            const b = colors[i + 2];
                            
                            // Each particle color should be within the defined palette
                            const isValidColor = particleSystem.isColorInPalette(r, g, b);
                            expect(isValidColor).toBe(true);
                            
                            // Colors should be valid RGB values (0-1 range)
                            expect(r).toBeGreaterThanOrEqual(0);
                            expect(r).toBeLessThanOrEqual(1);
                            expect(g).toBeGreaterThanOrEqual(0);
                            expect(g).toBeLessThanOrEqual(1);
                            expect(b).toBeGreaterThanOrEqual(0);
                            expect(b).toBeLessThanOrEqual(1);
                        }
                    }
                    
                    particleSystem.dispose();
                    particleSystem = null;
                }
            ), { numRuns: 100 });
        });
    });
    
    describe('Device-based particle scaling', () => {
        test('mobile devices should have fewer particles than desktop', () => {
            const desktopSystem = new ParticleSystem(mockScene, 'desktop');
            const mobileSystem = new ParticleSystem(mockScene, 'mobile');
            
            const desktopCount = desktopSystem.getParticleCount();
            const mobileCount = mobileSystem.getParticleCount();
            
            // Mobile should have at least 50% fewer particles
            expect(mobileCount).toBeLessThan(desktopCount * 0.5);
            
            desktopSystem.dispose();
            mobileSystem.dispose();
        });
    });
    
    describe('Initialization', () => {
        test('should initialize with correct particle count for device type', () => {
            const deviceTypes = ['desktop', 'tablet', 'mobile'];
            const expectedCounts = { desktop: 2000, tablet: 1000, mobile: 500 };
            
            deviceTypes.forEach(deviceType => {
                const system = new ParticleSystem(mockScene, deviceType);
                expect(system.getParticleCount()).toBe(expectedCounts[deviceType]);
                system.dispose();
            });
        });
        
        test('should create particle positions within bounds', () => {
            particleSystem = new ParticleSystem(mockScene, 'desktop');
            const positions = particleSystem.getParticlePositions();
            
            expect(positions.length).toBeGreaterThan(0);
            expect(positions.length % 3).toBe(0); // Should be groups of x,y,z
            
            // Check initial positions are within bounds
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];
                
                expect(x).toBeGreaterThanOrEqual(-10);
                expect(x).toBeLessThanOrEqual(10);
                expect(y).toBeGreaterThanOrEqual(-10);
                expect(y).toBeLessThanOrEqual(10);
                expect(z).toBeGreaterThanOrEqual(-5);
                expect(z).toBeLessThanOrEqual(5);
            }
        });
    });
});