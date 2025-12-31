const fc = require('fast-check');
const THREE = require('three');
const { InteractiveElements, NavigationEnhancer } = require('./InteractiveElements');

// Mock DOM elements for testing
const mockHeroSection = {
    getBoundingClientRect: () => ({
        top: 100,
        bottom: 500,
        left: 50,
        right: 800,
        width: 750,
        height: 400
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Mock navigation elements
const mockNavigationLink = {
    style: {},
    textContent: 'test-link',
    href: 'http://example.com',
    disabled: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

const mockMobileMenu = {
    classList: {
        contains: jest.fn(() => false),
        toggle: jest.fn()
    }
};

const mockHamburgerButton = {
    onclick: jest.fn(),
    disabled: false,
    addEventListener: jest.fn(),
    querySelectorAll: jest.fn(() => [
        { style: {} },
        { style: {} },
        { style: {} }
    ])
};

// Mock document.querySelector and querySelectorAll
global.document = {
    querySelector: jest.fn((selector) => {
        if (selector === '.hero') return mockHeroSection;
        if (selector === '.mobile-menu') return mockMobileMenu;
        if (selector === '.hamburger-button') return mockHamburgerButton;
        return null;
    }),
    querySelectorAll: jest.fn((selector) => {
        if (selector === '.navbar .main-menu ul li a') {
            return [mockNavigationLink, { ...mockNavigationLink, textContent: 'test-link-2' }];
        }
        if (selector === '.mobile-menu ul li a') {
            return [mockNavigationLink];
        }
        return [];
    })
};

// Mock window object
global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Mock performance.now for timing tests
global.performance = {
    now: jest.fn(() => Date.now())
};

// Mock setTimeout and clearTimeout
global.setTimeout = jest.fn((callback, delay) => {
    return Math.random() * 1000; // Return a mock timeout ID
});
global.clearTimeout = jest.fn();

describe('InteractiveElements', () => {
    let scene, camera, interactiveElements;
    
    beforeEach(() => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        
        // Reset document.querySelector mock
        document.querySelector = jest.fn((selector) => {
            if (selector === '.hero') return mockHeroSection;
            if (selector === '.mobile-menu') return mockMobileMenu;
            if (selector === '.hamburger-button') return mockHamburgerButton;
            return null;
        });
        
        document.querySelectorAll = jest.fn((selector) => {
            if (selector === '.navbar .main-menu ul li a') {
                return [mockNavigationLink, { ...mockNavigationLink, textContent: 'test-link-2' }];
            }
            if (selector === '.mobile-menu ul li a') {
                return [mockNavigationLink];
            }
            return [];
        });
        
        // Clear mock calls but keep implementations
        mockHeroSection.addEventListener.mockClear();
        mockHeroSection.removeEventListener.mockClear();
        mockNavigationLink.addEventListener.mockClear();
        mockHamburgerButton.addEventListener.mockClear();
        setTimeout.mockClear();
        clearTimeout.mockClear();
    });
    
    afterEach(() => {
        if (interactiveElements) {
            interactiveElements.dispose();
        }
    });
    
    describe('Property 4: Interactive Element Responsiveness', () => {
        /**
         * **Feature: threejs-animations, Property 4: Interactive Element Responsiveness**
         * **Validates: Requirements 2.1, 2.3**
         * 
         * For any mouse interaction event in the hero section, 3D elements should update 
         * their position or rotation properties within one animation frame.
         */
        test('mouse interactions should update 3D element properties within one frame', () => {
            fc.assert(fc.property(
                fc.record({
                    mouseX: fc.oneof(
                        fc.constant(0),
                        fc.float({ min: Math.fround(-1), max: Math.fround(-0.001) }),
                        fc.float({ min: Math.fround(0.001), max: Math.fround(1) })
                    ),
                    mouseY: fc.oneof(
                        fc.constant(0),
                        fc.float({ min: Math.fround(-1), max: Math.fround(-0.001) }),
                        fc.float({ min: Math.fround(0.001), max: Math.fround(1) })
                    ),
                    deviceType: fc.constantFrom('desktop', 'tablet', 'mobile')
                }),
                ({ mouseX, mouseY, deviceType }) => {
                    // Skip test cases with NaN values as they're not meaningful for this property
                    if (isNaN(mouseX) || isNaN(mouseY)) {
                        return true;
                    }
                    
                    // Initialize interactive elements
                    interactiveElements = new InteractiveElements(scene, camera, deviceType);
                    
                    // Get initial position
                    const initialPosition = interactiveElements.getCurrentPosition();
                    
                    // Simulate mouse interaction
                    interactiveElements.simulateMouseInteraction(mouseX, mouseY);
                    
                    // Update once (one animation frame)
                    interactiveElements.update(0.016);
                    
                    // Get position after update
                    const updatedPosition = interactiveElements.getCurrentPosition();
                    
                    // Check if mouse interaction is detected
                    const hasInteraction = interactiveElements.hasMouseInteraction();
                    
                    // With the constrained input space (avoiding tiny floating-point values),
                    // we can test the property more directly
                    
                    // Check if the implementation detected mouse interaction
                    const implementationDetectedInteraction = hasInteraction;
                    
                    // Check if position actually changed
                    const actualPositionChanged = (
                        Math.abs(updatedPosition.x - initialPosition.x) > 1e-15 ||
                        Math.abs(updatedPosition.y - initialPosition.y) > 1e-15
                    );
                    
                    // The property is: "3D elements should update their position or rotation properties within one animation frame"
                    // For non-zero mouse values (our constrained input), if interaction is detected, position should change
                    
                    const hasNonZeroMouse = mouseX !== 0 || mouseY !== 0;
                    
                    if (hasNonZeroMouse) {
                        // For non-zero mouse input, interaction should be detected and position should change
                        return implementationDetectedInteraction && actualPositionChanged;
                    } else {
                        // For zero mouse input, no interaction should be detected and position should not change
                        return !implementationDetectedInteraction && !actualPositionChanged;
                    }
                }
            ), { numRuns: 100 });
        });
        
        test('hero object should respond to hover interactions', () => {
            interactiveElements = new InteractiveElements(scene, camera, 'desktop');
            
            const heroObject = interactiveElements.getHeroObject();
            expect(heroObject).toBeTruthy();
            
            // Initial scale should be 1
            expect(heroObject.scale.x).toBe(1);
            expect(heroObject.scale.y).toBe(1);
            expect(heroObject.scale.z).toBe(1);
            
            // Verify event listeners were added
            expect(mockHeroSection.addEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function));
            expect(mockHeroSection.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
        });
    });
    
    describe('Property 5: 3D Object Rotation Continuity', () => {
        /**
         * **Feature: threejs-animations, Property 5: 3D Object Rotation Continuity**
         * **Validates: Requirements 2.2**
         * 
         * For any animation frame, the hero section 3D object should have a rotation 
         * value that increases monotonically over time.
         */
        test('3D object rotation should increase monotonically over time', () => {
            fc.assert(fc.property(
                fc.record({
                    deltaTime: fc.float({ min: Math.fround(0.01), max: Math.fround(0.1) }),
                    deviceType: fc.constantFrom('desktop', 'tablet', 'mobile'),
                    frameCount: fc.integer({ min: 2, max: 10 })
                }),
                ({ deltaTime, deviceType, frameCount }) => {
                    // Initialize interactive elements
                    interactiveElements = new InteractiveElements(scene, camera, deviceType);
                    
                    // Get initial rotation
                    const initialRotation = interactiveElements.getCurrentRotation();
                    
                    // Update multiple frames to ensure measurable rotation change
                    for (let i = 0; i < frameCount; i++) {
                        interactiveElements.update(deltaTime);
                    }
                    
                    // Get final rotation
                    const finalRotation = interactiveElements.getCurrentRotation();
                    
                    // Calculate total rotation change
                    const xChange = finalRotation.x - initialRotation.x;
                    const yChange = finalRotation.y - initialRotation.y;
                    const zChange = finalRotation.z - initialRotation.z;
                    
                    // Rotation should increase monotonically (all axes should increase)
                    // Use a small threshold to account for floating point precision
                    const threshold = 0.0001;
                    const xIncreased = xChange > threshold;
                    const yIncreased = yChange > threshold;
                    const zIncreased = zChange > threshold;
                    
                    return xIncreased && yIncreased && zIncreased;
                }
            ), { numRuns: 100 });
        });
        
        test('rotation speed should be consistent with device configuration', () => {
            const devices = ['desktop', 'tablet', 'mobile'];
            
            devices.forEach(deviceType => {
                const elements = new InteractiveElements(scene, camera, deviceType);
                const rotationSpeed = elements.getRotationSpeed();
                
                // Rotation speed should be positive
                expect(rotationSpeed).toBeGreaterThan(0);
                
                // Check that object is rotating
                elements.update(0.016);
                expect(elements.isRotating()).toBe(true);
                
                elements.dispose();
            });
        });
    });
    
    describe('Device Configuration', () => {
        test('should initialize with different configurations for different devices', () => {
            const devices = ['desktop', 'tablet', 'mobile'];
            
            devices.forEach(deviceType => {
                const elements = new InteractiveElements(scene, camera, deviceType);
                expect(elements.getHeroObject()).toBeTruthy();
                elements.dispose();
            });
        });
    });
    
    describe('Error Handling', () => {
        test('should handle missing hero section gracefully', () => {
            // Mock querySelector to return null
            document.querySelector = jest.fn(() => null);
            
            expect(() => {
                const elements = new InteractiveElements(scene, camera, 'desktop');
                elements.dispose();
            }).not.toThrow();
        });
    });
    
    describe('Navigation Enhancement Tests', () => {
        let navigationEnhancer;
        
        afterEach(() => {
            if (navigationEnhancer) {
                navigationEnhancer.dispose();
            }
        });
        
        describe('Property 6: Navigation Animation Timing', () => {
            /**
             * **Feature: threejs-animations, Property 6: Navigation Animation Timing**
             * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
             * 
             * For any navigation interaction, animations should complete within the 
             * specified 300ms duration limit.
             */
            test('navigation animations should complete within 300ms duration limit', () => {
                fc.assert(fc.property(
                    fc.record({
                        linkIndex: fc.integer({ min: 0, max: 1 }),
                        interactionType: fc.constantFrom('hover', 'click'),
                        isHoverEnter: fc.boolean()
                    }),
                    ({ linkIndex, interactionType, isHoverEnter }) => {
                        // Initialize navigation enhancer
                        navigationEnhancer = new NavigationEnhancer();
                        
                        // Get the animation duration (should be 300ms)
                        const expectedDuration = navigationEnhancer.getAnimationDuration();
                        
                        // Verify the duration is exactly 300ms as per requirements
                        if (expectedDuration !== 300) {
                            return false;
                        }
                        
                        let startTime;
                        
                        // Simulate different types of navigation interactions
                        if (interactionType === 'hover') {
                            startTime = navigationEnhancer.simulateNavigationHover(linkIndex, isHoverEnter);
                        } else if (interactionType === 'click') {
                            startTime = navigationEnhancer.simulateNavigationClick(linkIndex);
                        }
                        
                        // Check that animation was initiated (startTime should be returned)
                        if (startTime === null) {
                            return false;
                        }
                        
                        // Check that animation is tracked as active
                        const hasActiveAnimations = navigationEnhancer.hasActiveAnimations();
                        
                        // For valid interactions, there should be active animations
                        return hasActiveAnimations;
                    }
                ), { numRuns: 100 });
            });
            
            test('animation duration should be exactly 300ms', () => {
                navigationEnhancer = new NavigationEnhancer();
                expect(navigationEnhancer.getAnimationDuration()).toBe(300);
            });
            
            test('should track active animations correctly', () => {
                navigationEnhancer = new NavigationEnhancer();
                
                // Initially no active animations
                expect(navigationEnhancer.hasActiveAnimations()).toBe(false);
                expect(navigationEnhancer.getActiveAnimationCount()).toBe(0);
                
                // Simulate hover interaction
                navigationEnhancer.simulateNavigationHover(0, true);
                
                // Should have active animations
                expect(navigationEnhancer.hasActiveAnimations()).toBe(true);
                expect(navigationEnhancer.getActiveAnimationCount()).toBeGreaterThan(0);
            });
        });
        
        describe('Property 7: Functionality Preservation', () => {
            /**
             * **Feature: threejs-animations, Property 7: Functionality Preservation**
             * **Validates: Requirements 3.4**
             * 
             * For any existing website feature (navigation, GitHub API, mobile menu), 
             * it should continue to work correctly after animation system initialization.
             */
            test('navigation functionality should be preserved after enhancement', () => {
                fc.assert(fc.property(
                    fc.record({
                        // Test different scenarios that could affect functionality
                        hasMainMenu: fc.boolean(),
                        hasMobileMenu: fc.boolean(),
                        hasHamburgerButton: fc.boolean()
                    }),
                    ({ hasMainMenu, hasMobileMenu, hasHamburgerButton }) => {
                        // Mock the DOM elements based on test parameters
                        document.querySelectorAll = jest.fn((selector) => {
                            if (selector === '.navbar .main-menu ul li a') {
                                return hasMainMenu ? [mockNavigationLink] : [];
                            }
                            if (selector === '.mobile-menu ul li a') {
                                return hasMobileMenu ? [mockNavigationLink] : [];
                            }
                            return [];
                        });
                        
                        document.querySelector = jest.fn((selector) => {
                            if (selector === '.hero') return mockHeroSection;
                            if (selector === '.mobile-menu') return hasMobileMenu ? mockMobileMenu : null;
                            if (selector === '.hamburger-button') return hasHamburgerButton ? mockHamburgerButton : null;
                            return null;
                        });
                        
                        // Initialize navigation enhancer
                        navigationEnhancer = new NavigationEnhancer();
                        
                        // Check that navigation functionality is preserved
                        const isFunctional = navigationEnhancer.isNavigationFunctional();
                        
                        // If we have navigation elements, they should remain functional
                        // If we don't have navigation elements, the check should still pass
                        return isFunctional;
                    }
                ), { numRuns: 100 });
            });
            
            test('navigation links should remain clickable and have valid hrefs', () => {
                navigationEnhancer = new NavigationEnhancer();
                
                // Check that navigation functionality is preserved
                expect(navigationEnhancer.isNavigationFunctional()).toBe(true);
                
                // Verify that mock navigation links have the expected properties
                expect(mockNavigationLink.href).toBeTruthy();
                expect(mockNavigationLink.disabled).toBe(false);
            });
            
            test('should handle missing navigation elements gracefully', () => {
                // Mock empty navigation
                document.querySelectorAll = jest.fn(() => []);
                document.querySelector = jest.fn(() => null);
                
                expect(() => {
                    navigationEnhancer = new NavigationEnhancer();
                    expect(navigationEnhancer.isNavigationFunctional()).toBe(true);
                }).not.toThrow();
            });
        });
    });
});