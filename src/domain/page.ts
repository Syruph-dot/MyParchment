import { TextBlock } from "./text-block";


type BasePage={
    readonly id: string;
    blocks: TextBlock[];
    readonly maxCharacterCount: number;
}

export type NotebookPage = BasePage & {
    readonly kind: "notebook-page";
    readonly notebookId: string;
    readonly slotIndex: number;
};
export type LooseLeafPage = BasePage & {
    readonly kind: "loose-leaf-page";
};

export type ClipGroupPage = BasePage & {
    readonly kind: "clip-group-page";
    readonly clipGroupId: string;
};


export type Page = NotebookPage | LooseLeafPage | ClipGroupPage;