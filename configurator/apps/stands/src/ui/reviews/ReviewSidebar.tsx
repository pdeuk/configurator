import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type FormEvent
} from "react";
import {
    formatReviewStatus,
    getReviewStatusTone,
    reviewService,
    type ProjectReview,
    type ReviewComment
} from "../../services/reviews";
import type { CustomerProjectPermissions } from "../../services/customer";
import { DEFAULT_CUSTOMER_PROJECT_PERMISSIONS } from "../../services/customer";
import { trackEvent } from "../../services/analytics";

const CUSTOMER_ID_KEY = "configurator:review:customerId";

function getCustomerAuthorId(): string {
    const existing = sessionStorage.getItem(CUSTOMER_ID_KEY);

    if (existing) {
        return existing;
    }

    const nextId = `customer-${crypto.randomUUID().slice(0, 8)}`;
    sessionStorage.setItem(CUSTOMER_ID_KEY, nextId);
    return nextId;
}

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

function CommentItem({ comment }: { comment: ReviewComment }) {
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
                </span>
                <span style={styles.commentTime}>{formatCommentTime(comment.createdAt)}</span>
            </div>
            <p style={styles.commentMessage}>{comment.message}</p>
            {comment.position?.moduleId && (
                <div style={styles.commentPosition}>
                    Module: {comment.position.moduleId}
                </div>
            )}
            {isResolved && <div style={styles.resolvedTag}>Resolved</div>}
        </article>
    );
}

interface ReviewSidebarProps {
    shareToken?: string;
    projectId?: string;
    customerId?: string;
    permissions?: CustomerProjectPermissions;
}

