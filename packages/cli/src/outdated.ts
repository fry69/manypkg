import { getPackages } from "@manypkg/get-packages";
import { exec } from "tinyexec";
import * as logger from "./logger.ts";

export async function outdated(cwd: string) {
  const { packages, tool } = await getPackages(cwd);

  if (tool.type !== "deno") {
    logger.error("The outdated command is only for Deno projects.");
    return;
  }

  logger.info("Checking for outdated Deno dependencies...");

  for (const pkg of packages) {
    const { stdout } = await exec("deno", ["run", "-A", "jsr:@check/deps", "--allow-unused", "--target", "."], {
        cwd: pkg.dir,
    });

    const lines = stdout.split("\n");
    // The first line is the header, and the last line is empty.
    const dependencyLines = lines.slice(1, -1);

    const outdatedDeps = dependencyLines.map(line => {
        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length < 4) return null;
        const [pkg, current, wanted, latest, status] = parts;
        return { pkg, current, wanted, latest: status === 'Outdated' ? latest : wanted, status };
    }).filter((dep): dep is NonNullable<typeof dep> => dep !== null && dep.status === "Outdated");

    if (outdatedDeps.length > 0) {
        logger.info(`Outdated dependencies in ${pkg.packageJson.name}:`);
        for (const dep of outdatedDeps) {
            // Skip pre-release versions if current and latest are the same
            if (dep.current === dep.latest && dep.status === "Outdated") {
                logger.info(`Skipping incorrectly flagged pre-release version: ${dep.pkg}@${dep.current}`);
                continue;
            }
            // Skip complex http aliases
            if (dep.pkg.startsWith('https://')) {
                logger.info(`Skipping complex HTTP alias: ${dep.pkg}`);
                continue;
            }
            logger.info(`  ${dep.pkg}: ${dep.current} -> ${dep.latest}`);
        }
    } else {
        logger.success(`All dependencies are up to date in ${pkg.packageJson.name}`);
    }
  }
}
