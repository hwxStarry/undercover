const zhCN = {
  // Header
  "app.title": "词语卡片随机生成器",
  "app.subtitle": "谁是卧底 · 派对游戏 · 一键生成 · 即印即玩",

  // Settings
  "settings.title": "游戏设置",
  "settings.playerCount": "玩家数量",
  "settings.wordsPerCard": "每卡词数",
  "settings.cardStyle": "卡片风格",
  "settings.fontSize": "打印字号",

  // Player count options
  "players.3": "3人",
  "players.4": "4人",
  "players.5": "5人",
  "players.6": "6人",
  "players.7": "7人",
  "players.8": "8人",
  "players.9": "9人",
  "players.10": "10人",

  // Word count options
  "words.30": "30词",
  "words.50": "50词",
  "words.100": "100词",

  // Style options
  "style.red": "中国红虚线",
  "style.simple": "简约黑线",

  // Font size options
  "fontSize.small": "小号",
  "fontSize.medium": "中号",
  "fontSize.large": "大号",

  // Buttons
  "btn.generate": "🎲 随机生成",
  "btn.edit": "✏️ 编辑词库",
  "btn.import": "📥 导入词库",
  "btn.reset": "🔄 重置词库",
  "btn.printAll": "🖨️ 打印全部玩家卡",
  "btn.printHost": "🖨️ 打印主持人卡",
  "btn.regenerate": "🔄 重新生成",

  // Category
  "category.label": "词库类别",
  "category.selectAll": "全选",
  "category.selectNone": "全不选",
  "category.invert": "反选",

  // Stats
  "stats.librarySize": "词库组数",
  "stats.cards": "已生成卡片",
  "stats.diff": "卧底差异词",

  // Preview
  "preview.player": "玩家",
  "preview.hostCard": "主持人卡",
  "preview.hostBadge": "差异词红色高亮",
  "preview.card": "卡片",
  "preview.empty.icon": "🎴",
  "preview.empty.title": "点击上方「🎲 随机生成」开始生成卡片",
  "preview.empty.subtitle": "支持 3~10 人，每人一张卡片",

  // Footer
  "footer.text": "词语卡片随机生成器 · 内置 410+ 组语义词库 · 支持编辑/导入",

  // Import Modal
  "import.title": "📥 导入词库",
  "import.hint": "粘贴 JSON 格式词库，每组含 base（基准词）、variants（变体词数组）和 category（类别）。<br>示例：<code>[{\"base\":\"苹果\",\"variants\":[\"香蕉\",\"葡萄\",\"橘子\"],\"category\":\"水果\"},{\"base\":\"可乐\",\"variants\":[\"雪碧\",\"芬达\"],\"category\":\"饮品\"}]</code>",
  "import.placeholder": "[{\"base\":\"苹果\",\"variants\":[\"香蕉\",\"葡萄\",\"橘子\"],\"category\":\"水果\"},{\"base\":\"可乐\",\"variants\":[\"雪碧\",\"芬达\"],\"category\":\"饮品\"}]",
  "import.cancel": "取消",
  "import.confirm": "确认导入",

  // Edit Modal
  "edit.title": "✏️ 编辑词库",
  "edit.searchPlaceholder": "搜索基准词或变体词…",
  "edit.addBtn": "+ 添加词组",
  "edit.count": "共",
  "edit.countShow": "显示",
  "edit.countUnit": "组",
  "edit.tableNum": "#",
  "edit.tableBase": "基准词",
  "edit.tableVariants": "变体词",
  "edit.tableCategory": "分类",
  "edit.tableActions": "操作",
  "edit.save": "💾 保存词库",
  "edit.cancel": "取消",

  // Edit Row Modal
  "editRow.addTitle": "添加词组",
  "editRow.editTitle": "编辑词组",
  "editRow.base": "基准词",
  "editRow.basePlaceholder": "如：苹果",
  "editRow.variants": "变体词（逗号分隔）",
  "editRow.variantsPlaceholder": "如：香蕉,葡萄,橘子",
  "editRow.category": "分类",
  "editRow.categoryPlaceholder": "如：水果",
  "editRow.confirm": "确认",
  "editRow.cancel": "取消",
  "editRow.uncategorized": "未分类",
  "editRow.saved": "词库已保存！",

  // Messages
  "msg.insufficient": "词库不足！需要 {0} 组词，当前仅选中 {1} 组。请勾选更多类别。",
  "msg.importEmpty": "请粘贴 JSON 格式词库",
  "msg.importFormatError": "格式错误",
  "msg.importNoValid": "没有有效的词组",
  "msg.importSuccess": "成功导入 {0} 组词库！",
  "msg.importFailed": "导入失败：{0}",
  "msg.resetConfirm": "确定要重置为默认词库吗？所有编辑和导入的词库将丢失。",
  "msg.enterBase": "请输入基准词",
  "msg.enterVariants": "请输入至少一个变体词",
  "msg.deleteConfirm": "确定要删除词组「{0}」吗？",
  "msg.uncategorized": "未分类",

  // Print
  "print.playerTitle": "玩家卡片 — 打印版",
  "print.hostTitle": "主持人卡 — 打印版",
  "print.preview": "打印预览",
  "print.printBtn": "🖨️ 打印",
  "print.closeBtn": "✕ 关闭",
  "print.hostBadge": "卧底词红色",
  "print.spy": "🕵",

  // Host Card
  "host.cardTitle": "🎯 主持人卡",
  "host.cardBadge": "卧底词红色",
};

export default zhCN;