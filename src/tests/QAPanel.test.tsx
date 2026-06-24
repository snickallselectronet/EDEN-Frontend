import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import QAPanel from "../components/QAPanel";

const baseWrapper = {
  qaStatus: [JSON.stringify({ qa: { revision: "Rev01", qa_step: "prepare", comments: [], qa_log: [] } })],
};

function renderQA(overrides: Partial<React.ComponentProps<typeof QAPanel>> = {}) {
  const onUpdateQA = vi.fn();
  render(
    <MemoryRouter>
      <QAPanel
        siteName="Test Site"
        currentUser="Alice"
        userRole="Approver"
        onUpdateQA={onUpdateQA}
        qaWrapper={baseWrapper as any}
        {...overrides}
      />
    </MemoryRouter>
  );
  return { onUpdateQA };
}

const openTab = () => {
  const tab = screen.getByRole("button", { name: /^qa$/i }); // avoid "QA Log:" clash
  fireEvent.click(tab);
};

it("shows revision from qaWrapper and can open the panel", () => {
  renderQA();
  openTab();
  expect(screen.getByText(/revision/i)).toBeInTheDocument();
  expect(screen.getByText("Rev01")).toBeInTheDocument();
});

it("adding a comment calls onUpdateQA with new comment", () => {
  const { onUpdateQA } = renderQA({ userRole: "Reviewer" });
  openTab();
  const input = screen.getByPlaceholderText(/add your comment/i);
  fireEvent.change(input, { target: { value: "Looks good" } });
  fireEvent.click(screen.getByRole("button", { name: /add comment/i }));
  expect(onUpdateQA).toHaveBeenCalled();
  const payload = onUpdateQA.mock.calls.at(-1)?.[0];
  expect(payload.comments[0]).toMatchObject({ name: "Alice", comment: "Looks good" });
});

it("requires selecting a reviewer before submitting for review", () => {
  const { onUpdateQA } = renderQA({ userRole: "Viewer" });
  openTab();
  fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));
  expect(screen.getByText(/select reviewer/i)).toBeInTheDocument(); // adjust to your UI copy
  expect(onUpdateQA).not.toHaveBeenCalled();
});

it("viewer clicking submit does not call onUpdateQA", () => {
  const { onUpdateQA } = renderQA({ userRole: "Viewer" });
  openTab();
  fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));
  expect(onUpdateQA).not.toHaveBeenCalled();
});

it("approver sees an enabled 'Submit for Review' button", () => {
  renderQA({ userRole: "Approver" });
  openTab();
  const submit = screen.getByRole("button", { name: /submit for review/i });
  expect(submit).toBeEnabled();
});
