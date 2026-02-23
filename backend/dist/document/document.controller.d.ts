import { DocumentService } from './document.service';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    getDocuments(userId: string, category?: string): Promise<{
        data: import("./dto/document.dto").DocumentItem[];
    }>;
    deleteDocument(documentId: string, userId: string): Promise<{
        message: string;
    }>;
    togglePin(documentId: string, userId: string): Promise<{
        data: {
            id: string;
            isPinned: boolean;
        };
    }>;
}
