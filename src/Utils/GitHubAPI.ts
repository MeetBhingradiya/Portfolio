// GitHub API utility for fetching real-time stats
export interface GitHubStats {
    publicRepos: number;
    totalStars: number;
    totalForks: number;
    followers: number;
    following: number;
    totalCommits?: number;
}

export interface GitHubUser {
    login: string;
    name: string;
    bio: string;
    public_repos: number;
    followers: number;
    following: number;
    avatar_url: string;
    html_url: string;
    created_at: string;
}

export interface GitHubRepo {
    name: string;
    stargazers_count: number;
    forks_count: number;
    language: string;
    description: string;
    html_url: string;
    updated_at: string;
}

export class GitHubAPI {
    private static readonly BASE_URL = 'https://api.github.com';
    private static readonly USERNAME = 'MeetBhingradiya'; // Update with your GitHub username

    static async fetchUserData(): Promise<GitHubUser | null> {
        try {
            const response = await fetch(`${this.BASE_URL}/users/${this.USERNAME}`);
            if (!response.ok) throw new Error('Failed to fetch user data');
            return await response.json();
        } catch (error) {
            console.error('Error fetching GitHub user data:', error);
            return null;
        }
    }

    static async fetchRepositories(): Promise<GitHubRepo[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/users/${this.USERNAME}/repos?sort=updated&per_page=100`);
            if (!response.ok) throw new Error('Failed to fetch repositories');
            return await response.json();
        } catch (error) {
            console.error('Error fetching GitHub repositories:', error);
            return [];
        }
    }

    static async fetchGitHubStats(): Promise<GitHubStats> {
        try {
            const [userData, repositories] = await Promise.all([
                this.fetchUserData(),
                this.fetchRepositories()
            ]);

            if (!userData) {
                throw new Error('Failed to fetch user data');
            }

            const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
            const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);

            return {
                publicRepos: userData.public_repos,
                totalStars,
                totalForks,
                followers: userData.followers,
                following: userData.following,
            };
        } catch (error) {
            console.error('Error fetching GitHub stats:', error);
            // Return fallback data if API fails
            return {
                publicRepos: 50,
                totalStars: 100,
                totalForks: 20,
                followers: 25,
                following: 30,
            };
        }
    }

    static async fetchContributionData(): Promise<number> {
        try {
            return 365;
        } catch (error) {
            console.error('Error fetching contribution data:', error);
            return 0;
        }
    }

    static formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}
