import {ParchmentService} from "./parchment-service";
import {Page,NotebookPage,LooseLeafPage} from "../domain/page";
import {TextBlock} from "../domain/text-block";
import {Notebook} from "../domain/notebook";


export class InMemoryParchmentService implements ParchmentService {
    private notebooks: Map<string, Notebook> = new Map();
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
    private registerPage(page: Page): void {
        this.pages.set(page.id, page);
    }
    private unregisterPage(pageId: string): void {
        this.pages.delete(pageId);
    }

    private requireNotebookPage(pageId: string): NotebookPage {
        const page = this.pages.get(pageId);
        if (!page || page.kind !== "notebook-page") {
            throw new Error(`Page with id ${pageId} is not a notebook page.`);
        }
        return page;
    }
    private requireNotebookByPage(page: NotebookPage): Notebook {
        const notebook = this.notebooks.get(page.notebookId);
        if (!notebook) {
            throw new Error(`Notebook with id ${page.notebookId} not found.`);
        }
        return notebook;
    }
    private requireUniquePageId(pageId: string): void {
        if (this.pages.has(pageId)) {
            throw new Error(`Page with id ${pageId} already exists.`);
        }
    }
    private requireUniqueNotebookId(notebookId: string): void {
        if (this.notebooks.has(notebookId)) {
            throw new Error(`Notebook with id ${notebookId} already exists.`);
        }
    }
    
    createNotebook(notebookId: string): void {
        this.requireUniqueNotebookId(notebookId);
        const newNotePages: NotebookPage[] = [];
        for (let i=0;i<60;i++){
            const page: NotebookPage={
                id: `notebook-${notebookId}-page-${i}`,
                blocks: [],
                maxCharacterCount: 2000,
                kind: "notebook-page",
                notebookId: notebookId,
                slotIndex: i,
            }
            newNotePages.push(page);
            this.registerPage(page);
        }
        const notebook: Notebook={
            id: notebookId,
            pages: newNotePages,
        }
        this.notebooks.set(notebook.id, notebook);
    }
    
    getPage(pageId: string): Page | undefined {
        return this.pages.get(pageId);
    }

    createLooseLeafPage(pageId: string, blocks: TextBlock[], maxCharacterCount: number): void {
        this.requireUniquePageId(pageId);
        const page: LooseLeafPage = {
            id: pageId,
            blocks: this.trimBlocksToFit(blocks, maxCharacterCount),
            maxCharacterCount: maxCharacterCount,
            kind: "loose-leaf-page"
        };
        this.registerPage(page);
    }

    updatePage(pageId: string, blocks: TextBlock[]): void {
        const thePage=this.pages.get(pageId);
        if (!thePage){
            console.warn(`Page with id ${pageId} not found. Update operation skipped.`);
            return;
        }else{
            const trimmedBlocks = this.trimBlocksToFit(blocks, thePage.maxCharacterCount);
            thePage.blocks = trimmedBlocks;
        }
        
    }
    tearOutPage(pageId: string): void {
        const page = this.requireNotebookPage(pageId);
        const notebook = this.requireNotebookByPage(page);
        notebook.pages=notebook.pages.filter(p=>p.id!==pageId);
        const newLooseLeafPage: LooseLeafPage={
            id: page.id,
            blocks: page.blocks,
            maxCharacterCount: page.maxCharacterCount,
            kind: "loose-leaf-page"
        };
        this.registerPage(newLooseLeafPage);
    }
}
