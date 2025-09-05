import { makeCheck, getMostCommonRangeMap } from "../checks/utils.ts";
import type { Package } from "@manypkg/get-packages";

type ErrorType = {
  type: "IMPORTS_MISMATCH";
  workspace: Package;
  dependencyName: string;
  dependencyRange: string;
  mostCommonDependencyRange: string;
};

export default makeCheck<ErrorType>({
  validate: (workspace, allWorkspace) => {
    let errors: ErrorType[] = [];
    let mostCommonRangeMap = getMostCommonRangeMap(allWorkspace, "imports");
    let deps = workspace.packageJson.imports;

    if (deps) {
      for (let depName in deps) {
        let range = deps[depName];
        let mostCommonRange = mostCommonRangeMap.get(depName);
        if (
          mostCommonRange !== undefined &&
          mostCommonRange !== range
        ) {
          errors.push({
            type: "IMPORTS_MISMATCH",
            workspace,
            dependencyName: depName,
            dependencyRange: range,
            mostCommonDependencyRange: mostCommonRange,
          });
        }
      }
    }
    return errors;
  },
  fix: (error) => {
    let deps = error.workspace.packageJson.imports;
    if (deps && deps[error.dependencyName]) {
      deps[error.dependencyName] = error.mostCommonDependencyRange;
    }
    return { requiresInstall: false };
  },
  print: (error) =>
    `${error.workspace.packageJson.name} has a dependency on ${error.dependencyName}@${error.dependencyRange} but the most common range in the repo is ${error.mostCommonDependencyRange}, the range should be set to ${error.mostCommonDependencyRange}`,
  type: "all",
});
