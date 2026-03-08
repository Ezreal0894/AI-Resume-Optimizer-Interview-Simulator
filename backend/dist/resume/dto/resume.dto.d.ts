export declare class AnalyzeResumeDto {
    targetRole: string;
    targetJd?: string;
}
export interface ResumeExtractResult {
    resumeId: string;
    personalInfo: {
        name: string;
        role: string;
        yearsOfExperience: number;
    };
    highlights: string[];
    knowledgePoints: string[];
}
export interface ResumeAnalysisReport {
    overallScore: number;
    atsCompatibility: {
        score: number;
        suggestions: string[];
    };
    keywordAnalysis: {
        matched: string[];
        missing: string[];
    };
    structureAnalysis: {
        sections: string[];
        improvements: string[];
    };
    contentSuggestions: string[];
}
