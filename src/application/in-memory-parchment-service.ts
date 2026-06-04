import {ParchmentService} from "./parchment-service";
import {Page} from "../domain/page";
import {TextBlock} from "../domain/text-block";
export class InMemoryParchmentService implements ParchmentService {
    private pages: Map<string,Page> = new Map();
    private trimBlocksToFit(
        blocks: TextBlock[],
        maxCharacterCount: number
    ): TextBlock[] {
        const trimmedBlocks: TextBlock[] = [];
        let currentCharacterCount = 0;
        for (const block of blocks) {
            currentCharacterCount += block.text.length;

            if (currentCharacterCount > maxCharacterCount) {
            const remainingCharacters =
                maxCharacterCount - (currentCharacterCount - block.text.length);

            if (remainingCharacters > 0) {
                trimmedBlocks.push({
                id: block.id,
                text: block.text.slice(0, remainingCharacters),
                });
            }

            console.warn("Page content exceeded max character count and was trimmed.");
            break;
            } else {
            trimmedBlocks.push(block);
            }
        }

        return trimmedBlocks;
    }

    createNotebook(): string {
        return "notebook-1";
    }
    getPage(pageId: string): Page | undefined {
        return this.pages.get(pageId);
    }
    updatePage(pageId: string, blocks: TextBlock[]): void {
        const maxCharacterCount = this.pages.get(pageId)?.maxCharacterCount || 2000;
        const trimmedBlocks = this.trimBlocksToFit(blocks, maxCharacterCount);
        const page: Page = {
            id: pageId,
            blocks: trimmedBlocks,
            maxCharacterCount,
        };

        this.pages.set(pageId, page);
    }
    

}