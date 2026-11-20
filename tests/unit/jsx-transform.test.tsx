// Guards the Vitest JSX setup (A7 re-review N1): .test.tsx files must be able to use JSX.
import { expect, it } from "vitest";

it("compiles JSX in .test.tsx files", () => {
  const element = <div title="probe" />;
  expect(element.props.title).toBe("probe");
});
