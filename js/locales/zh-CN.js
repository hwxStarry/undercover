registerLocale('zh-CN', {
  "title": "词语卡片随机生成器",
  "subtitle": "谁是卧底 · 派对游戏 · 一键生成 · 即印即玩",

  "common": {
    "cancel": "取消",
    "confirm": "确认",
    "uncategorized": "未分类"
  },

  "settings": {
    "title": "游戏设置",
    "playerCount": "玩家数量",
    "wordCount": "每卡词数",
    "cardStyle": "卡片风格",
    "fontSize": "打印字号",
    "players": {
      "3": "3人",
      "4": "4人",
      "5": "5人",
      "6": "6人",
      "7": "7人",
      "8": "8人",
      "9": "9人",
      "10": "10人"
    },
    "words": {
      "30": "30词",
      "50": "50词",
      "100": "100词"
    },
    "style": {
      "red": "中国红虚线",
      "simple": "简约黑线"
    },
    "fontSize": {
      "small": "小号",
      "medium": "中号",
      "large": "大号"
    }
  },

  "actions": {
    "generate": "🎲 随机生成",
    "edit": "✏️ 编辑词库",
    "import": "📥 导入词库",
    "reset": "🔄 重置词库",
    "regenerate": "🔄 重新生成",
    "printAll": "🖨️ 打印全部玩家卡",
    "printHost": "🖨️ 打印主持人卡"
  },

  "category": {
    "label1": "📂 词库类别（已选 ",
    "label2": " 个，共 ",
    "label3": " 组词）",
    "selectAll": "☑ 全选",
    "selectNone": "☐ 全不选",
    "invert": "🔄 反选"
  },

  "stats": {
    "librarySize": "词库组数：",
    "cardsGenerated": "已生成卡片：",
    "cardsUnit": "张",
    "diffWords": "卧底差异词：",
    "diffUnit": "个/人"
  },

  "empty": {
    "line1": "点击上方 ",
    "generateBtn": "「🎲 随机生成」",
    "line1b": " 开始生成卡片",
    "line2": "支持 3~10 人，每人一张卡片"
  },

  "footer": "词语卡片随机生成器 · 内置 741 组语义词库 · 支持编辑/导入",

  "import": {
    "title": "📥 导入词库",
    "hint": "粘贴 JSON 格式词库，每组含 <code>base</code>（基准词）、<code>variants</code>（变体词数组）和 <code>category</code>（类别）。<br>示例：<code>[{\"base\":\"苹果\",\"variants\":[\"香蕉\",\"葡萄\",\"橘子\"],\"category\":\"水果\"},{\"base\":\"可乐\",\"variants\":[\"雪碧\",\"芬达\"],\"category\":\"饮品\"}]</code>",
    "placeholder": "[{\"base\":\"苹果\",\"variants\":[\"香蕉\",\"葡萄\",\"橘子\"],\"category\":\"水果\"},{\"base\":\"可乐\",\"variants\":[\"雪碧\",\"芬达\"],\"category\":\"饮品\"}]",
    "confirm": "确认导入",
    "success": "成功导入 {0} 组词库！",
    "errorEmpty": "请粘贴 JSON 格式词库",
    "errorFormat": "格式错误",
    "errorNoValid": "没有有效的词组",
    "errorFail": "导入失败：{0}"
  },

  "edit": {
    "title": "✏️ 编辑词库",
    "searchPlaceholder": "搜索基准词或变体词…",
    "addGroup": "+ 添加词组",
    "count": "共 {0} 组",
    "showCount": "显示 {0} / {1} 组",
    "save": "💾 保存词库",
    "saveSuccess": "词库已保存！",
    "deleteConfirm": "确定要删除词组「{0}」吗？",
    "table": {
      "id": "#",
      "base": "基准词",
      "variants": "变体词",
      "category": "分类",
      "actions": "操作"
    }
  },

  "editRow": {
    "title": "添加词组",
    "editTitle": "编辑词组",
    "base": "基准词",
    "variants": "变体词（逗号分隔）",
    "category": "分类",
    "basePlaceholder": "如：苹果",
    "variantsPlaceholder": "如：香蕉,葡萄,橘子",
    "categoryPlaceholder": "如：水果",
    "errorBase": "请输入基准词",
    "errorVariants": "请输入至少一个变体词"
  },

  "card": {
    "player": "玩家 {0}",
    "host": "🎯 主持人卡",
    "title": "卡片 {0}",
    "hostPlayer": "主持人卡 - 玩家 {0}",
    "diffHighlight": "差异词红色高亮",
    "spyWordRed": "卧底词红色"
  },

  "print": {
    "playerTitle": "玩家卡片 - 打印版",
    "hostTitle": "主持人卡 - 打印版",
    "playerPreviewTitle": "🎲 玩家卡片 — 打印预览",
    "hostPreviewTitle": "🎯 主持人卡 — 打印预览",
    "print": "🖨️ 打印",
    "close": "✕ 关闭"
  },

  "error": {
    "insufficient": "词库不足！需要 {0} 组词，当前仅选中 {1} 组。请勾选更多类别。"
  },

  "reset": {
    "confirm": "确定要重置为默认词库吗？所有编辑和导入的词库将丢失。"
  }
});