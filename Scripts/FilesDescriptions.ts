const DescriptionMap: Record<string, string> = {
    'sitemap-utils.ts': 'This file contains utility functions for generating XML sitemaps.',
    'index.ts': 'This is the entry point for the application.',
    'Config\\index.ts': 'This file contains configuration settings for the project.',
};

// Function to generate a description
function generateDescription(filename: string): string {
    return (
        DescriptionMap[filename] ||
        `No description available for ${filename}.`
    );
}

export {
    generateDescription
}