import {Page} from "../domain/page";
import {TextBlock} from "../domain/text-block";
import {ClipGroup} from "../domain/clipgroup";
export interface ParchmentService {
    createNotebook(notebookId: string): void;
    getPage(pageId: string): Page | undefined;
    createLooseLeafPage(pageId: string, blocks: TextBlock[], maxCharacterCount: number): void;
    updatePage(pageId: string, blocks: TextBlock[]): void;
    tearOutPage(pageId: string): void;
    createClipGroup(clipGroupId: string): void;
    clipLooseleaf(pageId: string, clipGroupId: string):void;
}