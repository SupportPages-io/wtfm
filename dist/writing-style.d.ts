export declare const writingStylePresets: Record<string, {
    label: string;
    hint: string;
}>;
export declare const defaultWritingStyle = "friendly";
/** A preset keyword expands to its guidance; anything else is free-form guidance used verbatim. */
export declare function composeWritingStyle(tone?: string | null): string;
