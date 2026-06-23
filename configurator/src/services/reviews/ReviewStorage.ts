import type {
    AddReviewCommentInput,
    CreateReviewOptions,
    ProjectReview,
    ReviewAccessContext,
    ReviewStatus
} from "./ReviewModel";

export interface ReviewStorage {
    createReview(
        projectId: string,
        options?: CreateReviewOptions
    ): Promise<ProjectReview>;
    getReview(reviewId: string): Promise<ProjectReview | null>;
    getReviewByProjectId(projectId: string): Promise<ProjectReview | null>;
    getReviewByShareToken(shareToken: string): Promise<ProjectReview | null>;
    addComment(
        reviewId: string,
        comment: AddReviewCommentInput
    ): Promise<ProjectReview>;
    updateStatus(
        reviewId: string,
        status: ReviewStatus
    ): Promise<ProjectReview>;
    resolveComment(
        reviewId: string,
        commentId: string
    ): Promise<ProjectReview>;
    linkShareToken(
        reviewId: string,
        shareToken: string
    ): Promise<ProjectReview>;
}

export interface StoredReviewRecord {
    review: ProjectReview;
    shareToken: string | null;
    designerUserId: string | null;
}

const REVIEW_PREFIX = "configurator:review:";
const REVIEW_INDEX_KEY = "configurator:review:index";

function reviewKey(reviewId: string): string {
    return `${REVIEW_PREFIX}${reviewId}`;
}

function readIndex(): StoredReviewRecord[] {
    const raw = localStorage.getItem(REVIEW_INDEX_KEY);

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as StoredReviewRecord[];
    } catch {
        return [];
    }
}

function writeIndex(records: StoredReviewRecord[]): void {
    localStorage.setItem(REVIEW_INDEX_KEY, JSON.stringify(records));
}

function upsertRecord(record: StoredReviewRecord): void {
    const records = readIndex().filter(entry => entry.review.id !== record.review.id);
    records.push(record);
    writeIndex(records);
    localStorage.setItem(reviewKey(record.review.id), JSON.stringify(record));
}

function readRecord(reviewId: string): StoredReviewRecord | null {
    const raw = localStorage.getItem(reviewKey(reviewId));

    if (raw) {
        try {
            return JSON.parse(raw) as StoredReviewRecord;
        } catch {
            return null;
        }
    }

    return readIndex().find(entry => entry.review.id === reviewId) ?? null;
}

function toReview(record: StoredReviewRecord): ProjectReview {
    return record.review;
}

export class LocalReviewStorage implements ReviewStorage {
    async createReview(
        projectId: string,
        options: CreateReviewOptions = {}
    ): Promise<ProjectReview> {
        const existing = await this.getReviewByProjectId(projectId);

        if (existing) {
            return existing;
        }

        const timestamp = new Date().toISOString();
        const review: ProjectReview = {
            id: crypto.randomUUID(),
            projectId,
            status: "draft",
            createdAt: timestamp,
            updatedAt: timestamp,
            comments: []
        };

        upsertRecord({
            review,
            shareToken: options.shareToken ?? null,
            designerUserId: options.designerUserId ?? null
        });

        return review;
    }

    async getReview(reviewId: string): Promise<ProjectReview | null> {
        const record = readRecord(reviewId);
        return record ? toReview(record) : null;
    }

    async getReviewByProjectId(projectId: string): Promise<ProjectReview | null> {
        const record = readIndex()
            .filter(entry => entry.review.projectId === projectId)
            .sort((left, right) =>
                right.review.updatedAt.localeCompare(left.review.updatedAt)
            )[0];

        return record ? toReview(record) : null;
    }

    async getReviewByShareToken(shareToken: string): Promise<ProjectReview | null> {
        const record = readIndex()
            .filter(entry => entry.shareToken === shareToken)
            .sort((left, right) =>
                right.review.updatedAt.localeCompare(left.review.updatedAt)
            )[0];

        return record ? toReview(record) : null;
    }

    async addComment(
        reviewId: string,
        comment: AddReviewCommentInput
    ): Promise<ProjectReview> {
        const record = readRecord(reviewId);

        if (!record) {
            throw new Error(`Review "${reviewId}" was not found.`);
        }

        const nextReview: ProjectReview = {
            ...record.review,
            updatedAt: new Date().toISOString(),
            comments: [
                ...record.review.comments,
                {
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    ...comment
                }
            ]
        };

        upsertRecord({
            ...record,
            review: nextReview
        });

        return nextReview;
    }

    async updateStatus(
        reviewId: string,
        status: ReviewStatus
    ): Promise<ProjectReview> {
        const record = readRecord(reviewId);

        if (!record) {
            throw new Error(`Review "${reviewId}" was not found.`);
        }

        const nextReview: ProjectReview = {
            ...record.review,
            status,
            updatedAt: new Date().toISOString()
        };

        upsertRecord({
            ...record,
            review: nextReview
        });

        return nextReview;
    }

    async resolveComment(
        reviewId: string,
        commentId: string
    ): Promise<ProjectReview> {
        const record = readRecord(reviewId);

        if (!record) {
            throw new Error(`Review "${reviewId}" was not found.`);
        }

        const resolvedAt = new Date().toISOString();
        const nextReview: ProjectReview = {
            ...record.review,
            updatedAt: resolvedAt,
            comments: record.review.comments.map(comment =>
                comment.id === commentId
                    ? { ...comment, resolvedAt }
                    : comment
            )
        };

        upsertRecord({
            ...record,
            review: nextReview
        });

        return nextReview;
    }

    async linkShareToken(
        reviewId: string,
        shareToken: string
    ): Promise<ProjectReview> {
        const record = readRecord(reviewId);

        if (!record) {
            throw new Error(`Review "${reviewId}" was not found.`);
        }

        upsertRecord({
            ...record,
            shareToken
        });

        return record.review;
    }
}

export const localReviewStorage = new LocalReviewStorage();

export function assertDesignerAccess(context?: ReviewAccessContext): void {
    if (context?.authorType !== "designer") {
        throw new Error("Designer access is required.");
    }
}

export function assertCustomerShareAccess(
    context: ReviewAccessContext | undefined,
    shareToken: string
): void {
    if (context?.authorType !== "customer" || context.shareToken !== shareToken) {
        throw new Error("Valid share access is required.");
    }
}
