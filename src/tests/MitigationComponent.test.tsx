import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Mitigation from "../components/MitigationComponent";
import axios from "axios";

// keep any other utils mocks you already have, but you no longer need to rely
// on @utilities/api for the SaveMitigations call assertions

const tsData = {
  PA: { hazards: [{ number: "1", name: "Gate 1" }], acceptable: [] },
  RA: { hazards: [], acceptable: [] },
  Step: { hazards: [], acceptable: [] },
};
const conData = { high: [], acceptable: [] };

function renderMitigation(overrides: Partial<React.ComponentProps<typeof Mitigation>> = {}) {
  return render(
    <Mitigation
      site="Example"
      tsData={tsData as any}
      conData={conData as any}
      mitigationData={{
        mitigation: JSON.stringify([{ name: "Asphalt Surface", images: ["/asphalt.png"] }]),
      } as any}
      company="ElectroNet"
      userPermissions="Admin"
      handleSiteChange={vi.fn()}
      {...overrides}
    />
  );
}

it("loads existing mitigations from server payload", () => {
  renderMitigation();
  expect(screen.getByRole("heading", { level: 4, name: /asphalt surface/i })).toBeInTheDocument();
});

it("accepts a new mitigation for a chosen hazard", async () => {
  const user = userEvent.setup();
  renderMitigation();

  await user.click(screen.getByRole("button", { name: /gradient control conductor/i }));
  const modal = screen.getByRole("dialog");
  await user.click(within(modal).getByLabelText(/1: gate 1/i));
  await user.click(within(modal).getByRole("button", { name: /accept mitigation/i }));

  expect(screen.getAllByText(/gradient control conductor/i).length).toBeGreaterThan(0);
});

it("save triggers API with normalized payload", async () => {
  const user = userEvent.setup();
  (axios.post as any).mockResolvedValueOnce({}); // pretend success

  renderMitigation({ mitigationData: { mitigation: "[]" } as any });

  await user.click(screen.getByRole("button", { name: /asphalt surface/i }));
  const modal = screen.getByRole("dialog");
  await user.click(within(modal).getByLabelText(/1: gate 1/i));
  await user.click(within(modal).getByRole("button", { name: /accept mitigation/i }));

  await user.click(screen.getByRole("button", { name: /save/i }));

  expect(axios.post).toHaveBeenCalled();
  const [url, body] = (axios.post as any).mock.calls.at(-1)!;
  expect(String(url)).toMatch(/SaveMitigations/i);
  expect(body).toMatchObject({ client: "ElectroNet", site: "Example" });
  expect(Array.isArray(body.mitigations)).toBe(true);
});

it("shows an error/alert if saving mitigations fails", async () => {
  const user = userEvent.setup();
  (axios.post as any).mockRejectedValueOnce(new Error("Network Error"));

  const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
  renderMitigation({ mitigationData: { mitigation: "[]" } as any });

  await user.click(screen.getByRole("button", { name: /asphalt surface/i }));
  const modal = screen.getByRole("dialog");
  await user.click(within(modal).getByLabelText(/1: gate 1/i));
  await user.click(within(modal).getByRole("button", { name: /accept mitigation/i }));

  await user.click(screen.getByRole("button", { name: /save/i }));

  expect(axios.post).toHaveBeenCalled();
  expect(alertSpy).toHaveBeenCalled();
  alertSpy.mockRestore();
});
