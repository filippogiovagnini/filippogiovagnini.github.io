
// Simple initialization without modules for now
// This will be replaced with proper module loading once Parcel is configured correctly

// Global animation manager instance
let animationManager = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for Three.js...');
    
    // Initialize existing functionality
    const hamburgerButton = document.querySelector('.hamburger-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (hamburgerButton && mobileMenu) {
        hamburgerButton.addEventListener('click', () =>
            mobileMenu.classList.toggle('active'));
    }
    
    // Check if Three.js is available
    if (typeof THREE !== 'undefined') {
        console.log('Three.js is available, initializing basic animations...');
        initBasicAnimations();
    } else {
        console.log('Three.js not loaded, skipping animations');
    }
});

// Basic animation initialization without modules
function initBasicAnimations() {
    try {
        // Create a simple particle system
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '-1';
        renderer.domElement.style.pointerEvents = 'none';
        document.body.appendChild(renderer.domElement);
        
        // Create simple particles
        const particleCount = window.innerWidth < 768 ? 500 : 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = (Math.random() - 0.5) * 20;
            positions[i + 2] = (Math.random() - 0.5) * 20;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x4a5a46, // Darker green color for better text readability
            size: 1.5, // Slightly smaller particles
            transparent: true,
            opacity: 0.3 // Lower opacity for subtlety
        });
        
        const particleSystem = new THREE.Points(particles, material);
        scene.add(particleSystem);
        
        camera.position.z = 5;
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            particleSystem.rotation.y += 0.001;
            particleSystem.rotation.x += 0.0005;
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        console.log('Basic animations initialized successfully!');
        
    } catch (error) {
        console.error('Error initializing basic animations:', error);
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    // Basic cleanup will be handled by browser
    console.log('Page unloading...');
});


async function fetchGitHubRepos() {
    const response = await fetch('https://api.github.com/users/filippogiovagnini/repos');
    const repos = await response.json();
    const repoContainer = document.getElementById('repo-container');
    repos.filter(repo => !repo.private).forEach(repo => { // Filter only public repositories
        const repoElement = document.createElement('div');
        repoElement.className = 'repo';
        repoElement.innerHTML = `
            <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
            <p>${repo.description || 'No description available'}</p>
            <p><strong>Language:</strong> ${repo.language || 'N/A'}</p>
        `;
        repoContainer.appendChild(repoElement);
    });
}

fetchGitHubRepos();