#!/usr/bin/env node

const program = require("commander");
const chalk = require("chalk");
const minimist = require("minimist");

program
  .version(require("../package.json").version)
  .usage("<command> [options]");

program
  .command("init <repoName>")
  .description("使用pg-cli 创建一个新项目仓库")
  .option("-f, --frame <frameName>", "指定依赖的前端框架")
  .option("-c, --cssPreprocessor <processorName>", "指定所需的 css 预处理器")
  .action((name, cmd) => {
    const options = cleanArgs(cmd);

    if (minimist(process.argv.slice(3))._.length > 1) {
      console.log(chalk.yellow("参数名太多了，只取第一个，其他无效"));
    }

    require("../lib/init")(name, options);
  });

program.parse(process.argv);

function cleanArgs(cmd) {
  let args = {};
  cmd.options.forEach((o) => {
    let key = o.long.replace(/^--/, "");
    if (typeof cmd[key] !== "function" && typeof cmd[key] !== "undefined") {
      args[key] = cmd[key];
    }
  });
  return args;
}
