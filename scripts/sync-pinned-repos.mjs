import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME || process.env.GITHUB_REPOSITORY_OWNER || 'filippogiovagnini';

if (!token) {
    throw new Error('GITHUB_TOKEN is required to refresh pinned repositories.');
}

const query = `
    query PinnedRepositories($login: String!) {
        user(login: $login) {
            url
            pinnedItems(first: 6, types: REPOSITORY) {
                nodes {
                    ... on Repository {
                        name
                        owner {
                            login
                        }
                        url
                        description
                        isPrivate
                        stargazerCount
                        primaryLanguage {
                            name
                        }
                    }
                }
            }
        }
    }
`;

const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'filippogiovagnini.github.io',
        'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify({ query, variables: { login: username } })
});

if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed with status ${response.status}.`);
}

const result = await response.json();

if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join('; '));
}

if (!result.data?.user) {
    throw new Error(`GitHub user ${username} was not found.`);
}

const repositories = result.data.user.pinnedItems.nodes
    .filter((repository) => repository && !repository.isPrivate)
    .map((repository) => ({
        name: repository.name,
        owner: repository.owner.login,
        url: repository.url,
        description: repository.description,
        language: repository.primaryLanguage?.name || null,
        stars: repository.stargazerCount
    }));

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(scriptDirectory, '..', 'data');
const outputPath = path.join(outputDirectory, 'pinned-repos.js');
const output = [
    `export const githubProfileUrl = ${JSON.stringify(result.data.user.url)};`,
    '',
    `export const pinnedRepositories = ${JSON.stringify(repositories, null, 4)};`,
    ''
].join('\n');

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, output, 'utf8');

console.log(`Wrote ${repositories.length} pinned repositories to ${outputPath}.`);
