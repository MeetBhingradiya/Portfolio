const DescriptionMap: Record<string, string> = {
    'Config\\index.ts': 'This file contains configuration settings for the project.',
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