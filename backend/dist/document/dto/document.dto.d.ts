export type DocumentType = 'resume' | 'optimized' | 'report';
export interface DocumentTag {
    label: string;
    color: 'indigo' | 'emerald' | 'amber' | 'slate';
}
export interface DocumentItem {
    id: string;
    title: string;
    type: DocumentType;
    fileType: 'pdf' | 'docx' | 'report';
    size: string;
    date: string;
    tags: DocumentTag[];
    isPinned: boolean;
    sourceId: string;
    sourceType: 'resume' | 'interview';
    ownerName?: string;
    aiSummary?: string;
    rawContent?: string;
}
