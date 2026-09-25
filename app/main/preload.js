'use strict';

/**
 * Preload：向渲染进程暴露最小、安全的 IPC API（agent.md 第二节）。
 *
 * 渲染进程不接触 node fs，也不接触 API Key / 网络能力。
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('designReview', {
  paths: () => ipcRenderer.invoke('app:paths'),

  loadFixture: () => ipcRenderer.invoke('design:loadFixture'),
  openDesignJson: () => ipcRenderer.invoke('design:openJson'),
  loadDesignPath: (designPath) => ipcRenderer.invoke('design:loadPath', { path: designPath }),
  saveDesignJson: (content, targetPath) =>
    ipcRenderer.invoke('design:saveJson', { content, path: targetPath }),

  openMarkdown: () => ipcRenderer.invoke('document:openMarkdown'),
  readDefaultMarkdown: () => ipcRenderer.invoke('document:readDefault'),

  saveHumanReview: (humanReview, targetPath) =>
    ipcRenderer.invoke('humanReview:save', { humanReview, path: targetPath }),
  revealHumanReview: () => ipcRenderer.invoke('humanReview:reveal'),

  evaluateGate: () => ipcRenderer.invoke('gate:evaluate'),

  // 原文回查：Source 标签点开时右侧显示对应章节
  loadSource: () => ipcRenderer.invoke('source:load'),
});
