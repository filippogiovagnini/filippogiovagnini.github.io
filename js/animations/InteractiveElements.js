const THREE = require('three');

/**
 * NavigationEnhancer - Manages navigation 3D transforms and transition animations
 * Enhances existing navigation with smooth animations while preserving functionality
 */
class NavigationEnhancer {
    constructor() {
        this.navigationLinks = [];
        this.mobileMenu = null;
        this.hamburgerButton = null;
        this.animationDuration = 300; // 300ms as per requirements
        this.activeAnimations = new Map();
        
        this.init();
    }
    
    /**
     * Initialize navigation enhancements
     */
    init() {
        try {
            // Get navigation elements
            this.navigationLinks = document.querySelectorAll('.navbar .main-menu ul li a');
            this.mobileMenu = document.querySelector('.mobile-menu');
            this.hamburgerButton = document.querySelector('.hamburger-button');
            
            this.addNavigationEnhancements();
            this.addMobileMenuEnhancements();
            
            console.log('NavigationEnhancer initialized');
        } catch (error) {
            console.error('Failed to initialize NavigationEnhancer:', error);
            throw error;
        }
    }
    
    /**
     * Add 3D hover effects to navigation links
     */
    addNavigationEnhancements() {
        this.navigationLinks.forEach((link, index) => {
            // Store original styles
            const originalTransform = link.style.transform || '';
            
            // Add 3D hover effect
            link.addEventListener('mouseenter', (e) => {
                const startTime = performance.now();
                this.animate3DHover(e.target, true, startTime);
            });
            
            link.addEventListener('mouseleave', (e) => {
                const startTime = performance.now();
                this.animate3DHover(e.target, false, startTime);
            });
            
            // Add click transition animation
            link.addEventListener('click', (e) => {
                const startTime = performance.now();
                this.animateClickTransition(e.target, startTime);
            });
        });
    }
    
    /**
     * Add enhanced mobile menu animations
     */
    addMobileMenuEnhancements() {
        if (!this.hamburgerButton || !this.mobileMenu) return;
        
        // Store original hamburger click handler and enhance it
        const originalHandler = this.hamburgerButton.onclick;
        
        this.hamburgerButton.addEventListener('click', (e) => {
            const startTime = performance.now();
            this.animateHamburgerTransformation(startTime);
        });
    }
    
    /**
     * Animate 3D hover effect for navigation links
     */
    animate3DHover(element, isHover, startTime) {
        const animationId = `hover-${element.textContent}`;
        
        // Cancel any existing animation for this element
        if (this.activeAnimations.has(animationId)) {
            clearTimeout(this.activeAnimations.get(animationId));
        }
        
        const targetTransform = isHover 
            ? 'perspective(1000px) rotateX(-5deg) rotateY(5deg) translateZ(10px) scale(1.05)'
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';
        
        // Apply transform with transition
        element.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        element.style.transform = targetTransform;
        
        // Track animation completion
        const timeoutId = setTimeout(() => {
            this.activeAnimations.delete(animationId);
        }, this.animationDuration);
        
        this.activeAnimations.set(animationId, timeoutId);
    }
    
    /**
     * Animate click transition for navigation links
     */
    animateClickTransition(element, startTime) {
        const animationId = `click-${element.textContent}`;
        
        // Cancel any existing animation
        if (this.activeAnimations.has(animationId)) {
            clearTimeout(this.activeAnimations.get(animationId));
        }
        
        // Quick scale down then back up
        element.style.transition = `transform ${this.animationDuration / 2}ms ease-out`;
        element.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, this.animationDuration / 2);
        
        // Track animation completion
        const timeoutId = setTimeout(() => {
            this.activeAnimations.delete(animationId);
        }, this.animationDuration);
        
