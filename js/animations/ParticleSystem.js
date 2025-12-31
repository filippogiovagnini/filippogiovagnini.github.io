const THREE = require('three');

/**
 * ParticleSystem - Creates and manages background particle animations using BufferGeometry
 * Implements device-aware particle scaling and color palette compliance
 */
class ParticleSystem {
    constructor(scene, deviceType = 'desktop') {
        this.scene = scene;
        this.deviceType = deviceType;
        
        // Device-based configuration
        this.config = this.getDeviceConfig(deviceType);
        
        // Particle system components
        this.particles = null;
        this.geometry = null;
        this.material = null;
        this.points = null;
        
        // Animation state
        this.time = 0;
        this.mousePosition = { x: 0, y: 0 };
        
        // Particle data arrays
        this.positions = null;
        this.velocities = null;
        this.colors = null;
        this.sizes = null;
        this.originalPositions = null;
        
        this.init();
    }
    
    /**
     * Get device-specific configuration
     */
    getDeviceConfig(deviceType) {
        const configs = {
            desktop: { 
                particleCount: 2000, 
                size: { min: 1, max: 3 },
                speed: { min: 0.001, max: 0.003 },
                mouseInfluence: 0.1
            },
            tablet: { 
                particleCount: 1000, 
                size: { min: 1, max: 2.5 },
                speed: { min: 0.001, max: 0.0025 },
                mouseInfluence: 0.08
            },
            mobile: { 
                particleCount: 500, 
                size: { min: 0.8, max: 2 },
                speed: { min: 0.0008, max: 0.002 },
                mouseInfluence: 0.05
            }
        };
        
        return configs[deviceType] || configs.desktop;
    }
    
    /**
     * Initialize the particle system
     */
    init() {
        try {
            this.createParticleData();
            this.createGeometry();
            this.createMaterial();
            this.createPoints();
            this.addToScene();
            
            // Add mouse event listeners
            this.addEventListeners();
            
            console.log(`ParticleSystem initialized with ${this.config.particleCount} particles for ${this.deviceType}`);
        } catch (error) {
            console.error('Failed to initialize ParticleSystem:', error);
            throw error;
        }
    }
    
