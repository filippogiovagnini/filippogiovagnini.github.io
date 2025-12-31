const ContentAnimations = require('./ContentAnimations.js');
const fc = require('fast-check');

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback, options) => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn()
}));

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    disconnect: jest.fn()
}));

describe('ContentAnimations', () => {
    let contentAnimations;
    let mockElement;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Create mock elements
        mockElement = document.createElement('div');
        mockElement.className = 'main-content';
        mockElement.style = {};
        document.body.appendChild(mockElement);

        contentAnimations = new ContentAnimations();
        
        // Clear all mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (contentAnimations) {
            contentAnimations.dispose();
        }
    });

    describe('Unit Tests', () => {
        test('should initialize successfully', () => {
            const result = contentAnimations.init();
            expect(result).toBe(true);
            expect(contentAnimations.isInitialized).toBe(true);
        });

        test('should enhance repository cards when they exist', () => {
            // Create repository container and cards
            const repoContainer = document.createElement('div');
            repoContainer.id = 'repo-container';
            
            const repoCard = document.createElement('div');
            repoCard.className = 'repo';
            repoCard.style = {};
            repoContainer.appendChild(repoCard);
            
            document.body.appendChild(repoContainer);

            contentAnimations.enhanceRepositoryCards();

            // Check that 3D transform styles are applied
            expect(repoCard.style.transformStyle).toBe('preserve-3d');
            expect(repoCard.style.backfaceVisibility).toBe('hidden');
        });

        test('should calculate staggered delays correctly', () => {
            const delays = contentAnimations.getStaggeredDelays(3);
            expect(delays).toEqual([0, 100, 200]);
        });
    });

    describe('Property-Based Tests', () => {
        /**
         * Property 13: Scroll-Based Animation Triggers
         * Feature: threejs-animations, Property 13: Scroll-Based Animation Triggers
         * Validates: Requirements 5.1
         */
        test('Property 13: For any content element that becomes visible, scroll-based animations should be triggered', () => {
            fc.assert(fc.property(
                fc.integer({ min: 1, max: 10 }), // number of elements
                fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) }), // reveal threshold
                (elementCount, threshold) => {
                    // Setup
                    const testAnimations = new ContentAnimations({ 
                        revealThreshold: threshold,
                        staggerDelay: 50 
                    });
                    
                    // Create test elements
                    const elements = [];
                    for (let i = 0; i < elementCount; i++) {
                        const element = document.createElement('div');
                        element.className = 'main-content';
                        element.style = {};
                        document.body.appendChild(element);
                        elements.push(element);
                    }

                    testAnimations.init();

                    // Simulate intersection observer callback
                    const mockEntries = elements.map((element, index) => ({
                        target: element,
                        isIntersecting: true
                    }));

                    // Get the callback from the IntersectionObserver mock
                    const observerCallback = IntersectionObserver.mock.calls[0][0];
                    
                    // Simulate elements becoming visible
                    observerCallback(mockEntries);

                    // Wait for staggered animations
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            // Verify that all elements are marked as animated
                            let allTriggered = true;
                            for (const element of elements) {
                                if (!testAnimations.isScrollAnimationTriggered(element)) {
                                    allTriggered = false;
                                    break;
                                }
                            }

                            testAnimations.dispose();
                            
                            // Clean up elements
                            elements.forEach(el => el.remove());
                            
                            resolve(allTriggered);
                        }, elementCount * 50 + 100); // Wait for all staggered animations
                    }).then(result => {
                        expect(result).toBe(true);
                    });
                }
            ), { numRuns: 100 });
        });

        /**
         * Property 14: Repository Card Enhancement
         * Feature: threejs-animations, Property 14: Repository Card Enhancement  
         * Validates: Requirements 5.3
         */
        test('Property 14: For any repository card hover interaction, 3D transform effects should be applied while preserving original functionality', () => {
            fc.assert(fc.property(
                fc.integer({ min: 1, max: 5 }), // number of repo cards
                fc.integer({ min: 0, max: 500 }), // stagger delay
                (cardCount, staggerDelay) => {
                    // Setup repository container
                    const repoContainer = document.createElement('div');
                    repoContainer.id = 'repo-container';
                    document.body.appendChild(repoContainer);

                    const testAnimations = new ContentAnimations({ 
                        staggerDelay: staggerDelay 
                    });

                    // Create repository cards
                    const cards = [];
                    for (let i = 0; i < cardCount; i++) {
                        const card = document.createElement('div');
                        card.className = 'repo';
                        card.style = {};
                        
                        // Add original hover functionality (simulate existing behavior)
                        card.addEventListener('mouseenter', () => {
                            card.dataset.originalHovered = 'true';
                        });
                        
                        repoContainer.appendChild(card);
                        cards.push(card);
                    }

                    testAnimations.enhanceRepositoryCards();

                    // Test each card
                    let allEnhanced = true;
                    for (const card of cards) {
                        // Check 3D transform properties are set
                        if (card.style.transformStyle !== 'preserve-3d' || 
                            card.style.backfaceVisibility !== 'hidden') {
                            allEnhanced = false;
                            break;
                        }

                        // Simulate hover event
                        const mouseEnterEvent = new MouseEvent('mouseenter');
                        card.dispatchEvent(mouseEnterEvent);

                        // Check that both original and enhanced functionality work
                        if (!card.dataset.originalHovered || 
                            !card.style.transform.includes('translateY(-8px)')) {
                            allEnhanced = false;
                            break;
                        }
                    }

                    testAnimations.dispose();
                    repoContainer.remove();

                    return allEnhanced;
                }
            ), { numRuns: 100 });
        });

        /**
         * Property 15: Animation Staggering
         * Feature: threejs-animations, Property 15: Animation Staggering
         * Validates: Requirements 5.5
         */
        test('Property 15: For any content loading sequence, animations should have different start times to create staggered effect', () => {
            fc.assert(fc.property(
                fc.integer({ min: 2, max: 8 }), // number of elements (min 2 to test staggering)
                fc.integer({ min: 50, max: 300 }), // stagger delay
                (elementCount, staggerDelay) => {
                    const testAnimations = new ContentAnimations({ 
                        staggerDelay: staggerDelay 
                    });

                    // Calculate expected delays
                    const expectedDelays = testAnimations.getStaggeredDelays(elementCount);

                    // Verify staggering properties
                    let properlyStaggered = true;

                    // Check that delays are different and increasing
                    for (let i = 1; i < expectedDelays.length; i++) {
                        if (expectedDelays[i] <= expectedDelays[i - 1]) {
                            properlyStaggered = false;
                            break;
                        }
                        
                        // Check that delay difference matches stagger delay
                        if (expectedDelays[i] - expectedDelays[i - 1] !== staggerDelay) {
                            properlyStaggered = false;
                            break;
                        }
                    }

                    // First element should start immediately (delay = 0)
                    if (expectedDelays[0] !== 0) {
                        properlyStaggered = false;
                    }

                    testAnimations.dispose();

                    return properlyStaggered;
                }
            ), { numRuns: 100 });
        });
    });
});