import { outdated } from "./outdated.ts";
import { getPackages } from "@manypkg/get-packages";
import { exec } from "tinyexec";
import * as logger from "./logger.ts";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@manypkg/get-packages");
vi.mock("tinyexec");
vi.mock("./logger.ts");

describe("outdated command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should check for outdated dependencies in a deno project", async () => {
    const mockGetPackages = getPackages as ReturnType<typeof vi.fn>;
    mockGetPackages.mockResolvedValue({
      tool: { type: "deno" },
      packages: [
        {
          dir: "/path/to/package-a",
          packageJson: { name: "package-a" },
        },
      ],
    });

    const mockExec = exec as ReturnType<typeof vi.fn>;
    mockExec.mockResolvedValue({
      stdout: `
Package                                     Current    Wanted           Latest
jsr:@std/assert@1.0.0                       1.0.0      1.0.1            1.0.1      Outdated
npm:preact@10.27.1                          10.27.1    10.27.1          10.27.1    Up-to-date
jsr:@fresh/plugin-tailwind@0.0.1-alpha.9    0.0.1-alpha.9 0.0.1-alpha.9 0.0.1-alpha.9 Outdated
https://esm.sh/@1.2.12?alias=react          1.2.12     1.2.13           1.2.13     Outdated
`,
    });

    await outdated("/fake/cwd");

    expect(logger.info).toHaveBeenCalledWith("Outdated dependencies in package-a:");
    expect(logger.info).toHaveBeenCalledWith("  jsr:@std/assert@1.0.0: 1.0.0 -> 1.0.1");
    expect(logger.info).toHaveBeenCalledWith("Skipping incorrectly flagged pre-release version: jsr:@fresh/plugin-tailwind@0.0.1-alpha.9@0.0.1-alpha.9");
    expect(logger.info).toHaveBeenCalledWith("Skipping complex HTTP alias: https://esm.sh/@1.2.12?alias=react");
  });
});
