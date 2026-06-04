import { TextBlock } from "./text-block";
export type Page={
    readonly id: string;
    blocks: TextBlock[];
    readonly maxCharacterCount: number;
};