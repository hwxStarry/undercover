[English](README_EN.md) | 中文

# 谁是卧底 — 在线与线下派对游戏

🎴 首页提供「在线玩」和「线下玩」两个入口。在线房间已接入 mozheAdmin 本地开发服务，支持建房、加入、发词、描述和投票；公开部署仍在准备中。词库内置 2,185 组词、61 个类别，支持 3~10 人。

> 🚀 在线使用：[undercover.mozhe.cc](https://undercover.mozhe.cc/)

## 功能特性

- **随机生成**：每组游戏随机抽取词汇，卧底词自动轮换，确保公平
- **大词库**：内置 2,185 组词，涵盖水果、蔬菜、动物、电子产品、食物、服饰等 61 个类别
- **类别筛选**：可按需勾选/排除特定类别，灵活控制词库范围
- **多种配置**：支持 3~10 人，每卡 30/50/100 词，中国红虚线 / 简约黑线两种风格
- **主持人卡**：4 人及以上自动生成主持人卡，标记卧底差异词
- **打印预览**：自动分页，卡片不会被截断，支持小/中/大三种字号
- **词库编辑**：内置编辑面板，支持搜索、新增、修改、删除词组，也可 JSON 导入/导出
- **数据持久化**：词库和类别选择自动保存到浏览器 localStorage

## 使用方式

线下玩法仍是纯静态页面，直接打开 `index.html` 即可使用。在线玩法需要同时启动 mozheAdmin 服务端，并通过 HTTP 访问本页面；本地可在仓库根目录执行 `python3 -m http.server 8099`，然后打开 `http://127.0.0.1:8099/#online`。`undercover.mozhe.cc` 默认连接 `https://admin.mozhe.cc/undercover/api/v1`；其他线上域名默认使用同源 `/undercover/api/v1`，也可在加载 `js/online.js` 前设置 `window.UNDERCOVER_API_BASE`。

在线建房可选择公开或不公开：公开房间显示在大厅，无需房间码即可加入；不公开房间凭六位房间码加入。房主可选择词库类别或从全部词库随机，并设置 1–10 局。每局 1 名卧底、3–10 人；轮流描述后全员投票，平票重投。卧底出局则平民胜；存活人数到 1 对 1 时卧底胜。单局结束后房主开启下一局，重新发词、选卧底；页面会在当前设备保存玩家凭证，以便刷新后继续游戏。

首次进入在线玩法需要输入昵称，也可以点「随机一个」。确认后昵称保存在当前浏览器，后续建房或加入房间直接使用；点击页面上的当前昵称可随时修改，已在房间内时会同步给其他玩家。随机昵称用本站维护的中英文词表组合生成，参考常见游戏昵称生成器的「描述词 + 对象词」方式，不依赖运行时第三方包。

### 游戏规则

1. 选择玩家人数（3~10 人）和每卡词数
2. 点击「随机生成」，系统为每位玩家生成一张卡片
3. 每张卡片上 N-1 个词相同，1 个词不同（卧底词）
4. 4 人及以上额外生成主持人卡，标记出卧底差异词
5. 打印卡片，分发给玩家，开始游戏

### 导入词库

点击「导入词库」，粘贴 JSON 格式数据：

```json
[
  { "base": "苹果", "variants": ["香蕉", "葡萄", "橘子"], "category": "水果" },
  { "base": "可乐", "variants": ["雪碧", "芬达"], "category": "饮品" }
]
```

## 开发

纯静态页面，无构建工具。CSS 和 JS 通过传统 `<link>` / `<script>` 标签引入，改完代码刷新浏览器就能看到效果。

在线玩法的输入框、下拉框和按钮使用本地保存的 Bootstrap 5.3.8 CSS（MIT 许可证见 `css/vendor/bootstrap-LICENSE.txt`）；配色和布局由 `css/landing.css` 调整。不依赖 Bootstrap JavaScript 或外部 CDN。

新增词语在 `data/word-families.tsv` 中按语义小类维护，执行 `node tools/build-word-expansion.mjs` 会同步生成前端 `js/library-expanded.js` 和服务端 `mozheAdmin/database/seeds/undercover_words_expanded.json`。每个词会与同组邻近的四个词组成候选对；生成脚本会检查空词、组内重复和无效词对。汉语词汇无法穷尽，收录重点是能用于描述和辨认的词对。旧版浏览器中基于默认词库保存的编辑记录会合并新增词语；自定义导入的独立词库保持原样。

## 搜索引擎收录

项目已有各搜索引擎共用的抓取入口：

- `sitemap.xml`：站点地图，地址为 `https://undercover.mozhe.cc/sitemap.xml`
- `robots.txt`：允许搜索引擎抓取，并声明 sitemap 地址
- `baidu_urls.txt`：可在百度搜索资源平台做链接提交时使用的 URL 列表
- `index.html`：已添加 `Baiduspider`、移动适配、sitemap 相关 meta/link 和 `SoftwareApplication` 结构化数据

百度：建议在百度搜索资源平台完成站点验证后，提交 sitemap 或使用“快速收录/链接提交”提交 `baidu_urls.txt` 中的链接。百度官方说明链接提交可以缩短爬虫发现链接的时间，但不保证一定收录。

Google：建议在 Google Search Console 验证站点后，在 Sitemaps 报告中提交 `https://undercover.mozhe.cc/sitemap.xml`；如果只是更新首页，也可以用 URL Inspection 工具请求重新编入索引。Google 官方说明 sitemap 是抓取提示，不保证一定抓取或收录。

Bing：可在 Bing Webmaster Tools 中导入已验证的 Google Search Console 站点，或单独验证域名，然后提交同一份 sitemap。360 搜索和搜狗搜索可分别使用官方的网站提交入口；360 的站长平台还支持 sitemap。站点验证文件存在于仓库，只代表验证方法已准备好，是否已经验证成功须在各平台后台查看。

统计工具的「搜索引擎来源」只记录实际进入网站的点击；某引擎显示 0，不能据此判断页面未被收录。判断收录、展现与点击应看对应站长平台的索引和搜索表现报告。目前在线与线下玩法用 `#online`、`#offline` 切换，共用首页 URL，sitemap 只列首页；若要让规则、词库等主题分别参与搜索，应建立有实际内容和普通链接的独立 HTML 页面，避免把 hash 片段当作独立可索引页面。

### SEO 可行方案

已完成：

- 合理扩展首页标题、描述和关键词覆盖，增加“谁是卧底词库 / 谁是卧底题库 / 卧底词 / 打印卡片”等搜索词。
- 首页主标题直接说明「谁是卧底」，并在两个玩法入口下方展示发词、描述、投票的简明规则；页面标题和摘要概括实际可用的玩法。
- 在页面底部增加用户可见的词库说明和常见问题，避免只在 meta 中堆关键词。
- 增加 `SoftwareApplication` 和 `FAQPage` 结构化数据，帮助搜索引擎理解页面类型和问答内容。
- 增加 `sitemap.xml`、`robots.txt`、canonical 和移动适配标记。
- 将 `undercover.mozhe.cc` 设为 canonical 主域名，避免 GitHub Pages 项目路径和自定义域名分散权重。

后续建议：

- 使用自定义域名或用户主页仓库，让 `robots.txt` 位于域名根目录，例如 `https://example.com/robots.txt`。
- 在 Google Search Console 和百度搜索资源平台完成站点验证，并提交 sitemap。
- 增加独立内容页，例如“谁是卧底游戏规则”“谁是卧底词库大全”“聚会游戏打印卡片模板”，每页聚焦一个搜索意图。
- 为常见类别生成可索引的静态词库页，例如水果词库、动物词库、食物词库，避免只有 JS 动态内容。
- 增加真实外链入口，例如 README、个人主页、博客文章、社交平台介绍页，提高爬虫发现概率。
- 保持首页首屏工具可用，避免为了 SEO 增加大段重复文字；Google 明确不使用 `meta keywords`，关键词应自然出现在标题、正文、链接和结构化内容中。
- 发布新版后，在百度搜索资源平台查看首页索引量和「流量与关键词」，分别记录「谁是卧底」与「谁是卧底 可打印」的展现和点击；提交 sitemap 只能帮助发现更新，不能保证排名。

### 项目结构

```
├── index.html                  # 当前站点入口
├── css/style.css               # 线下词卡样式
├── css/landing.css             # 首页和玩法入口样式
├── css/vendor/                 # Bootstrap CSS 及许可证
├── data/word-families.tsv      # 扩展词库的语义小类
├── js/
│   ├── library.js              # 词库数据
│   ├── library-expanded.js     # 生成的扩展词库
│   ├── nickname.js             # 中英文随机昵称生成
│   ├── online.js               # 在线房间和昵称流程
│   ├── render.js               # 卡片渲染与打印
│   ├── edit.js                 # 词库编辑与导入导出
│   ├── i18n.js                 # 多语言切换
│   ├── navigation.js           # 首页、在线和线下页面切换
│   ├── locales/                # 中英文文案
│   └── main.js                 # 事件绑定与初始化
├── tools/build-word-expansion.mjs # 同步生成前后端扩展词库
├── CNAME                       # 自定义域名
├── robots.txt / sitemap.xml    # 搜索引擎入口
├── baidu_urls.txt              # 百度链接提交地址
├── baidu_verify_*.html         # 百度站点验证文件，需保留在根目录
└── google*.html                # Google 站点验证文件，需保留在根目录
```

部署时请保持 `index.html`、`css/`、`js/` 以及根目录的域名和搜索验证文件位置不变。

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl + G | 在线下玩法中随机生成卡片 |
| Esc | 关闭弹窗 |

## License

MIT
