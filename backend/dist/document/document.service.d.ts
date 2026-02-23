import { PrismaService } from '../prisma/prisma.service';
import { DocumentItem } from './dto/document.dto';
export declare class DocumentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUserDocuments(userId: string, category?: string): Promise<DocumentItem[]>;
    deleteDocument(documentId: string, userId: string): Promise<void>;
    toggleDocumentPin(documentId: string, userId: string): Promise<{
        id: string;
        isPinned: boolean;
    }>;
    private parseDocumentId;
    private generateResumeTags;
    private generateInterviewTags;
    private formatFileSize;
    private formatDate;
}
