#!/usr/bin/env bun

import { Command } from "commander";
import { runWakeup } from "./tui/wakeup";

const program = new Command();

program
  .name("YASHU-CLI")
  .description("yashu cli")
  .version("0.0.1");

program
  .command("wakeup")
  .description("Show the banner and pick cli or telegram mode")
  .allowExcessArguments(true)
  .action(async () => {
    await runWakeup();
  });

// No subcommand given (or a bare phrase like `HI-ITS-YASHU wakeup lets go`)
// -> still wake up the agent.
const ARGS = process.argv.slice(2);

if (ARGS.length === 0) {
  await runWakeup();
} else if (ARGS[0]?.toLowerCase() === "wakeup") {
  await runWakeup();
} else {
  await program.parseAsync(process.argv);
}