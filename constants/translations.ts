import { LanguageCode } from '@/contexts/LanguageContext';

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Home Screen
    welcome: "Welcome to",
    appName: "Dream Fairy!",
    continueStory: "Continue Story",
    startNewAdventure: "Start a New Adventure",
    startStory: "Start Story",
    noStories: "No saved stories yet",
    refresh: "Refresh",
    loading: "Loading...",
    
    // Story seeds
    "A magical forest adventure": "A magical forest adventure",
    "A lost robot in space": "A lost robot in space", 
    "The secret life of a city cat": "The secret life of a city cat",
    "A fairy's quest to save the moon": "A fairy's quest to save the moon",
    
    // Story Screen
    chooseYourPath: "Choose your path:",
    theEnd: "The End",
    playAgain: "Play Again",
    goHome: "Go Home",
    listenToStory: "Listen to Story",
    whatWillYouDoNext: "What will you do next?",
    or: "or",
    regenerateStory: "Regenerate Story",
    currentlyPlaying: "Currently Playing",
    playThisPart: "Play This Part",
    voicingOver: "Voicing over...",
    
    // Errors
    errorLoadingStories: "Error loading stories",
    errorGeneratingStory: "Error generating story",
    errorGeneratingImage: "Error generating image",
    
    // Stories Drawer
    continueYourAdventures: "Continue Your Adventures",
    noSavedStoriesYet: "No saved stories yet. Start a new adventure!",
    deleteStory: "Delete Story",
    deleteStoryConfirm: "Are you sure you want to delete \"{title}\"? This action cannot be undone.",
    deleteStoryError: "Failed to delete story. Please try again.",
    cancel: "Cancel",
    delete: "Delete",
    error: "Error",
  },
  
  tl: {
    // Home Screen
    welcome: "Maligayang pagdating sa",
    appName: "Dream Fairy!",
    continueStory: "Ipagpatuloy ang Kuwento",
    startNewAdventure: "Magsimula ng Bagong Adventure",
    startStory: "Simulan ang Kuwento",
    noStories: "Wala pang naka-save na kuwento",
    refresh: "I-refresh",
    loading: "Nag-lo-load...",
    
    // Story seeds
    "A magical forest adventure": "Isang mahiwagang adventure sa kagubatan",
    "A lost robot in space": "Isang nawawalang robot sa kalawakan",
    "The secret life of a city cat": "Ang lihim na buhay ng isang pusa sa lungsod",
    "A fairy's quest to save the moon": "Ang misyon ng diwata para iligtas ang buwan",
    
    // Story Screen
    chooseYourPath: "Piliin ang iyong daan:",
    theEnd: "Wakas",
    playAgain: "Maglaro Ulit",
    goHome: "Umuwi",
    listenToStory: "Pakinggan ang Kuwento",
    whatWillYouDoNext: "Ano ang gagawin mo?",
    or: "o",
    regenerateStory: "Gawing Muli ang Kuwento",
    currentlyPlaying: "Kasalukuyang Tumutugtog",
    playThisPart: "Tugtugin Ito",
    voicingOver: "Binobosesan...",
    
    // Errors
    errorLoadingStories: "May error sa pag-load ng mga kuwento",
    errorGeneratingStory: "May error sa paggawa ng kuwento",
    errorGeneratingImage: "May error sa paggawa ng larawan",
    
    // Stories Drawer
    continueYourAdventures: "Ipagpatuloy ang Iyong Adventures",
    noSavedStoriesYet: "Wala pang naka-save na kuwento. Magsimula ng bagong adventure!",
    deleteStory: "Burahin ang Kuwento",
    deleteStoryConfirm: "Sigurado ka bang gusto mong burahin ang \"{title}\"? Hindi na ito maibabalik.",
    deleteStoryError: "Hindi nabura ang kuwento. Subukan ulit.",
    cancel: "Kanselahin",
    delete: "Burahin",
    error: "Error",
  },
  
  zh: {
    // Home Screen
    welcome: "欢迎来到",
    appName: "梦想精灵！",
    continueStory: "继续故事",
    startNewAdventure: "开始新冒险",
    startStory: "开始故事",
    noStories: "还没有保存的故事",
    refresh: "刷新",
    loading: "加载中...",
    
    // Story seeds
    "A magical forest adventure": "一个神奇的森林冒险",
    "A lost robot in space": "太空中迷失的机器人",
    "The secret life of a city cat": "城市猫的秘密生活",
    "A fairy's quest to save the moon": "精灵拯救月亮的任务",
    
    // Story Screen
    chooseYourPath: "选择你的道路：",
    theEnd: "结束",
    playAgain: "再玩一次",
    goHome: "回家",
    listenToStory: "听故事",
    whatWillYouDoNext: "你接下来要做什么？",
    or: "或",
    regenerateStory: "重新生成故事",
    currentlyPlaying: "正在播放",
    playThisPart: "播放这一段",
    voicingOver: "配音中...",
    
    // Errors
    errorLoadingStories: "加载故事时出错",
    errorGeneratingStory: "生成故事时出错",
    errorGeneratingImage: "生成图片时出错",
    
    // Stories Drawer
    continueYourAdventures: "继续你的冒险",
    noSavedStoriesYet: "还没有保存的故事。开始新的冒险吧！",
    deleteStory: "删除故事",
    deleteStoryConfirm: "确定要删除 \"{title}\" 吗？此操作无法撤销。",
    deleteStoryError: "删除故事失败。请重试。",
    cancel: "取消",
    delete: "删除",
    error: "错误",
  },
  
  yue: {
    // Home Screen
    welcome: "歡迎嚟到",
    appName: "夢想精靈！",
    continueStory: "繼續故仔",
    startNewAdventure: "開始新冒險",
    startStory: "開始故仔",
    noStories: "仲未有保存嘅故仔",
    refresh: "刷新",
    loading: "載入緊...",
    
    // Story seeds
    "A magical forest adventure": "一個神奇嘅森林冒險",
    "A lost robot in space": "太空入面迷失嘅機械人",
    "The secret life of a city cat": "城市貓嘅秘密生活",
    "A fairy's quest to save the moon": "精靈拯救月亮嘅任務",
    
    // Story Screen
    chooseYourPath: "揀你嘅路：",
    theEnd: "完",
    playAgain: "再玩一次",
    goHome: "返屋企",
    listenToStory: "聽故仔",
    whatWillYouDoNext: "你接住要做乜嘢？",
    or: "定或",
    regenerateStory: "重新生成故仔",
    currentlyPlaying: "播緊",
    playThisPart: "播呢一節",
    voicingOver: "配緊音...",
    
    // Errors
    errorLoadingStories: "載入故仔時出錯",
    errorGeneratingStory: "生成故仔時出錯", 
    errorGeneratingImage: "生成圖片時出錯",
    
    // Stories Drawer
    continueYourAdventures: "繼續你嘅冒險",
    noSavedStoriesYet: "仲未有保存嘅故仔。開始新嘅冒險啦！",
    deleteStory: "刪除故仔",
    deleteStoryConfirm: "確定要刪除 \"{title}\" 呀？呢個操作冇得返轉頭。",
    deleteStoryError: "刪除故仔失敗。請再試。",
    cancel: "取消",
    delete: "刪除",
    error: "錯誤",
  },
};

// Helper hook to use translations
export function useTranslation() {
  const { language } = require('@/contexts/LanguageContext').useLanguage();
  
  const t = (key: string, params?: Record<string, string>): string => {
    let text = translations[language][key] || translations.en[key] || key;
    
    // Replace parameters in the text
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, value);
      });
    }
    
    return text;
  };
  
  return { t };
}