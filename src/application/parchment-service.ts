import {Page} from "../domain/page";
import {TextBlock} from "../domain/text-block";
export interface ParchmentService {
    createNotebook(): string;
    getPage(pageId: string): Page | undefined;
    updatePage(pageId: string, blocks: TextBlock[]): void;
}