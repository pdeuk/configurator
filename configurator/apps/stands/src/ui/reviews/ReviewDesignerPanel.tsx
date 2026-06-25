import {
    useCallback,
    useEffect,
    useState,
    type CSSProperties,
    type FormEvent
} from "react";
import {
    formatReviewStatus,
    getReviewStatusTone,
    reviewService,
    type ProjectReview,
    type ReviewComment,
    type ReviewStatus
} from "../../services/reviews";
import { useCloudSession } from "../cloud";
import { useProjectSession } from "../projects/projectSession";

function getStatusBadgeStyle(tone: ReturnType<typeof getReviewStatusTone>): CSSProperties {
    switch (tone) {
        case "pending":
            return styles.statusPending;
        case "warning":
            return styles.statusWarning;
        case "success":
            return styles.statusSuccess;
        default:
            return styles.statusNeutral;
    }
}

function formatCommentTime(value: string): string {
    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function CommentItem({
    comment,
    onResolve,
    isResolving
}: {
    comment: ReviewComment;
    onResolve: (commentId: string) => void;
    isResolving: boolean;
}) {
    const isResolved = Boolean(comment.resolvedAt);

    return (
        <article
            style={{
                ...styles.comment,
                ...(isResolved ? styles.commentResolved : undefined)
            }}
        >
            <div style={styles.commentHeader}>
                <span style={styles.commentAuthor}>
                    {comment.authorType === "customer" ? "Customer" : "Designer"}
                    {comment.authorId ? ` · ${comment.authorId}` : ""}
                </span>
                <span style={styles.commentTime}>{formatCommentTime(comment.createdAt)}</span>
            </div>
            <p style={styles.commentMessage}>{comment.message}</p>
            {!isResolved && comment.authorType === "customer" && (
                <button
                    type="button"
                    style={styles.resolveButton}
                    disabled={isResolving}
                    onClick={() => onResolve(comment.id)}
                >
                    Mark resolved
                </button>
            )}
            {isResolved && <div style={styles.resolvedTag}>Resolved</div>}
        </article>
    );
}

interface ReviewDesignerPanelProps {
    onClose?: () => void;
}

export function ReviewDesignerPanel({ onClose }: ReviewDesignerPanelProps = {}) {
    const { activeProjectId } = useProjectSession();
    const { user } = useCloudSession();
    const [review, setReview] = useState<ProjectReview | null>(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const designerAuthorId = user?.email ?? user?.id ?? "designer";

    const loadReview = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const nextReview = await reviewService.getReviewByProjectId(activeProjectId);
            setReview(nextReview);
        } catch (loadError) {
            console.warn("Designer review load failed.", loadError);
            setError("Unable to load review thread.");
        } finally {
            setIsLoading(false);
        }
    }, [activeProjectId]);

    useEffect(() => {
        void loadReview();
    }, [loadReview]);

    const handleAddComment = async (event: FormEvent) => {
        event.preventDefault();

        const trimmed = message.trim();

        if (!trimmed || !review || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const nextReview = await reviewService.addComment(review.id, {
                authorType: "designer",
                authorId: designerAuthorId,
                message: trimmed
            });
            setReview(nextReview);
            setMessage("");
        } catch (submitError) {
            console.warn("Designer comment failed.", submitError);
            setError("Unable to post comment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (status: ReviewStatus) => {
        if (!review || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const nextReview = await reviewService.updateStatus(review.id, status, {
                authorType: "designer",
                authorId: designerAuthorId
            });
            setReview(nextReview);
        } catch (statusError) {
            console.warn("Designer status update failed.", statusError);
            setError("Unable to update review status.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolveComment = async (commentId: string) => {
        if (!review || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const nextReview = await reviewService.resolveComment(review.id, commentId, {
                authorType: "designer",
                authorId: designerAuthorId
            });
            setReview(nextReview);
        } catch (resolveError) {
            console.warn("Resolve comment failed.", resolveError);
            setError("Unable to resolve comment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const unresolvedCount =
        review?.comments.filter(comment => !comment.resolvedAt).length ?? 0;
    const statusTone = getReviewStatusTone(review?.status ?? "draft");
    const isFullHeight = Boolean(onClose);

    return (
        <aside style={isFullHeight ? styles.panelFull : styles.panel}>
            <div style={styles.header}>
                <div>
                    <div style={styles.headerLabel}>Customer review</div>
                    <h2 style={styles.heading}>Comments</h2>
                </div>
                <div style={styles.headerRight}>
                    <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(statusTone) }}>
                        {formatReviewStatus(review?.status ?? "draft")}
                    </span>
                    {onClose && (
                        <button
                            type="button"
                            style={styles.closeButton}
                            aria-label="Close comments"
                            onClick={onClose}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <p style={styles.empty}>Loading review…</p>
            ) : !review ? (
                <p style={styles.empty}>
                    Share the project to start a customer review thread.
                </p>
            ) : (
                <>
                    <div style={styles.summary}>
                        {unresolvedCount > 0
                            ? `${unresolvedCount} open comment(s)`
                            : "No open comments"}
                    </div>

                    <div style={isFullHeight ? styles.commentListFull : styles.commentList}>
                        {review.comments.length === 0 ? (
                            <p style={styles.empty}>No comments yet.</p>
                        ) : (
                            review.comments.map(comment => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    isResolving={isSubmitting}
                                    onResolve={commentId => void handleResolveComment(commentId)}
                                />
                            ))
                        )}
                    </div>

                    <form style={styles.form} onSubmit={event => void handleAddComment(event)}>
                        <label style={styles.field}>
                            <span style={styles.label}>Reply to customer</span>
                            <textarea
                                value={message}
                                onChange={event => setMessage(event.target.value)}
                                style={styles.textarea}
                                rows={3}
                                placeholder="Add a designer note…"
                            />
                        </label>
                        <button
                            type="submit"
                            style={{
                                ...styles.button,
                                ...(message.trim() && !isSubmitting
                                    ? undefined
                                    : styles.disabledButton)
                            }}
                            disabled={!message.trim() || isSubmitting}
                        >
                            Post reply
                        </button>
                    </form>

                    <div style={styles.statusActions}>
                        <button
                            type="button"
                            style={styles.button}
                            disabled={isSubmitting}
                            onClick={() => void handleStatusChange("sent")}
                        >
                            Mark sent
                        </button>
                        <button
                            type="button"
                            style={styles.button}
                            disabled={isSubmitting}
                            onClick={() => void handleStatusChange("draft")}
                        >
                            Reset draft
                        </button>
                    </div>
                </>
            )}

            {error && <p style={styles.error}>{error}</p>}
        </aside>
    );
}

const styles = {
    panel: {
        flexShrink: 0,
        width: "100%",
        maxHeight: "min(360px, calc(100vh - 240px))",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        borderRadius: 8,
        padding: 16,
        display: "grid",
        gap: 10
    },
    panelFull: {
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        background: "#20242b",
        color: "#f7f7f2",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10
    },
    header: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
    },
    headerRight: {
        display: "flex",
        alignItems: "center",
        gap: 8
    },
    closeButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        width: 30,
        height: 30,
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        lineHeight: 1,
        flexShrink: 0
    },
    headerLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    heading: {
        margin: "4px 0 0",
        fontSize: 16,
        fontWeight: 600
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 999,
        padding: "5px 8px",
        whiteSpace: "nowrap"
    },
    statusNeutral: {
        color: "#cbd5e1",
        background: "#2d3440",
        border: "1px solid #4b5562"
    },
    statusPending: {
        color: "#dbeafe",
        background: "#1e3a5f",
        border: "1px solid #3b82f6"
    },
    statusWarning: {
        color: "#fde68a",
        background: "#4a3410",
        border: "1px solid #d97706"
    },
    statusSuccess: {
        color: "#bbf7d0",
        background: "#14532d",
        border: "1px solid #22c55e"
    },
    summary: {
        fontSize: 12,
        color: "#cbd3dc"
    },
    commentList: {
        display: "grid",
        gap: 8,
        maxHeight: 160,
        overflowY: "auto"
    },
    commentListFull: {
        display: "grid",
        gap: 8,
        gridAutoRows: "max-content",
        flex: "1 1 auto",
        minHeight: 0,
        overflowY: "auto"
    },
    comment: {
        padding: 10,
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#171b21"
    },
    commentResolved: {
        opacity: 0.72
    },
    commentHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 6
    },
    commentAuthor: {
        fontSize: 11,
        fontWeight: 700,
        color: "#e5e7eb"
    },
    commentTime: {
        fontSize: 10,
        color: "#9aa3b2"
    },
    commentMessage: {
        margin: 0,
        fontSize: 12,
        lineHeight: 1.45,
        color: "#d1d5db",
        whiteSpace: "pre-wrap"
    },
    resolveButton: {
        marginTop: 8,
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "6px 8px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 11
    },
    resolvedTag: {
        marginTop: 8,
        fontSize: 11,
        fontWeight: 700,
        color: "#86efac"
    },
    form: {
        display: "grid",
        gap: 8,
        paddingTop: 8,
        borderTop: "1px solid #3b414a"
    },
    field: {
        display: "grid",
        gap: 6
    },
    label: {
        fontSize: 11,
        color: "#9aa3b2"
    },
    textarea: {
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 6,
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#f7f7f2",
        padding: "8px 10px",
        font: "inherit",
        fontSize: 12,
        resize: "vertical"
    },
    statusActions: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "7px 8px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    },
    disabledButton: {
        opacity: 0.45,
        cursor: "not-allowed"
    },
    empty: {
        margin: 0,
        fontSize: 12,
        color: "#9aa3b2"
    },
    error: {
        margin: 0,
        fontSize: 11,
        color: "#fca5a5"
    }
} satisfies Record<string, CSSProperties>;
