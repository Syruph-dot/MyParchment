import {Page} from "../domain/page";
import {TextBlock} from "../domain/text-block";
export interface ParchmentService {
    createNotebook(notebookId: string): void;
    getPage(pageId: string): Page | undefined;
    createLooseLeafPage(pageId: string, blocks: TextBlock[], maxCharacterCount: number): void;
    updatePage(pageId: string, blocks: TextBlock[]): void;
    tearOutPage(pageId: string): void;
}