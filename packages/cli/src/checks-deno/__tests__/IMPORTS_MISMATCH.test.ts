import { expect, it } from "vitest";
import importsMismatch from "../IMPORTS_MISMATCH.ts";
import { getWS, getFakeWS, getRootWS } from "../../checks/__tests__/test-helpers.ts";

let rootWorkspace = getRootWS();

it("should error if the ranges are valid and they are not equal", () => {
  let ws = getWS();

  ws.get("pkg-1")!.packageJson.imports = { "@std/fmt": "jsr:@std/fmt@0.221.0" };

  let pkg2 = getFakeWS("pkg-2");
  pkg2.packageJson.imports = {
    "@std/fmt": "jsr:@std/fmt@0.222.0",
  };
  ws.set("pkg-2", pkg2);

  let errors = importsMismatch.validate(pkg2, ws, rootWorkspace, {});
  expect(errors.length).toEqual(1);
  expect(errors).toMatchInlineSnapshot(`
    [
      {
        "dependencyName": "@std/fmt",
        "dependencyRange": "jsr:@std/fmt@0.222.0",
        "mostCommonDependencyRange": "jsr:@std/fmt@0.221.0",
        "type": "IMPORTS_MISMATCH",
        "workspace": {
          "dir": "fake/monorepo/packages/pkg-2",
          "packageJson": {
            "imports": {
              "@std/fmt": "jsr:@std/fmt@0.222.0",
            },
            "name": "pkg-2",
            "version": "1.0.0",
          },
          "relativeDir": "packages/pkg-2",
        },
      },
    ]
  `);
});
