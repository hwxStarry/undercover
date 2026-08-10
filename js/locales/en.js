registerLocale('en', {
  "title": "Word Card Random Generator",
  "subtitle": "Spy Game · Party Game · One-Click · Print & Play",

  "common": {
    "cancel": "Cancel",
    "confirm": "Confirm",
    "uncategorized": "Uncategorized"
  },

  "settings": {
    "title": "Game Settings",
    "playerCount": "Player Count",
    "wordCount": "Words per Card",
    "cardStyle": "Card Style",
    "fontSize": "Font Size",
    "players": {
      "3": "3 Players",
      "4": "4 Players",
      "5": "5 Players",
      "6": "6 Players",
      "7": "7 Players",
      "8": "8 Players",
      "9": "9 Players",
      "10": "10 Players"
    },
    "words": {
      "30": "30 Words",
      "50": "50 Words",
      "100": "100 Words"
    },
    "styles": {
      "red": "Red Dashed",
      "simple": "Simple Black"
    },
    "fontSizes": {
      "small": "Small",
      "medium": "Medium",
      "large": "Large"
    }
  },

  "actions": {
    "generate": "🎲 Generate",
    "edit": "✏️ Edit Library",
    "import": "📥 Import Library",
    "reset": "🔄 Reset Library",
    "regenerate": "🔄 Regenerate",
    "printAll": "🖨️ Print All Player Cards",
    "printHost": "🖨️ Print Host Card"
  },

  "category": {
    "label1": "📂 Categories (",
    "label2": " selected, ",
    "label3": " word groups)",
    "selectAll": "☑ Select All",
    "selectNone": "☐ Deselect All",
    "invert": "🔄 Invert"
  },

  "stats": {
    "librarySize": "Library Size: ",
    "cardsGenerated": "Cards Generated: ",
    "cardsUnit": "",
    "diffWords": "Spy Words: ",
    "diffUnit": "/person"
  },

  "empty": {
    "line1": "Click ",
    "generateBtn": "🎲 Generate",
    "line1b": " above to create cards",
    "line2": "Supports 3-10 players, one card per player"
  },

  "footer": "Word Card Generator · 741 semantic word groups · Edit & Import",

  "import": {
    "title": "📥 Import Library",
    "hint": "Paste JSON format library. Each group contains <code>base</code> (base word), <code>variants</code> (variant word array), and <code>category</code> (category).<br>Example: <code>[{\"base\":\"apple\",\"variants\":[\"banana\",\"grape\",\"orange\"],\"category\":\"fruit\"},{\"base\":\"cola\",\"variants\":[\"sprite\",\"fanta\"],\"category\":\"drinks\"}]</code>",
    "placeholder": "[{\"base\":\"apple\",\"variants\":[\"banana\",\"grape\",\"orange\"],\"category\":\"fruit\"},{\"base\":\"cola\",\"variants\":[\"sprite\",\"fanta\"],\"category\":\"drinks\"}]",
    "confirm": "Confirm Import",
    "success": "Successfully imported {0} word groups!",
    "errorEmpty": "Please paste JSON format library",
    "errorFormat": "Format error",
    "errorNoValid": "No valid word groups",
    "errorFail": "Import failed: {0}"
  },

  "edit": {
    "title": "✏️ Edit Library",
    "searchPlaceholder": "Search base words or variants...",
    "addGroup": "+ Add Group",
    "count": "Total {0} groups",
    "showCount": "Showing {0} / {1} groups",
    "save": "💾 Save Library",
    "saveSuccess": "Library saved!",
    "deleteConfirm": "Delete group \"{0}\"?",
    "table": {
      "id": "#",
      "base": "Base Word",
      "variants": "Variants",
      "category": "Category",
      "actions": "Actions"
    }
  },

  "editRow": {
    "title": "Add Group",
    "editTitle": "Edit Group",
    "base": "Base Word",
    "variants": "Variants (comma separated)",
    "category": "Category",
    "basePlaceholder": "e.g.: apple",
    "variantsPlaceholder": "e.g.: banana,grape,orange",
    "categoryPlaceholder": "e.g.: fruit",
    "errorBase": "Please enter a base word",
    "errorVariants": "Please enter at least one variant"
  },

  "card": {
    "player": "Player {0}",
    "host": "🎯 Host Card",
    "title": "Card {0}",
    "hostPlayer": "Host Card - Player {0}",
    "diffHighlight": "Spy words highlighted",
    "spyWordRed": "Spy words in red"
  },

  "print": {
    "playerTitle": "Player Cards - Print",
    "hostTitle": "Host Card - Print",
    "playerPreviewTitle": "🎲 Player Cards - Print Preview",
    "hostPreviewTitle": "🎯 Host Card - Print Preview",
    "print": "🖨️ Print",
    "close": "✕ Close"
  },

  "error": {
    "insufficient": "Insufficient library! Need {0} groups, only {1} selected. Please check more categories."
  },

  "reset": {
    "confirm": "Reset to default library? All edits and imports will be lost."
  }
});