        this.activeAnimations.set(animationId, timeoutId);
    }
    
    /**
     * Animate hamburger menu transformation
     */
    animateHamburgerTransformation(startTime) {
        const animationId = 'hamburger-transform';
        
        if (!this.hamburgerButton) return;
        
        const lines = this.hamburgerButton.querySelectorAll('.hamburger-line');
        const isActive = this.mobileMenu.classList.contains('active');
        
        lines.forEach((line, index) => {
            line.style.transition = `transform ${this.animationDuration}ms ease-in-out`;
            
            if (!isActive) {
                // Transform to X shape
                switch (index) {
                    case 0:
                        line.style.transform = 'rotate(45deg) translate(6px, 6px)';
                        break;
                    case 1:
                        line.style.transform = 'opacity(0)';
                        break;
                    case 2:
                        line.style.transform = 'rotate(-45deg) translate(6px, -6px)';
                        break;
                }
            } else {
                // Return to hamburger shape
                line.style.transform = 'none';
            }
        });
        
        // Track animation completion
        const timeoutId = setTimeout(() => {
            this.activeAnimations.delete(animationId);
        }, this.animationDuration);
        
        this.activeAnimations.set(animationId, timeoutId);
    }
    
    /**
     * Get animation duration for testing
     */
    getAnimationDuration() {
        return this.animationDuration;
    }
    
    /**
     * Check if any animations are currently active
     */
    hasActiveAnimations() {
        return this.activeAnimations.size > 0;
    }
    
    /**
     * Get count of active animations
     */
    getActiveAnimationCount() {
        return this.activeAnimations.size;
    }
    
    /**
     * Simulate navigation interaction for testing
     */
    simulateNavigationHover(linkIndex, isHover) {
        if (linkIndex < this.navigationLinks.length) {
            const link = this.navigationLinks[linkIndex];
            const startTime = performance.now();
            this.animate3DHover(link, isHover, startTime);
            return startTime;
        }
        return null;
    }
    
    /**
     * Simulate navigation click for testing
     */
    simulateNavigationClick(linkIndex) {
        if (linkIndex < this.navigationLinks.length) {
            const link = this.navigationLinks[linkIndex];
            const startTime = performance.now();
            this.animateClickTransition(link, startTime);
            return startTime;
        }
        return null;
    }
    
    /**
     * Check if navigation functionality is preserved
     */
    isNavigationFunctional() {
        // Check if all navigation links are still clickable and have href attributes
        const mainMenuLinks = document.querySelectorAll('.navbar .main-menu ul li a');
        const mobileMenuLinks = document.querySelectorAll('.mobile-menu ul li a');
        
        // If no navigation elements exist, consider it functional (graceful degradation)
        if (mainMenuLinks.length === 0 && mobileMenuLinks.length === 0 && !this.hamburgerButton) {
            return true;
        }
        
        const mainMenuFunctional = mainMenuLinks.length === 0 || Array.from(mainMenuLinks).every(link => 
            link && link.href && link.href !== '' && !link.disabled
        );
        
        const mobileMenuFunctional = mobileMenuLinks.length === 0 || Array.from(mobileMenuLinks).every(link => 
            link && link.href && link.href !== '' && !link.disabled
        );
        
        const hamburgerFunctional = !this.hamburgerButton || (
            !this.hamburgerButton.disabled &&
            typeof this.hamburgerButton.addEventListener === 'function'
        );
        
        return mainMenuFunctional && mobileMenuFunctional && hamburgerFunctional;
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Clear all active animations
        this.activeAnimations.forEach(timeoutId => clearTimeout(timeoutId));
        this.activeAnimations.clear();
        
        // Remove enhanced styles from navigation links
        this.navigationLinks.forEach(link => {
            link.style.transition = '';
            link.style.transform = '';
        });
        
        console.log('NavigationEnhancer disposed');
    }
}

/**
 * InteractiveElements - Manages 3D objects in the hero section and interactive hover effects
 * Implements wireframe geometric shapes with mouse parallax and rotation animations
 */
class InteractiveElements {
    constructor(scene, camera, deviceType = 'desktop') {
        this.scene = scene;
        this.camera = camera;
        this.deviceType = deviceType;
        
        // Configuration based on device type
        this.config = this.getDeviceConfig(deviceType);
        
        // 3D Objects
        this.heroObject = null;
        this.heroObjectGroup = null;
        
        // Navigation enhancer
        this.navigationEnhancer = null;
        
        // Animation state
        this.time = 0;
        this.mousePosition = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0, z: 0 };
        this.currentRotation = { x: 0, y: 0, z: 0 };
        
