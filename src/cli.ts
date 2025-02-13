#!/usr/bin/env node

import { run } from "./runtime";
import { Command } from "commander";
import { readFileSync } from "fs";
import { resolve } from "path";

const program = new Command();

program
    .name("fenrir")
    .description("Fenrir")
    .version("1.0.0");

program
    .command("run <input>")
    .description("Run a .fnr file")
    .action((input) => {
        const filePath = resolve(process.cwd(), input);
        const fenrirCode = readFileSync(filePath, "utf-8");
        run(filePath);
    });

program.parse(process.argv);