import type {
    AddReviewCommentInput,
    CreateReviewOptions,
    ProjectReview,
    ReviewComment,
    ReviewStatus
} from "./ReviewModel";
import { getSupabaseClient } from "../cloud/SupabaseClient";
import type { ReviewStorage } from "./ReviewStorage";

interface ProjectReviewRow {
    id: string;
    project_id: string;
    share_token: string | null;
    designer_user_id: string | null;
    status: ReviewStatus;
    created_at: string;
    updated_at: string;
}

interface ReviewCommentRow {
    id: string;
    review_id: string;
    author_type: ReviewComment["authorType"];
    author_id: string;
    message: string;
    created_at: string;
    position_json: ReviewComment["position"] | null;
    resolved_at: string | null;
}

function mapCommentRow(row: ReviewCommentRow): ReviewComment {
    return {
        id: row.id,
        authorType: row.author_type,
        authorId: row.author_id,
        message: row.message,
        createdAt: row.created_at,
        ...(row.position_json ? { position: row.position_json } : {}),
        ...(row.resolved_at ? { resolvedAt: row.resolved_at } : {})
    };
}

async function fetchComments(reviewId: string): Promise<ReviewComment[]> {
    const client = getSupabaseClient();

    if (!client) {
        return [];
    }

    const { data, error } = await client
        .from("review_comments")
        .select("*")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return (data as ReviewCommentRow[]).map(mapCommentRow);
}

async function composeReview(row: ProjectReviewRow): Promise<ProjectReview> {
    return {
        id: row.id,
        projectId: row.project_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        comments: await fetchComments(row.id)
    };
}

export class SupabaseReviewStorage implements ReviewStorage {
    async createReview(
        projectId: string,
        options: CreateReviewOptions = {}
    ): Promise<ProjectReview> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const existing = await this.getReviewByProjectId(projectId);

        if (existing) {
            return existing;
        }

        const timestamp = new Date().toISOString();
        const row: ProjectReviewRow = {
            id: crypto.randomUUID(),
            project_id: projectId,
            share_token: options.shareToken ?? null,
            designer_user_id: options.designerUserId ?? null,
            status: "draft",
            created_at: timestamp,
            updated_at: timestamp
        };

        const { error } = await client.from("project_reviews").insert(row);

        if (error) {
            throw error;
        }

        return composeReview(row);
    }

    async getReview(reviewId: string): Promise<ProjectReview | null> {
        const client = getSupabaseClient();

        if (!client) {
            return null;
        }

        const { data, error } = await client
            .from("project_reviews")
            .select("*")
            .eq("id", reviewId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return composeReview(data as ProjectReviewRow);
    }

    async getReviewByProjectId(projectId: string): Promise<ProjectReview | null> {
        const client = getSupabaseClient();

        if (!client) {
            return null;
        }

        const { data, error } = await client
            .from("project_reviews")
            .select("*")
            .eq("project_id", projectId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return composeReview(data as ProjectReviewRow);
    }

    async getReviewByShareToken(shareToken: string): Promise<ProjectReview | null> {
        const client = getSupabaseClient();

        if (!client) {
            return null;
        }

        const { data, error } = await client.rpc("review_get_by_share_token", {
            p_token: shareToken
        });

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return data as ProjectReview;
    }

    async addComment(
        reviewId: string,
        comment: AddReviewCommentInput
    ): Promise<ProjectReview> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const createdAt = new Date().toISOString();
        const row = {
            id: crypto.randomUUID(),
            review_id: reviewId,
            author_type: comment.authorType,
            author_id: comment.authorId,
            message: comment.message,
            created_at: createdAt,
            position_json: comment.position ?? null,
            resolved_at: null
        };

        const { error: commentError } = await client
            .from("review_comments")
            .insert(row);

        if (commentError) {
            throw commentError;
        }

        const { error: reviewError } = await client
            .from("project_reviews")
            .update({ updated_at: createdAt })
            .eq("id", reviewId);

        if (reviewError) {
            throw reviewError;
        }

        const review = await this.getReview(reviewId);

        if (!review) {
            throw new Error(`Review "${reviewId}" was not found after adding a comment.`);
        }

        return review;
    }

    async updateStatus(
        reviewId: string,
        status: ReviewStatus
    ): Promise<ProjectReview> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const updatedAt = new Date().toISOString();
        const { error } = await client
            .from("project_reviews")
            .update({
                status,
                updated_at: updatedAt
            })
            .eq("id", reviewId);

        if (error) {
            throw error;
        }

        const review = await this.getReview(reviewId);

        if (!review) {
            throw new Error(`Review "${reviewId}" was not found after status update.`);
        }

        return review;
    }

    async resolveComment(
        reviewId: string,
        commentId: string
    ): Promise<ProjectReview> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const resolvedAt = new Date().toISOString();
        const { error: commentError } = await client
            .from("review_comments")
            .update({ resolved_at: resolvedAt })
            .eq("id", commentId)
            .eq("review_id", reviewId);

        if (commentError) {
            throw commentError;
        }

        const { error: reviewError } = await client
            .from("project_reviews")
            .update({ updated_at: resolvedAt })
            .eq("id", reviewId);

        if (reviewError) {
            throw reviewError;
        }

        const review = await this.getReview(reviewId);

        if (!review) {
            throw new Error(`Review "${reviewId}" was not found after resolving comment.`);
        }

        return review;
    }

    async linkShareToken(
        reviewId: string,
        shareToken: string
    ): Promise<ProjectReview> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const updatedAt = new Date().toISOString();
        const { error } = await client
            .from("project_reviews")
            .update({
                share_token: shareToken,
                updated_at: updatedAt
            })
            .eq("id", reviewId);

        if (error) {
            throw error;
        }

        const review = await this.getReview(reviewId);

        if (!review) {
            throw new Error(`Review "${reviewId}" was not found after linking share token.`);
        }

        return review;
    }

    async addCommentByShareToken(
        shareToken: string,
        comment: AddReviewCommentInput
    ): Promise<ProjectReview> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { data, error } = await client.rpc("review_add_comment_by_share_token", {
            p_token: shareToken,
            p_author_id: comment.authorId,
            p_message: comment.message,
            p_position: comment.position ?? null
        });

        if (error) {
            throw error;
        }

        return data as ProjectReview;
    }

    async updateStatusByShareToken(
        shareToken: string,
        status: ReviewStatus
    ): Promise<ProjectReview> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { data, error } = await client.rpc("review_update_status_by_share_token", {
            p_token: shareToken,
            p_status: status
        });

        if (error) {
            throw error;
        }

        return data as ProjectReview;
    }
}