        // Hero section element reference
        this.heroSection = null;
        
        this.init();
    }
    
    /**
     * Get device-specific configuration
     */
    getDeviceConfig(deviceType) {
        const configs = {
            desktop: {
                objectSize: 1.5,
                rotationSpeed: 0.005,
                parallaxStrength: 0.1,
                dampening: 0.95,
                wireframeOpacity: 0.6
            },
            tablet: {
                objectSize: 1.2,
                rotationSpeed: 0.004,
                parallaxStrength: 0.08,
                dampening: 0.92,
                wireframeOpacity: 0.5
            },
            mobile: {
                objectSize: 1.0,
                rotationSpeed: 0.003,
                parallaxStrength: 0.05,
                dampening: 0.9,
                wireframeOpacity: 0.4
            }
        };
        
        return configs[deviceType] || configs.desktop;
    }
    
    /**
     * Initialize interactive elements
     */
    init() {
        try {
            this.heroSection = document.querySelector('.hero');
            
            if (!this.heroSection) {
                console.warn('Hero section not found, skipping interactive elements');
                return;
            }
            
            this.createHeroObject();
            this.addEventListeners();
            
            // Initialize navigation enhancements
            this.navigationEnhancer = new NavigationEnhancer();
            
            console.log(`InteractiveElements initialized for ${this.deviceType}`);
        } catch (error) {
            console.error('Failed to initialize InteractiveElements:', error);
            throw error;
        }
    }
    
    /**
     * Create the main 3D object for the hero section
     */
    createHeroObject() {
        // Create group for the hero object
        this.heroObjectGroup = new THREE.Group();
        
        // Create wireframe icosahedron geometry
        const geometry = new THREE.IcosahedronGeometry(this.config.objectSize, 1);
        
        // Create wireframe material with primary color
        const material = new THREE.MeshBasicMaterial({
            color: 0x7a9b76, // Primary color from design
            wireframe: true,
            transparent: true,
            opacity: this.config.wireframeOpacity
        });
        
        // Create the mesh
        this.heroObject = new THREE.Mesh(geometry, material);
        
        // Position the object to complement the hero content
        // Place it to the right side of the hero section, slightly behind
        this.heroObject.position.set(3, 0, -2);
        
        // Add to group
        this.heroObjectGroup.add(this.heroObject);
        
        // Add group to scene
        this.scene.add(this.heroObjectGroup);
    }
    
    /**
     * Add event listeners for mouse interaction
     */
    addEventListeners() {
        // Mouse move handler for parallax effect
        const handleMouseMove = (event) => {
            if (!this.heroSection) return;
            
            const rect = this.heroSection.getBoundingClientRect();
            const isInHeroSection = (
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom &&
                event.clientX >= rect.left &&
                event.clientX <= rect.right
            );
            
            if (isInHeroSection) {
                // Calculate normalized mouse position within hero section
                this.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                this.mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            }
        };
        
        // Hero section hover handlers
        const handleHeroEnter = () => {
            if (this.heroObject) {
                // Subtle scale up on hover
                this.heroObject.scale.setScalar(1.1);
            }
        };
        
        const handleHeroLeave = () => {
            if (this.heroObject) {
                // Return to normal scale
                this.heroObject.scale.setScalar(1.0);
                // Reset mouse position
                this.mousePosition.x = 0;
                this.mousePosition.y = 0;
            }
        };
        
        // Add event listeners
        window.addEventListener('mousemove', handleMouseMove);
        
        if (this.heroSection) {
            this.heroSection.addEventListener('mouseenter', handleHeroEnter);
            this.heroSection.addEventListener('mouseleave', handleHeroLeave);
        }
        
        // Store references for cleanup
        this.handleMouseMove = handleMouseMove;
        this.handleHeroEnter = handleHeroEnter;
        this.handleHeroLeave = handleHeroLeave;
    }
    
    /**
     * Update interactive elements animation
     */
    update(deltaTime = 0.016) {
        if (!this.heroObject || !this.heroObjectGroup) return;
        
        this.time += deltaTime;
        
        // Continuous slow rotation
        this.currentRotation.x += this.config.rotationSpeed;
        this.currentRotation.y += this.config.rotationSpeed * 0.7;
        this.currentRotation.z += this.config.rotationSpeed * 0.3;
        
        // Apply rotation to the object
        this.heroObject.rotation.x = this.currentRotation.x;
        this.heroObject.rotation.y = this.currentRotation.y;
        this.heroObject.rotation.z = this.currentRotation.z;
        
        // Mouse parallax effect with dampening
        if (this.mousePosition.x !== 0 || this.mousePosition.y !== 0) {
            const targetX = this.mousePosition.x * this.config.parallaxStrength;
            const targetY = this.mousePosition.y * this.config.parallaxStrength;
            
            // Apply dampening for smooth movement
            const currentPos = this.heroObjectGroup.position;
            currentPos.x += (targetX - currentPos.x) * (1 - this.config.dampening);
            currentPos.y += (targetY - currentPos.y) * (1 - this.config.dampening);
        }
    }
    
    /**
     * Get current rotation values (for testing)
     */
    getCurrentRotation() {
        if (!this.heroObject) return { x: 0, y: 0, z: 0 };
        
        return {
            x: this.heroObject.rotation.x,
            y: this.heroObject.rotation.y,
            z: this.heroObject.rotation.z
        };
    }
    
    /**
     * Get current position (for testing)
     */
    getCurrentPosition() {
        if (!this.heroObjectGroup) return { x: 0, y: 0, z: 0 };
        
        return {
            x: this.heroObjectGroup.position.x,
            y: this.heroObjectGroup.position.y,
            z: this.heroObjectGroup.position.z
        };
    }
    
    /**
     * Check if mouse interaction affects object position
     */
    hasMouseInteraction() {
        return this.mousePosition.x !== 0 || this.mousePosition.y !== 0;
    }
    
    /**
     * Simulate mouse interaction (for testing)
     */
    simulateMouseInteraction(x, y) {
        this.mousePosition.x = x;
        this.mousePosition.y = y;
    }
    
    /**
     * Get the hero 3D object reference
     */
    getHeroObject() {
        return this.heroObject;
    }
    
    /**
     * Check if the object is rotating continuously
     */
    isRotating() {
        return this.heroObject && (
            this.currentRotation.x > 0 ||
            this.currentRotation.y > 0 ||
            this.currentRotation.z > 0
        );
    }
    
    /**
     * Get rotation speed configuration
     */
    getRotationSpeed() {
        return this.config.rotationSpeed;
    }
    
    /**
     * Get the navigation enhancer instance
     */
    getNavigationEnhancer() {
        return this.navigationEnhancer;
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Dispose navigation enhancer
        if (this.navigationEnhancer) {
            this.navigationEnhancer.dispose();
            this.navigationEnhancer = null;
        }
        
        // Remove event listeners
        if (this.handleMouseMove) {
            window.removeEventListener('mousemove', this.handleMouseMove);
        }
        
        if (this.heroSection) {
            if (this.handleHeroEnter) {
                this.heroSection.removeEventListener('mouseenter', this.handleHeroEnter);
            }
            if (this.handleHeroLeave) {
                this.heroSection.removeEventListener('mouseleave', this.handleHeroLeave);
            }
        }
        
        // Remove objects from scene
        if (this.heroObjectGroup && this.scene) {
            this.scene.remove(this.heroObjectGroup);
        }
        
        // Dispose geometry and material
        if (this.heroObject) {
            if (this.heroObject.geometry) {
                this.heroObject.geometry.dispose();
            }
            if (this.heroObject.material) {
                this.heroObject.material.dispose();
            }
        }
        
        this.heroObject = null;
        this.heroObjectGroup = null;
        this.heroSection = null;
        
        console.log('InteractiveElements disposed');
    }
}

module.exports = { InteractiveElements, NavigationEnhancer };