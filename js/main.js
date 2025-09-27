

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerButton = document.querySelector('.hamburger-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    hamburgerButton.addEventListener('click', () =>
        mobileMenu.classList.toggle('active'));
})


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