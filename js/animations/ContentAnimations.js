/**
 * ContentAnimations.js
 * Handles scroll-based reveal animations and repository card enhancements
 */

class ContentAnimations {
    constructor(options = {}) {
        this.options = {
            staggerDelay: 100, // ms between staggered animations
            revealThreshold: 0.1, // percentage of element visible to trigger
            ...options
        };
        
        this.animatedElements = new Set();
        this.observer = null;
        this.isInitialized = false;
    }

    /**
     * Initialize content animations
     */
    init() {
        try {
            this.setupScrollObserver();
            this.enhanceRepositoryCards();
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize content animations:', error);
            return false;
        }
    }

    /**
     * Set up Intersection Observer for scroll-based animations
     */
    setupScrollObserver() {
        if (!window.IntersectionObserver) {
            console.warn('IntersectionObserver not supported, skipping scroll animations');
            return;
        }

        const observerOptions = {
            threshold: this.options.revealThreshold,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    // Add staggered delay based on element order
                    const delay = index * this.options.staggerDelay;
                    
                    setTimeout(() => {
                        this.revealElement(entry.target);
                        this.animatedElements.add(entry.target);
                    }, delay);
                }
            });
        }, observerOptions);

        // Observe content sections
        this.observeContentSections();
    }

    /**
     * Find and observe content sections for reveal animations
     */
    observeContentSections() {
        const contentSelectors = [
            '.main-content',
            '.hero-content', 
            '.video-content',
            '.repo-container',
            '.main-text'
        ];

        contentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Initially hide elements for reveal animation
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                
                if (this.observer) {
                    this.observer.observe(element);
                }
            });
        });
    }

    /**
     * Reveal an element with animation
     */
    revealElement(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }

    /**
     * Enhance repository cards with 3D transforms
     */
    enhanceRepositoryCards() {
        // Wait for repository cards to be loaded by GitHub API
        const checkForRepos = () => {
            const repoCards = document.querySelectorAll('.repo');
            
            if (repoCards.length > 0) {
                repoCards.forEach((card, index) => {
                    this.enhanceRepositoryCard(card, index);
                });
            } else {
                // Retry after a short delay if repos haven't loaded yet
                setTimeout(checkForRepos, 100);
            }
        };

        // Start checking immediately and also set up a MutationObserver
        checkForRepos();
        this.observeRepositoryContainer();
    }

    /**
     * Observe repository container for dynamically added cards
     */
    observeRepositoryContainer() {
        const repoContainer = document.getElementById('repo-container');
        if (!repoContainer) return;

        const repoObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('repo')) {
                        const index = Array.from(repoContainer.children).indexOf(node);
                        this.enhanceRepositoryCard(node, index);
                    }
                });
            });
        });

        repoObserver.observe(repoContainer, { childList: true });
    }

    /**
     * Enhance a single repository card with 3D transforms
     */
    enhanceRepositoryCard(card, index) {
        // Preserve existing functionality while adding 3D effects
        card.style.transformStyle = 'preserve-3d';
        card.style.backfaceVisibility = 'hidden';
        
        // Add enhanced hover effects
        const originalTransition = card.style.transition;
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

        card.addEventListener('mouseenter', (e) => {
            // Enhanced 3D transform on hover
            card.style.transform = 'translateY(-8px) rotateX(5deg) rotateY(2deg) scale(1.02)';
            card.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
        });

        card.addEventListener('mouseleave', (e) => {
            // Return to original state
            card.style.transform = 'translateY(0) rotateX(0) rotateY(0) scale(1)';
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });

        // Add staggered entrance animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * this.options.staggerDelay);
    }

    /**
     * Get animation timing information
     */
    getAnimationTiming() {
        return {
            staggerDelay: this.options.staggerDelay,
            revealThreshold: this.options.revealThreshold,
            transitionDuration: 600 // ms
        };
    }

    /**
     * Check if scroll-based animations are triggered correctly
     */
    isScrollAnimationTriggered(element) {
        return this.animatedElements.has(element);
    }

    /**
     * Get staggered animation delays for elements
     */
    getStaggeredDelays(elementCount) {
        const delays = [];
        for (let i = 0; i < elementCount; i++) {
            delays.push(i * this.options.staggerDelay);
        }
        return delays;
    }

    /**
     * Dispose of content animations
     */
    dispose() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        this.animatedElements.clear();
        this.isInitialized = false;
    }
}

module.exports = ContentAnimations;