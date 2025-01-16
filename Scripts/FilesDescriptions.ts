const DescriptionMap: Record<string, string> = {
    'Config\\index.ts': 'configuration settings for the project.',
    'Utils\\Sitemap.ts': 'utility functions for generating sitemaps.',
    'Config\\SocialLinks.tsx': 'social media links for the landing page.',
};

function generateDescription(filename: string): string {
    return (
        DescriptionMap[filename] ||
        `Currently, there is no description available.`
    );
}

export {
    generateDescription,
    DescriptionMap
}