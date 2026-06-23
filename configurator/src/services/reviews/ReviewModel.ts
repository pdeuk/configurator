import type { ProjectDocument } from "../../models/ProjectModel";

export type ReviewStatus =
    | "draft"
    | "sent"
    | "changes_requested"
    | "approved";

export type ReviewAuthorType = "designer" | "customer";

export interface ReviewCommentPosition {
    moduleId?: string;
    x?: number;
    y?: number;
    z?: number;
}

export interface ReviewComment {
    id: string;
    authorType: ReviewAuthorType;
    authorId: string;
    message: string;
    createdAt: string;
    position?: ReviewCommentPosition;
    /** Set by designer when a comment has been addressed. */
    resolvedAt?: string | null;
}

export interface ProjectReview {
    id: string;
    projectId: ProjectDocument["id"];
    status: ReviewStatus;
    createdAt: string;
    updatedAt: string;
    comments: ReviewComment[];
}

export interface CreateReviewOptions {
    shareToken?: string | null;
    designerUserId?: string | null;
}

export interface AddReviewCommentInput {
    authorType: ReviewAuthorType;
    authorId: string;
    message: string;
    position?: ReviewCommentPosition;
}

export interface ReviewAccessContext {
    authorType: ReviewAuthorType;
    authorId: string;
    shareToken?: string;
    designerUserId?: string;
    customerId?: string;
    projectId?: string;
}

/** Reserved for email notification hooks. */
export interface ReviewNotificationRef {
    reviewId: string;
    projectId: string;
    status: ReviewStatus;
    recipientEmail: string | null;
}

/** Reserved for revision history / customer portal. */
export interface ReviewRevisionSnapshot {
    reviewId: string;
    status: ReviewStatus;
    capturedAt: string;
    commentCount: number;
}

export function formatReviewStatus(status: ReviewStatus): string {
    switch (status) {
        case "draft":
            return "Draft";
        case "sent":
            return "Awaiting review";
        case "changes_requested":
            return "Changes requested";
        case "approved":
            return "Approved";
    }
}

export function getReviewStatusTone(
    status: ReviewStatus
): "neutral" | "pending" | "warning" | "success" {
    switch (status) {
        case "draft":
            return "neutral";
        case "sent":
            return "pending";
        case "changes_requested":
            return "warning";
        case "approved":
            return "success";
    }
}
