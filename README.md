[English](README_EN.md) | 中文

# 谁是卧底

一个支持线下打印词卡和在线房间的派对游戏。线下玩法可直接使用；在线房间需要配套服务，公开部署仍在准备中。

[在线体验](https://undercover.mozhe.cc/)

## 功能

- 为 3–10 人随机生成词卡，支持类别筛选、主持人卡和打印预览。
- 内置词库可搜索、编辑，也可通过 JSON 导入或导出。
- 在线房间支持建房、发词、轮流描述和投票；可设置公开或私密房间。
- 词库设置和编辑记录保存在当前浏览器。

## 本地运行

```bash
python3 -m http.server 8099
```

打开 `http://127.0.0.1:8099/` 使用线下玩法。在线房间还需要单独运行配套服务；自建部署可在加载 `js/online.js` 前设置 `window.UNDERCOVER_API_BASE`。

项目是原生 HTML、CSS 和 JavaScript，无需构建。扩展词库维护在 `data/word-families.tsv`，修改后运行 `node tools/build-word-expansion.mjs` 生成前端词库数据。