    /**
     * Create particle data arrays
     */
    createParticleData() {
        const count = this.config.particleCount;
        
        // Initialize typed arrays for better performance
        this.positions = new Float32Array(count * 3);
        this.velocities = new Float32Array(count * 3);
        this.colors = new Float32Array(count * 3);
        this.sizes = new Float32Array(count);
        this.originalPositions = new Float32Array(count * 3);
        
        // Primary color palette based on #7a9b76
        const colorPalette = [
            { r: 0.478, g: 0.608, b: 0.463 }, // #7a9b76 (primary)
            { r: 0.353, g: 0.478, b: 0.337 }, // #5a7a56 (darker)
            { r: 0.604, g: 0.722, b: 0.588 }, // #9ab896 (lighter)
            { r: 0.416, g: 0.545, b: 0.400 }, // #6a8b66 (medium)
        ];
        
        // Generate particle data
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Random positions within viewport bounds
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 10;
            
            this.positions[i3] = x;
            this.positions[i3 + 1] = y;
            this.positions[i3 + 2] = z;
            
            // Store original positions for mouse interaction
            this.originalPositions[i3] = x;
            this.originalPositions[i3 + 1] = y;
            this.originalPositions[i3 + 2] = z;
            
            // Random velocities for floating movement
            this.velocities[i3] = (Math.random() - 0.5) * this.config.speed.max;
            this.velocities[i3 + 1] = (Math.random() - 0.5) * this.config.speed.max;
            this.velocities[i3 + 2] = (Math.random() - 0.5) * this.config.speed.max;
            
            // Random color from palette
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            this.colors[i3] = color.r;
            this.colors[i3 + 1] = color.g;
            this.colors[i3 + 2] = color.b;
            
            // Random size within range
            this.sizes[i] = this.config.size.min + Math.random() * (this.config.size.max - this.config.size.min);
        }
    }
    
    /**
     * Create BufferGeometry for particles
     */
    createGeometry() {
        this.geometry = new THREE.BufferGeometry();
        
        // Set attributes
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    }
    
    /**
     * Create material for particles
     */
    createMaterial() {
        this.material = new THREE.PointsMaterial({
            size: 2,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
    }
    
    /**
     * Create Points object
     */
    createPoints() {
        this.points = new THREE.Points(this.geometry, this.material);
    }
    
    /**
     * Add points to scene
     */
    addToScene() {
        if (this.scene && this.points) {
            this.scene.add(this.points);
        }
    }
    
    /**
     * Add event listeners for mouse interaction
     */
    addEventListeners() {
        const updateMousePosition = (event) => {
            this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        
        window.addEventListener('mousemove', updateMousePosition);
        
        // Store reference for cleanup
        this.updateMousePosition = updateMousePosition;
    }
    
    /**
     * Update particle animation
     */
    update(deltaTime = 0.016) {
        if (!this.geometry || !this.positions) return;
        
        this.time += deltaTime;
        const count = this.config.particleCount;
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Floating movement
            this.positions[i3] += this.velocities[i3];
            this.positions[i3 + 1] += this.velocities[i3 + 1];
            this.positions[i3 + 2] += this.velocities[i3 + 2];
            
            // Mouse interaction - particles move away from mouse
            const mouseInfluence = this.config.mouseInfluence;
            const mouseX = this.mousePosition.x * 10;
            const mouseY = this.mousePosition.y * 10;
            
            const dx = this.positions[i3] - mouseX;
            const dy = this.positions[i3 + 1] - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 3) {
                const force = (3 - distance) * mouseInfluence;
                this.positions[i3] += (dx / distance) * force;
                this.positions[i3 + 1] += (dy / distance) * force;
            }
            
            // Boundary wrapping
            if (this.positions[i3] > 10) this.positions[i3] = -10;
            if (this.positions[i3] < -10) this.positions[i3] = 10;
            if (this.positions[i3 + 1] > 10) this.positions[i3 + 1] = -10;
            if (this.positions[i3 + 1] < -10) this.positions[i3 + 1] = 10;
            if (this.positions[i3 + 2] > 5) this.positions[i3 + 2] = -5;
            if (this.positions[i3 + 2] < -5) this.positions[i3 + 2] = 5;
        }
        
        // Update geometry
        this.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Get particle count for current device
     */
    getParticleCount() {
        return this.config.particleCount;
    }
    
    /**
     * Get color palette used by particles
     */
    getColorPalette() {
        return [
            '#7a9b76', // primary
            '#5a7a56', // darker
            '#9ab896', // lighter
            '#6a8b66'  // medium
        ];
    }
    
    /**
     * Check if a color is within the defined palette range
     */
    isColorInPalette(r, g, b) {
        const tolerance = 0.01;
        const palette = [
            { r: 0.478, g: 0.608, b: 0.463 },
            { r: 0.353, g: 0.478, b: 0.337 },
            { r: 0.604, g: 0.722, b: 0.588 },
            { r: 0.416, g: 0.545, b: 0.400 }
        ];
        
        return palette.some(color => 
            Math.abs(color.r - r) < tolerance &&
            Math.abs(color.g - g) < tolerance &&
            Math.abs(color.b - b) < tolerance
        );
    }
    
    /**
     * Get current particle positions (for testing)
     */
    getParticlePositions() {
        return this.positions ? Array.from(this.positions) : [];
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.updateMousePosition) {
            window.removeEventListener('mousemove', this.updateMousePosition);
        }
        
        if (this.points && this.scene) {
            this.scene.remove(this.points);
        }
        
        if (this.geometry) {
            this.geometry.dispose();
        }
        
        if (this.material) {
            this.material.dispose();
        }
        
        this.positions = null;
        this.velocities = null;
        this.colors = null;
        this.sizes = null;
        this.originalPositions = null;
        
        console.log('ParticleSystem disposed');
    }
}

module.exports = ParticleSystem;