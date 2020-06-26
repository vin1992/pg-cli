const validName = require("validate-npm-package-name");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs-extra");
const inquirer = require("inquirer");
const Initiator = require("./Initiator");

async function init(name, options) {
  const cwd = options.cwd || process.cwd();
  let targetDir = path.resolve(cwd, name);

  // 校验name 是否合法
  const result = validName(name);
  if (!result.validForNewPackages) {
    console.log(chalk.red(`项目名称${name}非法`));
    result.errors && console.log(chalk.red(`[Error] ${result.errors}`));
    result.warnings &&
      console.log(chalk.yellow(`[Warning] ${result.warnings}`));
    process.exit(1);
  }

  // TODO: 文件已存在
  if (fs.existsSync(targetDir)) {
    const { action } = await inquirer.prompt([
      {
        name: "action",
        type: "list",
        message: `目标路径 ${chalk.cyan(targetDir)} 已经存在，请选择一个操作:`,
        choices: [
          { name: "复写", value: "overwrite" },
          { name: "合并", value: "merge" },
          { name: "取消", value: false },
        ],
      },
    ]);
    if (!action) {
      return;
    } else if (action === "overwrite") {
      console.log(`正在删除 ${chalk.cyan(targetDir)}...`);
      await fs.remove(targetDir);
    }
  }

  process.env.PG_CLI_ROOT = targetDir;

  targetDir = path.join(targetDir, "resource");

  const initiator = new Initiator(name, targetDir);
  initiator.initiate(options);
}

module.exports = (...args) => {
  return init(...args).catch((e) => {
    process.exit(1);
  });
};
