import React, { useMemo, useState } from "react";

/* ------------------------- Types ------------------------- */
type QAData = {
  revision: string;
  qa_step: "prepare" | "review" | "approve" | "approved" | string;
  preparer: string;
  prepare_date: string;
  reviewer: string;
  review_date: string;
  review_complete: "yes" | "no" | string;
  approver: string;
  approve_date: string;
  approve_complete: "yes" | "no" | string;
  comments: Array<{ name: string; comment: string }>;
  qa_log: string[];
};

type Props = {
  siteName: string;
  currentUser: string;
  userRole: "Viewer" | "Reviewer" | "Approver" | "Admin" | string;
  onUpdateQA: (updatedQA: QAData) => void | Promise<void>;
  qaStatus?: any;
};

/* ------------------------- Default data ------------------------- */
const QA_DEFAULT: QAData = {
  revision: "Rev00",
  qa_step: "prepare",
  preparer: "",
  prepare_date: "",
  reviewer: "",
  review_date: "",
  review_complete: "no",
  approver: "",
  approve_date: "",
  approve_complete: "no",
  comments: [],
  qa_log: [],
};

/* ------------------------- Parse helper ------------------------- */
function parseQAFromWrapper(qaStatus: any): QAData {
  const raw = qaStatus?.[0];

  if (!raw || typeof raw !== "string") {
    return QA_DEFAULT;
  }

  try {
    const parsed = JSON.parse(raw);
    const qa = parsed?.qa;

    if (qa && typeof qa === "object") {
      return {
        ...QA_DEFAULT,
        ...qa,
        comments: Array.isArray(qa.comments) ? qa.comments : [],
        qa_log: Array.isArray(qa.qa_log) ? qa.qa_log : [],
      };
    }

    return QA_DEFAULT;
  } catch (error) {
    console.error("Error parsing QA data:", error);
    return QA_DEFAULT;
  }
}

