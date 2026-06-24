// src/tests/SectionHiderComponent.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SectionHider from "../components/SectionHiderComponent";

const togglers = {
  toggleVT: vi.fn(),
  toggleEPR: vi.fn(),
  toggleTS: vi.fn(),
  toggleCon: vi.fn(),
  toggleCTInsp: vi.fn(),
  toggleCurrentDist: vi.fn(),
  toggleVisInsp: vi.fn(),
  toggleMitigation: vi.fn(),
  generatePDF: vi.fn(),
};

const ResponseObj = {
  CurrentDistRecord: {},
  ConRecord: {},
  CTInspRecord: {},
  VisualInspectionRecord: [],
  MitigationSelection: [],
};

it("clicking section switches triggers the corresponding callbacks", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <SectionHider ResponseObj={ResponseObj as any} {...togglers} company="ElectroNet" />
  );

  // MUI Switch renders as role="checkbox"; each has a unique wrapper id in your DOM
  const vt = container.querySelector<HTMLInputElement>("#vt-hider input[type='checkbox']");
  const epr = container.querySelector<HTMLInputElement>("#epr-hider input[type='checkbox']");
  const ts = container.querySelector<HTMLInputElement>("#ts-hider input[type='checkbox']");
  const mitigation = container.querySelector<HTMLInputElement>("#mitigation-hider input[type='checkbox']");

  expect(vt).toBeTruthy();
  await user.click(vt!);
  expect(togglers.toggleVT).toHaveBeenCalled();

  expect(epr).toBeTruthy();
  await user.click(epr!);
  expect(togglers.toggleEPR).toHaveBeenCalled();

  expect(ts).toBeTruthy();
  await user.click(ts!);
  expect(togglers.toggleTS).toHaveBeenCalled();

  expect(mitigation).toBeTruthy();
  await user.click(mitigation!);
  expect(togglers.toggleMitigation).toHaveBeenCalled();

  // Button label in your UI is "Generate Report"
  await user.click(screen.getByRole("button", { name: /generate report/i }));
  expect(togglers.generatePDF).toHaveBeenCalled();
});
