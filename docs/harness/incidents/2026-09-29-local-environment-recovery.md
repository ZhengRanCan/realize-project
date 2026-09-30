# Incident: 安装后仍误报环境不可用

- ID: INC-2026-09-29-LOCAL-ENVIRONMENT
- Date: 2026-09-29
- Source feature: F11 / environment recovery
- Trigger: 用户安装 Node/Electron 并将目录改名后，会话仍引用旧 PATH 与旧目录。
- Symptom: npm 找不到、旧 cwd 不存在、下载目录没有 Git 元数据；直连 GitHub reset。
- Impact: 误把环境缓存问题报告成依赖未安装，阻碍门禁和提交。

## Reproduction or evidence

新目录为 C:/Users/ASUS/Desktop/realize-project；Node v24.21.0、npm 11.19.0、Electron 31.7.7。
旧会话 PATH 只找到 bundled Node；系统 PATH 已包含 C:/Program Files/nodejs。
本轮使用已安装 npm 后 test:all 与 Electron selftest 均通过。
Git 恢复前后 603 个本地文件哈希完全一致；远端工作分支已存在。

## Suspected root cause

运行中的父进程继承旧环境；目录改名不更新会话 cwd。项目是无 .git 的文件副本。
本地 Clash 运行于 7897，但 Git 没有代理配置。

## Immediate fix or workaround

命令显式使用实际 workdir，并在当前子进程 PATH 前置已安装的 Node 目录；不覆盖系统 PATH。
Git init + fetch + mixed reset 恢复真实历史和索引，不检出覆盖文件；配置本仓库 http.proxy 为本地 Clash 并设置上游。
新的终端会继承系统已有 PATH；旧桌面会话需要重新打开实际项目目录以刷新 cwd/环境。

## Lesson candidate

- Prevention: 用户报告安装完成后重新检查真实安装路径、依赖文件和当前 cwd，不能复用旧故障结论；通过标准命令验证。
- Applies to: 本地环境诊断与目录迁移。

## Follow-up target

F11 保持 blocked，直到人工复核与验收记录完成；环境恢复不代表语义迁移完成。
