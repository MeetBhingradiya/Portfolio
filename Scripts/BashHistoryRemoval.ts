import fs from "fs";

const FileAt = "./Scripts/History.txt";

function RemoveDublicateLines(FileData: string) {
    const Lines = FileData.split("\n");
    const UniqueLines = new Set<string>();
    const FilteredLines = Lines.filter((Line) => {
        const Trimmed = Line.trim();
        if (UniqueLines.has(Trimmed)) {
            return false;
        } else {
            UniqueLines.add(Trimmed);
            return true;
        }
    });
    return FilteredLines.join("\n");
}

function RemoveEmptyLines(FileData: string) {
    const Lines = FileData.split("\n");
    const FilteredLines = Lines.filter((Line) => Line.trim() !== "");
    return FilteredLines.join("\n");
}

function RemoveLinesWithSpecificWords(FileData: string, Words: string[]) {
    const Lines = FileData.split("\n");
    const FilteredLines = Lines.filter((Line) => {
        return !Words.some((Word) => Line.includes(Word));
    });
    return FilteredLines.join("\n");
}

function RemoveLinesWithSpecificPatterns(
    FileData: string,
    Patterns: (RegExp | string)[]
): string {
    if (Patterns.length === 0) return FileData;

    // Convert string patterns to RegExp
    const RegexPatterns: RegExp[] = Patterns.map((pattern) =>
        typeof pattern === "string" ? new RegExp(pattern, "i") : pattern
    );

    const Lines = FileData.split("\n");
    const FilteredLines = Lines.filter((Line) => {
        return !RegexPatterns.some((Pattern) => Pattern.test(Line));
    });

    return FilteredLines.join("\n");
}

(function Main() {
    const FileData = fs.readFileSync(FileAt, "utf-8");

    // Remove duplicate lines
    const NoDublicateLines = RemoveDublicateLines(FileData);

    // Remove empty lines
    const NoEmptyLines = RemoveEmptyLines(NoDublicateLines);

    // Remove lines with specific words
    const WordsToRemove = ["cls"];
    const NoSpecificWords = RemoveLinesWithSpecificWords(
        NoEmptyLines,
        WordsToRemove
    );

    // Remove lines with specific patterns
    const PatternsToRemove = [/^\s*$/, "neeta"]; // Example regex pattern to remove empty lines
    const CleanedData = RemoveLinesWithSpecificPatterns(
        NoSpecificWords,
        PatternsToRemove
    );

    // Write the cleaned data back to the file
    fs.writeFileSync(FileAt, CleanedData, "utf-8");
})();
