import {ParchmentService} from "./parchment-service";
import {Page} from "../domain/page";
import {TextBlock} from "../domain/text-block";
export class InMemoryParchmentService implements ParchmentService {
    createNotebook(): string {
        throw new Error("Method not implemented.");
    }
    getPage(pageId: string): Page | undefined {
        throw new Error("Method not implemented.");
    }
    updatePage(pageId: string, blocks: TextBlock[]): void {
        throw new Error("Method not implemented.");
    }
}