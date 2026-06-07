import {ParchmentService} from "./parchment-service";
import {Page,NotebookPage,LooseLeafPage,ClipGroupPage} from "../domain/page";
import {TextBlock} from "../domain/text-block";
import {Notebook} from "../domain/notebook";
import { ClipGroup } from "../domain/clipgroup";


export class InMemoryParchmentService implements ParchmentService {
    private notebooks: Map<string, Notebook> = new Map();
    private pages: Map<string,Page> = new Map();
    private clipGroups: Map<string, ClipGroup> = new Map();
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
    private disassembleNotebook(notebook: Notebook): void {
        for (const page of notebook.pages){
            const newLooseLeafPage: LooseLeafPage={
            id: page.id,
            blocks: page.blocks,
            maxCharacterCount: page.maxCharacterCount,
            kind: "loose-leaf-page"
            };
            this.registerPage(newLooseLeafPage);
        }
        this.notebooks.delete(notebook.id);
    }

    private requireNotebook(notebookId: string): Notebook {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook) {
            throw new Error(`Notebook with id ${notebookId} not found.`);
        }
        return notebook;
    }
    private requireNotebookPage(pageId: string): NotebookPage {
        const page = this.pages.get(pageId);
        if (!page || page.kind !== "notebook-page") {
            throw new Error(`Page with id ${pageId} is not a notebook page.`);
        }
        return page;
    }
    private requireNotebookPageBySlotIndex(notebook: Notebook, slotIndex: number): NotebookPage {
        const page = notebook.pages.find(p => p.slotIndex === slotIndex);
        if (!page) {
            throw new Error(`Page with slot index ${slotIndex} not found in notebook.`);
        }
        return page;
    }
    private requireLooseLeafPage(pageId: string): LooseLeafPage {
        const page = this.pages.get(pageId);
        if (!page || page.kind !== "loose-leaf-page") {
            throw new Error(`Page with id ${pageId} is not a loose-leaf page.`);
        }
        return page;
    }
    private requireClipGroupPage(pageId: string): ClipGroupPage {
        const page = this.pages.get(pageId);
        if (!page || page.kind !== "clip-group-page") {
            throw new Error(`Page with id ${pageId} is not a clip-group page.`);
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
    private requireUniqueClipGroupId(clipGroupId: string): void {
        if (this.clipGroups.has(clipGroupId)) {
            throw new Error(`Clip group with id ${clipGroupId} already exists.`);
        }
    }
    private requireClipGroup(clipGroupId: string): ClipGroup {
        const clipGroup = this.clipGroups.get(clipGroupId);
        if (!clipGroup) {
            throw new Error(`Clip group with id ${clipGroupId} not found.`);
        }
        return clipGroup;
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
            currentPageSlotIndex: 0,
        }
        this.notebooks.set(notebook.id, notebook);
    }
    goToNextPage(notebookId: string): void {
        const notebook = this.requireNotebook(notebookId);
        const page = this.requireNotebookPageBySlotIndex(notebook, notebook.currentPageSlotIndex);
        notebook.currentPageSlotIndex=notebook.pages[(notebook.pages.indexOf(page)+1)%notebook.pages.length].slotIndex;
    }
    goToPrevPage(notebookId: string): void {
        const notebook = this.requireNotebook(notebookId);
        const page = this.requireNotebookPageBySlotIndex(notebook, notebook.currentPageSlotIndex);
        const l=notebook.pages.length
        notebook.currentPageSlotIndex=notebook.pages[(notebook.pages.indexOf(page)-1+l)%l].slotIndex;
    }
    getPage(pageId: string): Page | undefined {
        return this.pages.get(pageId);
    }
    getNotebook(notebookId: string): Notebook | undefined {
        return this.notebooks.get(notebookId);
    }
    getCurrentNotebookPage(notebookId: string): NotebookPage | undefined {
        const notebook = this.requireNotebook(notebookId);
        return notebook.pages.filter(page => page.slotIndex === notebook.currentPageSlotIndex)[0];
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
    createClipGroup(clipGroupId: string): void {
        this.requireUniqueClipGroupId(clipGroupId);
        const newClipGroup: ClipGroup = {
            id: clipGroupId,
            pages: []
        };
        this.clipGroups.set(newClipGroup.id, newClipGroup);
    }
    getClipGroup(clipGroupId: string): ClipGroup | undefined {
        return this.clipGroups.get(clipGroupId);
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
    private convertNotebookPageToLooseLeaf(page: NotebookPage): void {
        const notebook = this.requireNotebookByPage(page);
        if (notebook.pages.length>=2){
            if (notebook.currentPageSlotIndex===page.slotIndex){this.goToNextPage(notebook.id);}
            notebook.pages=notebook.pages.filter(p=>p.id!==page.id);
            const newLooseLeafPage: LooseLeafPage={
                id: page.id,
                blocks: page.blocks,
                maxCharacterCount: page.maxCharacterCount,
                kind: "loose-leaf-page"
            };
            this.registerPage(newLooseLeafPage);
            
        }else{this.disassembleNotebook(notebook);}
    }
    private removeClipGroupPageToLooseLeaf(page: ClipGroupPage): void {
        const clipGroup = this.requireClipGroup(page.clipGroupId);
        clipGroup.pages = clipGroup.pages.filter(groupPage => groupPage.id !== page.id);
        const newLooseLeafPage: LooseLeafPage = {
            id: page.id,
            blocks: page.blocks,
            maxCharacterCount: page.maxCharacterCount,
            kind: "loose-leaf-page"
        };
        this.registerPage(newLooseLeafPage);
    }
    tearOutPage(pageId: string): void {
        const page = this.pages.get(pageId);
        if (!page) {
            throw new Error(`Page with id ${pageId} not found.`);
        }

        if (page.kind === "notebook-page") {
            this.convertNotebookPageToLooseLeaf(this.requireNotebookPage(pageId));
            return;
        }

        if (page.kind === "clip-group-page") {
            this.removeClipGroupPageToLooseLeaf(this.requireClipGroupPage(pageId));
            return;
        }

        throw new Error(`Page with id ${pageId} is not a notebook page.`);
    }
    clipLooseleaf(pageId: string, clipGroupId: string): void {
        const page=this.requireLooseLeafPage(pageId);
        const clipGroup = this.requireClipGroup(clipGroupId);
        const newClipGroupPage: ClipGroupPage={
            id: page.id,
            blocks: page.blocks,
            maxCharacterCount: page.maxCharacterCount,
            kind: "clip-group-page",
            clipGroupId: clipGroupId
        };
        this.unregisterPage(pageId);
        this.registerPage(newClipGroupPage);
        clipGroup.pages.push(newClipGroupPage);
    }
}
