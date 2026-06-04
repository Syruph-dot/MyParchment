import {NotebookPage} from "./page";
export type Notebook={
    readonly id: string;
    pages: NotebookPage[];
};