export function ReviewSidebar({
    shareToken,
    projectId,
    customerId,
    permissions = DEFAULT_CUSTOMER_PROJECT_PERMISSIONS
}: ReviewSidebarProps) {
    const [review, setReview] = useState<ProjectReview | null>(null);
    const [message, setMessage] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const customerAuthorId = useMemo(() => getCustomerAuthorId(), []);

    const loadReview = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const nextReview = shareToken
                ? await reviewService.getReviewByShareToken(shareToken)
                : projectId
                    ? await reviewService.getReviewByProjectId(projectId)
                    : null;
            setReview(nextReview);
        } catch (loadError) {
            console.warn("Review load failed.", loadError);
            setError("Unable to load review comments.");
        } finally {
            setIsLoading(false);
        }
    }, [shareToken, projectId]);

    useEffect(() => {
        void loadReview();
    }, [loadReview]);

    const customerContext = useMemo(
        () => ({
            authorType: "customer" as const,
            authorId: customerAuthorId,
            ...(shareToken ? { shareToken } : {}),
            ...(customerId ? { customerId } : {}),
            ...(projectId ? { projectId } : {})
        }),
        [customerAuthorId, shareToken, customerId, projectId]
    );

    const handleAddComment = async (event: FormEvent) => {
        event.preventDefault();

        const trimmed = message.trim();

        if (!trimmed || !review || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const authorLabel = customerName.trim() || customerAuthorId;
            const nextReview = await reviewService.addComment(
                review.id,
                {
                    authorType: "customer",
                    authorId: authorLabel,
                    message: trimmed
                },
                customerContext
            );
            setReview(nextReview);
            setMessage("");
        } catch (submitError) {
            console.warn("Comment submit failed.", submitError);
            setError("Unable to post comment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (status: "changes_requested" | "approved") => {
        if (!review || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const nextReview = await reviewService.updateStatus(
                review.id,
                status,
                customerContext
            );
            setReview(nextReview);

            const resolvedProjectId = projectId ?? review.projectId;

            if (status === "approved") {
                await trackEvent({
                    event: "customer.approved",
                    entityType: "review",
                    entityId: review.id,
                    metadata: {
                        projectId: resolvedProjectId,
                        ...(customerId ? { customerId } : {})
                    }
                });
                await trackEvent({
                    event: "project.completed",
                    entityType: "project",
                    entityId: resolvedProjectId,
                    metadata: { projectId: resolvedProjectId, reviewId: review.id }
                });
            } else {
                await trackEvent({
                    event: "customer.requested_changes",
                    entityType: "review",
                    entityId: review.id,
                    metadata: {
                        projectId: resolvedProjectId,
                        ...(customerId ? { customerId } : {})
                    }
                });
            }
        } catch (statusError) {
            console.warn("Review status update failed.", statusError);
            setError("Unable to update review status.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusTone = getReviewStatusTone(review?.status ?? "sent");

    return (
        <aside style={styles.sidebar}>
            <div style={styles.header}>
                <div>
                    <div style={styles.headerLabel}>Review</div>
                    <h2 style={styles.heading}>Comments</h2>
                </div>
                <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(statusTone) }}>
                    {formatReviewStatus(review?.status ?? "sent")}
                </span>
            </div>

            {isLoading ? (
                <p style={styles.empty}>Loading comments…</p>
            ) : !review ? (
                <p style={styles.empty}>
                    No review thread yet. Your designer can send this project for approval.
                </p>
            ) : (
                <>
                    <div style={styles.commentList}>
                        {review.comments.length === 0 ? (
                            <p style={styles.empty}>No comments yet.</p>
                        ) : (
                            review.comments.map(comment => (
                                <CommentItem key={comment.id} comment={comment} />
                            ))
                        )}
                    </div>

                    <form style={styles.form} onSubmit={event => void handleAddComment(event)}>
                        {permissions.comment && (
                            <>
                                <label style={styles.field}>
                                    <span style={styles.label}>Your name (optional)</span>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={event => setCustomerName(event.target.value)}
                                        style={styles.input}
                                        placeholder="Customer"
                                    />
                                </label>
                                <label style={styles.field}>
                                    <span style={styles.label}>Add a comment</span>
                                    <textarea
                                        value={message}
                                        onChange={event => setMessage(event.target.value)}
                                        style={styles.textarea}
                                        rows={4}
                                        placeholder="Share feedback on this design…"
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
                                    Post comment
                                </button>
                            </>
                        )}
                    </form>

                    {permissions.approve && (
                        <div style={styles.actions}>
                            <button
                                type="button"
                                style={styles.secondaryButton}
                                disabled={isSubmitting || review.status === "approved"}
                                onClick={() => void handleStatusUpdate("changes_requested")}
                            >
                                Request changes
                            </button>
                            <button
                                type="button"
                                style={styles.primaryButton}
                                disabled={isSubmitting || review.status === "approved"}
                                onClick={() => void handleStatusUpdate("approved")}
                            >
                                Approve design
                            </button>
                        </div>
                    )}
                </>
            )}

            {error && <p style={styles.error}>{error}</p>}
        </aside>
    );
}

const styles = {
    sidebar: {
        width: "min(340px, 100vw)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        boxSizing: "border-box",
        borderLeft: "1px solid #3b414a",
        background: "#20242b",
        color: "#f7f7f2",
        overflow: "hidden"
    },
    header: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
    },
    headerLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    heading: {
        margin: "4px 0 0",
        fontSize: 18,
        fontWeight: 600
    },
    statusBadge: {
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 999,
        padding: "6px 10px",
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
    commentList: {
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "grid",
        gap: 10,
        paddingRight: 4
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
        fontSize: 12,
        fontWeight: 700,
        color: "#e5e7eb"
    },
    commentTime: {
        fontSize: 11,
        color: "#9aa3b2"
    },
    commentMessage: {
        margin: 0,
        fontSize: 13,
        lineHeight: 1.45,
        color: "#d1d5db",
        whiteSpace: "pre-wrap"
    },
    commentPosition: {
        marginTop: 8,
        fontSize: 11,
        color: "#9aa3b2"
    },
    resolvedTag: {
        marginTop: 8,
        fontSize: 11,
        fontWeight: 700,
        color: "#86efac"
    },
    form: {
        display: "grid",
        gap: 10,
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
    input: {
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 6,
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#f7f7f2",
        padding: "8px 10px",
        font: "inherit",
        fontSize: 13
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
        fontSize: 13,
        resize: "vertical"
    },
    actions: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    secondaryButton: {
        border: "1px solid #d97706",
        background: "#4a3410",
        color: "#fde68a",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    primaryButton: {
        border: "1px solid #22c55e",
        background: "#14532d",
        color: "#bbf7d0",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    disabledButton: {
        opacity: 0.45,
        cursor: "not-allowed"
    },
    empty: {
        margin: 0,
        fontSize: 13,
        color: "#9aa3b2"
    },
    error: {
        margin: 0,
        fontSize: 12,
        color: "#fca5a5"
    }
} satisfies Record<string, CSSProperties>;
