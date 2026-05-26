(function () {
    'use strict';

    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    var revealObserver = null;
    var particleCleanup = null;

    document.addEventListener('DOMContentLoaded', function () {
        initNavigation();
        markCurrentPage();
        initReveals();
        initParticleBackground();
        loadGitHubRepos();
    });

    function initNavigation() {
        var navbar = document.querySelector('.navbar');
        var button = document.querySelector('.hamburger-button');
        var menu = document.querySelector('.mobile-menu');

        if (navbar) {
            var syncNavbar = function () {
                navbar.classList.toggle('is-scrolled', window.scrollY > 12);
            };

            syncNavbar();
            window.addEventListener('scroll', syncNavbar, { passive: true });
        }

        if (!button || !menu) {
            return;
        }

        button.type = 'button';
        button.setAttribute('aria-label', 'Open navigation menu');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'mobile-menu');
        menu.id = 'mobile-menu';
        menu.setAttribute('aria-hidden', 'true');

        var backdrop = document.createElement('button');
        backdrop.type = 'button';
        backdrop.className = 'mobile-menu-backdrop';
        backdrop.setAttribute('aria-label', 'Close navigation menu');
        document.body.appendChild(backdrop);

        var setMenuOpen = function (open) {
            button.classList.toggle('is-active', open);
            menu.classList.toggle('active', open);
            backdrop.classList.toggle('is-visible', open);
            document.body.classList.toggle('menu-open', open);
            button.setAttribute('aria-expanded', String(open));
            button.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
            menu.setAttribute('aria-hidden', String(!open));
        };

        button.addEventListener('click', function () {
            setMenuOpen(!menu.classList.contains('active'));
        });
        backdrop.addEventListener('click', function () {
            setMenuOpen(false);
        });
        menu.addEventListener('click', function (event) {
            if (event.target.closest('a')) {
                setMenuOpen(false);
            }
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 670) {
                setMenuOpen(false);
            }
        });
    }

    function markCurrentPage() {
        var filename = window.location.pathname.split('/').pop() || 'index.html';

        document.querySelectorAll('.main-menu a, .mobile-menu a').forEach(function (link) {
            var href = link.getAttribute('href');

            if (href === filename) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    function initReveals() {
        var elements = document.querySelectorAll('.hero-content, .section-heading, .about-grid, .page-hero .container, .content-card, .repo-container, .site-footer');

        elements.forEach(function (element) {
            revealElementWhenReady(element);
        });
    }

    function revealElementWhenReady(element) {
        element.classList.add('reveal-on-scroll');

        if ((reducedMotion && reducedMotion.matches) || !('IntersectionObserver' in window)) {
            element.classList.add('is-visible');
            return;
        }

        if (!revealObserver) {
            revealObserver = new IntersectionObserver(function (entries, observer) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '0px 0px -40px',
                threshold: 0.12
            });
        }

        revealObserver.observe(element);
    }

    function initParticleBackground() {
        if ((reducedMotion && reducedMotion.matches) || typeof THREE === 'undefined') {
            return;
        }

        try {
            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 1000);
            var renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: false,
                powerPreference: 'low-power'
            });
            var particleCount = window.innerWidth < 768 ? 120 : 240;
            var geometry = new THREE.BufferGeometry();
            var positions = new Float32Array(particleCount * 3);
            var material;
            var points;
            var frameId = null;
            var lastTime = 0;

            for (var index = 0; index < positions.length; index += 3) {
                positions[index] = (Math.random() - 0.5) * 19;
                positions[index + 1] = (Math.random() - 0.5) * 13;
                positions[index + 2] = (Math.random() - 0.5) * 10;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            material = new THREE.PointsMaterial({
                color: 0x91b18b,
                opacity: 0.16,
                size: 0.055,
                transparent: true
            });
            points = new THREE.Points(geometry, material);
            scene.add(points);
            camera.position.z = 6;

            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.domElement.className = 'particle-background';
            renderer.domElement.setAttribute('aria-hidden', 'true');
            document.body.appendChild(renderer.domElement);

            var draw = function (time) {
                if (document.hidden) {
                    frameId = null;
                    return;
                }

                var elapsed = lastTime ? Math.min(time - lastTime, 34) : 16;
                lastTime = time;
                points.rotation.y += elapsed * 0.000008;
                points.rotation.x += elapsed * 0.000003;
                renderer.render(scene, camera);
                frameId = window.requestAnimationFrame(draw);
            };

            var start = function () {
                if (!frameId && !document.hidden) {
                    lastTime = 0;
                    frameId = window.requestAnimationFrame(draw);
                }
            };

            var resize = function () {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };

            var visibilityChange = function () {
                if (document.hidden && frameId) {
                    window.cancelAnimationFrame(frameId);
                    frameId = null;
                } else {
                    start();
                }
            };

            window.addEventListener('resize', resize);
            document.addEventListener('visibilitychange', visibilityChange);
            start();

            particleCleanup = function () {
                if (frameId) {
                    window.cancelAnimationFrame(frameId);
                }
                window.removeEventListener('resize', resize);
                document.removeEventListener('visibilitychange', visibilityChange);
                geometry.dispose();
                material.dispose();
                renderer.dispose();
                renderer.domElement.remove();
            };
        } catch (error) {
            console.warn('Background animation could not be initialized.', error);
        }
    }

    async function loadGitHubRepos() {
        var container = document.getElementById('repo-container');

        if (!container) {
            return;
        }

        var status = document.createElement('p');
        status.className = 'repo-status';
        status.textContent = 'Loading public projects...';
        container.appendChild(status);

        try {
            var response = await fetch('https://api.github.com/users/filippogiovagnini/repos?sort=updated&per_page=12');

            if (!response.ok) {
                throw new Error('Repository request failed');
            }

            var repos = await response.json();
            var publicRepos = repos.filter(function (repo) {
                return !repo.private && !repo.fork;
            });

            status.remove();

            if (!publicRepos.length) {
                status.textContent = 'Projects will appear here soon.';
                container.appendChild(status);
                return;
            }

            publicRepos.forEach(function (repo) {
                var card = createRepositoryCard(repo);
                container.appendChild(card);
                revealElementWhenReady(card);
            });
        } catch (error) {
            status.textContent = 'Projects could not be loaded right now. Visit GitHub for the full list.';

            var link = document.createElement('a');
            link.href = 'https://github.com/filippogiovagnini';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = ' Open GitHub.';
            status.appendChild(link);
        }
    }

    function createRepositoryCard(repo) {
        var card = document.createElement('article');
        var heading = document.createElement('h3');
        var link = document.createElement('a');
        var description = document.createElement('p');
        var language = document.createElement('p');

        card.className = 'repo';
        link.href = repo.html_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = repo.name;
        heading.appendChild(link);
        description.textContent = repo.description || 'No description available.';
        language.textContent = repo.language ? 'Language: ' + repo.language : 'Language: not specified';
        card.appendChild(heading);
        card.appendChild(description);
        card.appendChild(language);

        return card;
    }

    window.addEventListener('pagehide', function () {
        if (particleCleanup) {
            particleCleanup();
        }
    });
}());
