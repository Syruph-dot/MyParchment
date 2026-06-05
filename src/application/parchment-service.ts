import {NotebookPage, Page} from "../domain/page";
import {Notebook} from "../domain/notebook";
import {TextBlock} from "../domain/text-block";
import {ClipGroup} from "../domain/clipgroup";
export interface ParchmentService {
    createNotebook(notebookId: string): void;
    getPage(pageId: string): Page | undefined;
    getNotebook(notebookId: string): Notebook | undefined;
    getCurrentNotebookPage(notebookId: string): NotebookPage | undefined;
    goToNextPage(notebookId: string): void;
    goToPrevPage(notebookId: string): void;
    createLooseLeafPage(pageId: string, blocks: TextBlock[], maxCharacterCount: number): void;
    updatePage(pageId: string, blocks: TextBlock[]): void;
    tearOutPage(pageId: string): void;
    createClipGroup(clipGroupId: string): void;
    getClipGroup(clipGroupId: string): ClipGroup | undefined;
    clipLooseleaf(pageId: string, clipGroupId: string):void;
}