/* ------------------------- Component ------------------------- */
export default function QAPanel({
  siteName,
  currentUser,
  userRole,
  onUpdateQA,
  qaStatus,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const togglePanel = () => setIsOpen((v) => !v);

  const qaData = useMemo(() => parseQAFromWrapper(qaStatus), [qaStatus]);
  const step = qaData.qa_step?.toLowerCase() || "prepare";

  const [commentText, setCommentText] = useState("");

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text) return;

    const updatedQA: QAData = {
      ...qaData,
      comments: [...qaData.comments, { name: currentUser, comment: text }],
    };

    onUpdateQA(updatedQA);
    setCommentText("");
  };

  const handleDeleteComment = (i: number) => {
    const updatedQA: QAData = {
      ...qaData,
      comments: qaData.comments.filter((_, x) => x !== i),
    };
    onUpdateQA(updatedQA);
  };

  /* -------------------- Role Permissions -------------------- */
  const canAccessQA = ["Admin", "Approver", "Reviewer"].includes(userRole);
  const canReview = ["Admin", "Approver", "Reviewer"].includes(userRole);
  const canApprove = ["Admin", "Approver"].includes(userRole);
  if (!canAccessQA) return null;

  /* -------------------- People Lists -------------------- */
  const reviewers = [
    { name: "Mark Armstrong", email: "mark.armstrong@electronet.co.nz" },
    { name: "Brian Luo", email: "brian.luo@electronet.co.nz" },
    { name: "Johan Erasmus", email: "johan.erasmus@electronet.co.nz" },
    { name: "Jason Lightfoot", email: "jason.lightfoot@electronet.co.nz" },
    { name: "Dhairya Goswami", email: "dhairya.goswami@electronet.co.nz" },
    { name: "EA Reviewer", email: "ea_reviewer@plural.co.nz" },
  ];
  const approvers = [
    { name: "Philip Boys", email: "philip.boys@electronet.co.nz" },
    { name: "Torry Hanson", email: "torry.hanson@electronet.co.nz" },
    { name: "Patrick Coombe", email: "patrick.coombe@electronet.co.nz" },
    { name: "Johan Erasmus", email: "johan.erasmus@electronet.co.nz" },
    { name: "Stuart McGirr", email: "stuart.mcgirr@electronet.co.nz" },
    { name: "EA Approver", email: "ea_approver@plural.co.nz" },
    {
      name: "EA Approver & Reviewer",
      email: "ea_approver_reviewer@plural.co.nz",
    },
  ];

  const [selectedReviewer, setSelectedReviewer] = useState<{
    name: string;
    email: string;
  }>({ name: "", email: "" });
  const [selectedApprover, setSelectedApprover] = useState<{
    name: string;
    email: string;
  }>({ name: "", email: "" });

  const handleReviewerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const email = e.target.value;
    const person = [...reviewers, ...approvers].find((p) => p.email === email);
    setSelectedReviewer(person || { name: "", email: "" });
    setShowError(false);
  };

  const handleApproverSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const email = e.target.value;
    const person = [...reviewers, ...approvers].find((p) => p.email === email);
    setSelectedApprover(person || { name: "", email: "" });
    setShowError(false);
  };

  const todayNZ = () =>
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  /* -------------------- Action Handlers -------------------- */
  const handlePreparerSubmit = () => {
    if (!selectedReviewer.name) {
      setShowError(true);
      return;
    }
    const log = `${currentUser} submitted for review to ${selectedReviewer.name} on ${todayNZ()}`;
    const updatedQA: QAData = {
      ...qaData,
      qa_step: "review",
      preparer: currentUser,
      prepare_date: todayNZ(),
      qa_log: [...qaData.qa_log, log],
    };

    onUpdateQA(updatedQA);
    setSelectedReviewer({ name: "", email: "" });
  };

  const uniqByEmail = (arr: { name: string; email: string }[]) =>
    Array.from(new Map(arr.map((p) => [p.email, p])).values());

  const reviewChoices = useMemo(
    () =>
      uniqByEmail([...reviewers, ...approvers]).filter(
        (p) => p.name !== currentUser,
      ),
    [currentUser],
  );

  const handleSubmitForApprove = () => {
    if (!selectedApprover.name) {
      setShowError(true);
      return;
    }
    const log = `${currentUser} completed review and sent for approval to ${selectedApprover.name} on ${todayNZ()}`;
    const updatedQA: QAData = {
      ...qaData,
      qa_step: "approve",
      reviewer: currentUser,
      review_date: todayNZ(),
      review_complete: "yes",
      qa_log: [...qaData.qa_log, log],
    };

    onUpdateQA(updatedQA);
    setSelectedApprover({ name: "", email: "" });
  };

  const handleRejectReview = () => {
    const log = `${currentUser} sent back to preparer on ${todayNZ()}`;
    const updatedQA: QAData = {
      ...qaData,
      review_complete: "no",
      qa_step: "prepare",
      qa_log: [...qaData.qa_log, log],
    };
    onUpdateQA(updatedQA);
  };

  const handleApprove = () => {
    const log = `${currentUser} approved report on ${todayNZ()}`;
    const updatedQA: QAData = {
      ...qaData,
      qa_step: "approved",
      approver: currentUser,
      approve_date: todayNZ(),
      approve_complete: "yes",
      qa_log: [...qaData.qa_log, log],
    };
    onUpdateQA(updatedQA);
  };

  const handleRejectApprove = () => {
    const log = `${currentUser} rejected approval on ${todayNZ()}`;
    const updatedQA: QAData = {
      ...qaData,
      qa_step: "prepare",
      approve_complete: "no",
      qa_log: [...qaData.qa_log, log],
    };
    onUpdateQA(updatedQA);
  };

  const handleUnapprove = () => {
    const log = `${currentUser} reopened approval on ${todayNZ()}`;
    const updatedQA: QAData = {
      ...qaData,
      qa_step: "review",
      approve_complete: "no",
      approver: "",
      approve_date: "",
      qa_log: [...qaData.qa_log, log],
    };
    onUpdateQA(updatedQA);
  };

  const canUnapprove =
    (qaData.qa_step === "approved" || qaData.approve_complete === "yes") &&
    canApprove;

  /* -------------------- Step-based rules -------------------- */
  const canSubmitForReview = step === "prepare" && canReview;
  const canSubmitForApproval = step === "review" && canApprove;
  const canApproveNow = step === "approve" && canApprove;
  const canReopenApproval = step === "approved" && canApprove;

  /* -------------------- UI -------------------- */
  const sections = [
    {
      title: "Prepare",
      fields: [
        { label: "Preparer", value: qaData.preparer },
        { label: "Date", value: qaData.prepare_date },
      ],
    },
    {
      title: "Review",
      fields: [
        { label: "Reviewer", value: qaData.reviewer },
        { label: "Date", value: qaData.review_date },
      ],
    },
    {
      title: "Approve",
      fields: [
        { label: "Approver", value: qaData.approver },
        { label: "Date", value: qaData.approve_date },
      ],
    },
  ];

  return (
    <div className="qa-panel-container">
      <button onClick={togglePanel} className="qa-panel-tab">
        {isOpen ? "▶" : "QA"}
      </button>

      <div className={`qa-panel-main ${isOpen ? "open" : "closed"}`}>
        <div className="qa-panel-content">
          <div className="qa-panel-revision">
            <label className="qa-panel-label">Revision</label>
            <div className="qa-panel-revision-number">{qaData.revision}</div>
          </div>

          {sections.map((s) => (
            <div key={s.title} className="qa-panel-section">
              <h3 className="qa-panel-section-title">{s.title}</h3>
              {s.fields.map((f, i) => (
                <div key={i} className="qa-panel-field">
                  <label className="qa-panel-label">{f.label}</label>
                  <span className="qa-panel-div">{f.value}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Comments */}
          <div className="qa-comments-section">
            <h4>Comments</h4>
            {qaData.comments.map((c, i) => (
              <div key={i} className="comment-item p-2 border rounded mb-2">
                <div className="qa-comment-header">
                  <div>
                    <div className="font-bold">{c.name}</div>
                    <div>{c.comment}</div>
                  </div>
                  {c.name === currentUser && (
                    <button
                      onClick={() => handleDeleteComment(i)}
                      className="qa-delete-button"
                    >
                      delete
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="new-comment-section">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="qa-text-section"
                placeholder="Add your comment here..."
                rows={3}
              />
              <button className="qa-submit-button" onClick={handleAddComment}>
                Add Comment
              </button>
            </div>
          </div>

          {/* Sign Off Section */}
          <div className="qa-submit-section">
            <h4>Sign Off</h4>

            {canSubmitForReview && (
              <>
                <select
                  className="qa-select"
                  onChange={handleReviewerSelect}
                  value={selectedReviewer.email}
                >
                  <option value="">Select reviewer...</option>
                  {reviewChoices.map((p) => (
                    <option key={`review-${p.email}`} value={p.email}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {showError && (
                  <div className="qa-select-error">Must select reviewer</div>
                )}
                <button
                  className="qa-submit-button"
                  onClick={handlePreparerSubmit}
                >
                  Submit for Review
                </button>
              </>
            )}

            {canSubmitForApproval && (
              <>
                <button
                  className="qa-reject-button"
                  onClick={handleRejectReview}
                >
                  Send back to Preparer
                </button>
                <select
                  className="qa-select"
                  onChange={handleApproverSelect}
                  value={selectedApprover.email}
                >
                  <option value="">Select approver...</option>
                  {approvers
                    .filter((p) => p.name !== currentUser)
                    .map((p) => (
                      <option key={`approve` + p.email} value={p.email}>
                        {p.name}
                      </option>
                    ))}
                </select>
                {showError && (
                  <div className="qa-select-error">Must select approver</div>
                )}
                <button
                  className="qa-submit-button"
                  onClick={handleSubmitForApprove}
                >
                  Submit for Approval
                </button>
              </>
            )}

            {canApproveNow && (
              <>
                <button
                  className="qa-reject-button"
                  onClick={handleRejectApprove}
                >
                  Send back to Preparer
                </button>
                <button className="qa-submit-button" onClick={handleApprove}>
                  Approve
                </button>
              </>
            )}

            {canReopenApproval && canUnapprove && (
              <button
                className="btn btn-warning"
                onClick={handleUnapprove}
                style={{ marginTop: 8 }}
              >
                Reopen / Undo Approval
              </button>
            )}
          </div>

          {/* QA Log */}
          <div className="qa-log">
            <div>QA Log:</div>
            {qaData.qa_log.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
