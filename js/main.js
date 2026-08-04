import { pinnedRepositories } from '../data/pinned-repos.js';

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        markCurrentPage();
        loadGitHubRepos();
    });

    function markCurrentPage() {
        var filename = window.location.pathname.split('/').pop() || 'index.html';

        document.querySelectorAll('.main-menu a').forEach(function (link) {
            if (link.getAttribute('href') === filename) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    function loadGitHubRepos() {
        var container = document.getElementById('repo-container');

        if (!container) {
            return;
        }

        if (!pinnedRepositories.length) {
            var status = document.createElement('p');
            status.className = 'repo-status';
            status.textContent = 'No pinned projects are available.';
            container.appendChild(status);
            return;
        }

        pinnedRepositories.forEach(function (repository) {
            container.appendChild(createRepositoryEntry(repository));
        });
    }

    function createRepositoryEntry(repository) {
        var entry = document.createElement('article');
        var heading = document.createElement('h3');
        var link = document.createElement('a');
        var description = document.createElement('p');
        var metadata = document.createElement('p');

        entry.className = 'repo';
        link.href = repository.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = repository.name;
        heading.appendChild(link);

        description.className = 'repo-description';
        description.textContent = repository.description || 'Public research and software project.';

        metadata.className = 'repo-meta';
        metadata.textContent = repository.language || 'Repository';

        if (repository.stars) {
            metadata.textContent += ' / ' + repository.stars + (repository.stars === 1 ? ' star' : ' stars');
        }

        entry.appendChild(heading);
        entry.appendChild(description);
        entry.appendChild(metadata);

        return entry;
    }
}());
