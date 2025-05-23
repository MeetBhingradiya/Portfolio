type CaseTransformer = (input: string) => string;

interface ChangeCaseFunctions {
    camel: CaseTransformer
    constant: CaseTransformer
    dot: CaseTransformer
    kebab: CaseTransformer
    lower: CaseTransformer
    lowerFirst: CaseTransformer
    no: CaseTransformer
    param: CaseTransformer
    pascal: CaseTransformer
    path: CaseTransformer
    sentence: CaseTransformer
    snake: CaseTransformer
    swap: CaseTransformer
    title: CaseTransformer
    upper: CaseTransformer
    upperFirst: CaseTransformer
}

const changeCase: ChangeCaseFunctions = {
    camel: (input) => input
        .replace(/[-_\.\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
        .replace(/^(.)/, (chr) => chr.toLowerCase()),

    constant: (input) => input
        .replace(/[-_\.\s]+/g, '_')
        .toUpperCase(),

    dot: (input) => input
        .replace(/[-_\s]+/g, '.')
        .toLowerCase(),

    kebab: (input) => input
        .replace(/[-_\.\s]+/g, '-')
        .toLowerCase(),

    lower: (input) => input.toLowerCase(),

    lowerFirst: (input) => input.charAt(0).toLowerCase() + input.slice(1),

    no: (input) => input.replace(/[-_\.]+/g, ' ').toLowerCase(),

    param: (input) => input
        .replace(/[-_\.\s]+/g, '-')
        .toLowerCase(),

    pascal: (input) => input
        .replace(/[-_\.\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
        .replace(/^(.)/, (chr) => chr.toUpperCase()),

    path: (input) => input
        .replace(/[-_\.\s]+/g, '/')
        .toLowerCase(),

    sentence: (input) => input
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (chr) => chr.toUpperCase()),

    snake: (input) => input
        .replace(/[-_\.\s]+/g, '_')
        .toLowerCase(),

    swap: (input) => input
        .split('')
        .map((char) => (char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()))
        .join(''),

    title: (input) => input
        .replace(/\b\w/g, (chr) => chr.toUpperCase())
        .replace(/[-_\.]+/g, ' '),

    upper: (input) => input.toUpperCase(),

    upperFirst: (input) => input.charAt(0).toUpperCase() + input.slice(1),
};

export {
    changeCase
}

export type {
    CaseTransformer,
    ChangeCaseFunctions
}
