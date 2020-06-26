const chalk = require("chalk");
const execa = require("execa");
const inquirer = require("inquirer");
const path = require("path");
const cloneDeep = require("lodash.clonedeep");

const writeFileTree = require("./utils/writeFileTree");
const { hasYarn } = require("./utils/env");
const PackageManager = require("./utils/packageManager");
const sortObject = require("./utils/sortObject");
const Generator = require("./utils/Generator");
const { loadModules } = require("./utils/module");
const generateReadme = require("./utils/generateReadme");

const { defaults, loadOptions, defaultFrame } = require("./options");

module.exports = class Initiator {
  constructor(name, context) {
    this.name = name;
    this.ctx = process.env.PG_CLI_RESOURCE = context;
    this.frameCtx = "";

    const { framePrompt } = this.resolveFramePrompts();
    this.framePrompt = framePrompt;

    this.run = this.run.bind(this);
  }

  async initiate(options) {
    let { name, ctx, frameCtx, run } = this;
    // 初始化 前端项目 package.json

    let plugs = {};

    let useFrame = "";

    if (options.frame) {
      if (!defaultFrame.includes(options.frame.toLowerCase())) {
        console.log(
          chalk.red(`暂不支持 框架${options.frame}, vue, react 可任选其一`)
        );
        return;
      } else {
        useFrame = options.frame;
      }
    } else {
      // 提示
      let answer = await inquirer.prompt([this.framePrompt]);
      useFrame = answer.frame;
    }

    frameCtx = path.join(ctx, useFrame);

    plugs["pg-cli-service"] = Object.assign({
      projectName: name,
    });

    plugs[`pg-template-frame-${useFrame}`] = {};

    const packageManager =
      loadOptions().packageManager || (hasYarn() ? "yarn" : "npm");
    const pm = new PackageManager({
      frameCtx,
      forcePackageManager: packageManager,
    });

    console.log();
    console.log(
      chalk.green(
        `✨ 项目${chalk.bgBlack(`${name}`)}正在 目录 ${chalk.bgBlack(
          `${frameCtx}`
        )} 生成中...`
      )
    );
    console.log();

    const pkg = {
      name,
      version: "0.1.0",
      private: true,
      devDependencies: {},
    };

    const deps = Object.keys(plugs);

    deps.forEach((dep) => {
      pkg.devDependencies[dep] = plugs[dep].version || "latest";
    });

    //写入package.json
    await writeFileTree(frameCtx, {
      "package.json": JSON.stringify(pkg, null, 2),
    });

    // return;

    // 初始化git仓库
    console.log();
    console.log(chalk.green(`🗃  初始化git 仓库...`));
    console.log();
    await run("git init");

    // 安装cli 插件
    console.log();
    console.log(chalk.green(`⚙  安装命令行工具所需插件，可能需要等一会儿...`));
    console.log();
    await pm.install();

    // 执行插件中的generator
    console.log();
    console.log(chalk.green(`🚀  执行生成器...`));
    console.log();
    const plugins = await this.resolvePlugins(preset.plugins);
    const generator = new Generator(ctx, {
      pkg,
      plugins,
    });

    await generator.generate({
      extractConfigFiles: preset.useConfigFiles,
    });

    // 安装条件依赖
    console.log();
    console.log(chalk.green(`📦  安装自定义依赖...`));
    console.log();
    await pm.install();

    // 执行完成时的钩子函数
    console.log();
    console.log(chalk.green(`⚓  执行完成钩子...`));
    console.log();

    //生成 read.me
    console.log();
    console.log(chalk.green(`📄 生成READ.ME 文件...`));
    console.log();
    await writeFileTree(ctx, {
      "README.md": generateReadme(pkg, packageManager),
    });

    const shouldInitGit = options.git;
    if (shouldInitGit) {
      await run("git add -A");

      try {
        await run("git", ["commit", "-m", "初始化git提交"]);
      } catch (e) {
        console.log(
          chalk.yellow(`😈 项目 ${name} 初始化提交失败 ，请尝试手动提交`)
        );
      }
    }

    // 提示成功
    console.log();
    console.log(chalk.green(`🎉  成功创建项目 ${name}.`));
    console.log();
  }

  // 返回 框架选择 prompt
  resolveFramePrompts() {
    const frames = defaultFrame;

    const frameChoices = frames.map((name) => ({
      name,
      value: name,
    }));

    const framePrompt = {
      name: "frame",
      type: "list",
      message: "请选择一个依赖的前端框架：",
      choices: frameChoices,
    };

    return { framePrompt };
  }

  getPresets() {
    const savedOptions = loadOptions();
    return Object.assign({}, savedOptions.presets, defaults.presets);
  }

  async promptAndResolvePreset(answers = null) {
    if (!answers) {
      answers = await inquirer.prompt([this.presetPrompt]);
    }

    let preset;
    if (answers.preset) {
      preset = await this.resolvePreset(answers.preset);
    }

    return preset;
  }

  async resolvePreset(name) {
    let preset;
    const savedPresets = loadOptions().presets;

    if (name in savedPresets) {
      preset = savedPresets[name];
    }

    if (name === "default" && !preset) {
      preset = defaults.presets.default;
    }

    if (!preset) {
      console.log(chalk.yellow("preset 没有找到"));
      const presets = Object.keys(savedPresets);
      if (presets.length > 0) {
        console.log(chalk.green(`可能的preset 如下: ${presets.join("\n")}`));
      } else {
        console.log(chalk.red("没有perset ，手动配置一下吧"));
      }
      process.exit(1);
    }

    return preset;
  }

  async resolvePlugins(rawPlugins) {
    rawPlugins = sortObject(rawPlugins, ["pg-cli-service"], true);

    const plugins = [];

    for (const id of Object.keys(rawPlugins)) {
      let apply = loadModules(`${id}/generator`, this.ctx) || (() => {});
      let options = rawPlugins[id] || {};
      plugins.push({ id, apply, options });
    }

    return plugins;
  }

  run(cmd, args) {
    if (!args) {
      [cmd, ...args] = cmd.split(/\s+/);
    }
    return execa(cmd, args, { cwd: process.env.PC_CLI_ROOT });
  }
};
