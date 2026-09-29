// 使用游戏昵称生成器常见的“描述词 + 对象词”组合方式；词表为本站维护。
(() => {
  const dictionaries = {
    'zh-CN': {
      first: ['薄荷', '半糖', '晚风', '星际', '云端', '像素', '月亮', '奶油', '橘子', '冒险', '迷路的', '会飞的', '打盹的', '好奇的', '快乐的', '勇敢的', '发光的', '摇摆的', '冲浪的', '隐身的', '偷笑的', '熬夜的', '路过的', '闪闪的'],
      second: ['企鹅', '水母', '海豹', '小熊', '狐狸', '河豚', '刺猬', '猫头鹰', '小鲨鱼', '萤火虫', '小行星', '蒲公英', '棉花糖', '橘子汽水', '小蘑菇', '小恐龙', '小浣熊', '小鲸鱼', '向日葵', '热气球', '小松鼠', '小章鱼', '小雪人', '小机器人']
    },
    en: {
      first: ['Misty', 'Sunny', 'Pixel', 'Sleepy', 'Cosmic', 'Lucky', 'Tiny', 'Curious', 'Witty', 'Breezy', 'Glowing', 'Mellow', 'Swift', 'Dreamy', 'Jolly', 'Brave', 'Cloudy', 'Nimble', 'Twilight', 'Sparkly'],
      second: ['Otter', 'Penguin', 'Fox', 'Panda', 'Koala', 'Comet', 'Dolphin', 'Hedgehog', 'Mochi', 'Mushroom', 'Sparrow', 'Octopus', 'Whale', 'Raccoon', 'Meteor', 'Sunflower', 'Turtle', 'Seahorse', 'Firefly', 'Robot']
    }
  };

  function pick(items) {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      crypto.getRandomValues(value);
      return items[value[0] % items.length];
    }
    return items[Math.floor(Math.random() * items.length)];
  }

  window.generateGameNickname = (language = document.documentElement.lang, except = '') => {
    const words = dictionaries[language] || dictionaries['zh-CN'];
    let name = '';
    for (let attempt = 0; attempt < 8; attempt++) {
      name = `${pick(words.first)}${pick(words.second)}`;
      if (name !== except) break;
    }
    return name;
  };
})();
