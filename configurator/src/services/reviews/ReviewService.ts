import { getCloudStorageContext } from "../cloud/HybridProjectStorage";
import { customerService } from "../customer/CustomerService";
import { isSupabaseConfigured } from "../cloud/SupabaseClient";
import { isBrowserOnline } from "../cloud/syncStatus";
import type {
    AddReviewCommentInput,
    CreateReviewOptions,
    ProjectReview,
    ReviewAccessContext,
    ReviewStatus
} from "./ReviewModel";
import {
    localReviewStorage,
    type ReviewStorage
} from "./ReviewStorage";
import { SupabaseReviewStorage } from "./SupabaseReviewStorage";

function canUseCloudReviews(): boolean {
    const { user } = getCloudStorageContext();
    return Boolean(isSupabaseConfigured() && user && isBrowserOnline());
}

function getDesignerStorage(): ReviewStorage {
    if (canUseCloudReviews()) {
        return new SupabaseReviewStorage();
    }

    return localReviewStorage;
}

/** Reserved for email notification hooks. */
function notifyReviewEvent(
    _event: "created" | "comment" | "status" | "resolved",
    _review: ProjectReview
): void {
    // Intentionally empty — wired later for email notifications.
}

/** Reserved for revision history / customer portal. */
function captureReviewRevisionSnapshot(_review: ProjectReview): void {
    // Intentionally empty — wired later for revision history.
}

export class ReviewService {
    async createReview(
        projectId: string,
        options: CreateReviewOptions = {}
    ): Promise<ProjectReview> {
        const designerUserId =
            options.designerUserId ?? getCloudStorageContext().user?.id ?? null;

        const review = await getDesignerStorage().createReview(projectId, {
            ...options,
            designerUserId
        });

        notifyReviewEvent("created", review);
        return review;
    }

    async getReview(reviewId: string): Promise<ProjectReview | null> {
        return getDesignerStorage().getReview(reviewId);
    }

    async getReviewByProjectId(projectId: string): Promise<ProjectReview | null> {
        return getDesignerStorage().getReviewByProjectId(projectId);
    }

    async getReviewByShareToken(shareToken: string): Promise<ProjectReview | null> {
        if (isSupabaseConfigured() && isBrowserOnline()) {
            const cloudReview = await new SupabaseReviewStorage().getReviewByShareToken(
                shareToken
            );

            if (cloudReview) {
                return cloudReview;
            }
        }

        return localReviewStorage.getReviewByShareToken(shareToken);
    }

    async addComment(
        reviewId: string,
        comment: AddReviewCommentInput,
        context?: ReviewAccessContext
    ): Promise<ProjectReview> {
        if (context?.authorType === "customer" && context.customerId && context.projectId) {
            await customerService.assertCustomerProjectAccess(
                context.customerId,
                context.projectId,
                "comment"
            );

            let review = await this.getReviewByProjectId(context.projectId);

            if (!review) {
                review = await this.createReview(context.projectId);
                review = await this.updateStatus(review.id, "sent", {
                    authorType: "designer",
                    authorId: "system"
                });
            }

            const nextReview = await getDesignerStorage().addComment(review.id, comment);
            notifyReviewEvent("comment", nextReview);
            return nextReview;
        }

        if (context?.authorType === "customer" && context.shareToken) {
            if (isSupabaseConfigured() && isBrowserOnline()) {
                try {
                    const review = await new SupabaseReviewStorage().addCommentByShareToken(
                        context.shareToken,
                        comment
                    );
                    notifyReviewEvent("comment", review);
                    return review;
                } catch (error) {
                    console.warn("Cloud review comment failed, falling back to local.", error);
                }
            }

            const linkedReview = await localReviewStorage.getReviewByShareToken(
                context.shareToken
            );

            if (!linkedReview) {
                throw new Error("Review not found for share token.");
            }

            const review = await localReviewStorage.addComment(linkedReview.id, comment);
            notifyReviewEvent("comment", review);
            return review;
        }

        const review = await getDesignerStorage().addComment(reviewId, comment);
        notifyReviewEvent("comment", review);
        return review;
    }

    async updateStatus(
        reviewId: string,
        status: ReviewStatus,
        context?: ReviewAccessContext
    ): Promise<ProjectReview> {
        if (context?.authorType === "customer" && context.customerId && context.projectId) {
            await customerService.assertCustomerProjectAccess(
                context.customerId,
                context.projectId,
                "approve"
            );

            let review = await this.getReviewByProjectId(context.projectId);

            if (!review) {
                throw new Error("Review not found for project.");
            }

            const nextReview = await getDesignerStorage().updateStatus(review.id, status);
            notifyReviewEvent("status", nextReview);
            captureReviewRevisionSnapshot(nextReview);
            return nextReview;
        }

        if (context?.authorType === "customer" && context.shareToken) {
            if (isSupabaseConfigured() && isBrowserOnline()) {
                try {
                    const review = await new SupabaseReviewStorage().updateStatusByShareToken(
                        context.shareToken,
                        status
                    );
                    notifyReviewEvent("status", review);
                    captureReviewRevisionSnapshot(review);
                    return review;
                } catch (error) {
                    console.warn("Cloud review status failed, falling back to local.", error);
                }
            }

            const linkedReview = await localReviewStorage.getReviewByShareToken(
                context.shareToken
            );

            if (!linkedReview) {
                throw new Error("Review not found for share token.");
            }

            const review = await localReviewStorage.updateStatus(linkedReview.id, status);
            notifyReviewEvent("status", review);
            captureReviewRevisionSnapshot(review);
            return review;
        }

        const review = await getDesignerStorage().updateStatus(reviewId, status);
        notifyReviewEvent("status", review);
        captureReviewRevisionSnapshot(review);
        return review;
    }

    async resolveComment(
        reviewId: string,
        commentId: string,
        context?: ReviewAccessContext
    ): Promise<ProjectReview> {
        if (context?.authorType !== "designer") {
            throw new Error("Only designers can resolve comments.");
        }

        const review = await getDesignerStorage().resolveComment(reviewId, commentId);
        notifyReviewEvent("resolved", review);
        return review;
    }

    async linkShareToken(reviewId: string, shareToken: string): Promise<ProjectReview> {
        return getDesignerStorage().linkShareToken(reviewId, shareToken);
    }

    async sendForReview(
        projectId: string,
        shareToken: string,
        designerUserId?: string | null
    ): Promise<ProjectReview> {
        let review = await this.createReview(projectId, {
            designerUserId: designerUserId ?? getCloudStorageContext().user?.id ?? null
        });

        review = await this.linkShareToken(review.id, shareToken);
        review = await this.updateStatus(review.id, "sent", {
            authorType: "designer",
            authorId: designerUserId ?? getCloudStorageContext().user?.id ?? "designer"
        });

        return review;
    }
}

export const reviewService = new ReviewService();

export function createReview(
    projectId: string,
    options?: CreateReviewOptions
): Promise<ProjectReview> {
    return reviewService.createReview(projectId, options);
}

export function addComment(
    reviewId: string,
    comment: AddReviewCommentInput,
    context?: ReviewAccessContext
): Promise<ProjectReview> {
    return reviewService.addComment(reviewId, comment, context);
}

export function updateStatus(
    reviewId: string,
    status: ReviewStatus,
    context?: ReviewAccessContext
): Promise<ProjectReview> {
    return reviewService.updateStatus(reviewId, status, context);
}

export function getReview(reviewId: string): Promise<ProjectReview | null> {
    return reviewService.getReview(reviewId);
}
