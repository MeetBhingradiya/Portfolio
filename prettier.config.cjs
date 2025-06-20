/** @type {import('prettier').Config} */
const config = {
    useTabs: false,
    tabWidth: 4,
    singleAttributePerLine: true,
    bracketSameLine: true,
    bracketSpacing: true,
    semi: true,
    trailingComma: "none",
    proseWrap: "always",
    singleQuote: false,
    quoteProps: "consistent",
    jsxSingleQuote: false,
    arrowParens: 'always',
    endOfLine: 'auto',
    htmlWhitespaceSensitivity: "css",
    vueIndentScriptAndStyle: true,
    embeddedLanguageFormatting: "auto"
};

module.exports = config;