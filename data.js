const recommendations = [
    // 微阅读
    { category: '微阅读', content: '看《纳瓦尔宝典》10分钟', time: 'all',
      details: ['微信读书搜索《纳瓦尔宝典》', '从第三章开始看', '不用快进，慢慢读'] },
    { category: '微阅读', content: '读一篇《人物》杂志的特稿', time: 'all',
      details: ['微信搜索"人物杂志"', '选一篇感兴趣的标题', '认真读完'] },
    { category: '微阅读', content: '翻两页你收藏已久的书签文章', time: 'all',
      details: ['打开浏览器书签', '找到那篇一直想看的文章', '认真读两页'] },
    { category: '微阅读', content: '读一首博尔赫斯的短诗', time: 'all',
      details: ['微信读书搜索"博尔赫斯"', '找《我用什么才能留住你》', '慢慢读一遍'] },
    
    // 微思考
    { category: '微思考', content: '写下今天让你开心的一件小事', time: 'all',
      details: ['打开手机备忘录', '回想今天发生的事', '写下那件小事'] },
    { category: '微思考', content: '问自己："我现在感觉怎么样？"', time: 'all',
      details: ['闭上眼睛', '深呼吸三次', '诚实写下你的感受'] },
    { category: '微思考', content: '写下三个你感恩的东西', time: 'all',
      details: ['打开手机备忘录', '想想今天有谁帮助了你', '写下三件事'] },
    
    // 微身体
    { category: '微身体', content: '做10个深蹲', time: 'day',
      details: ['站起来', '双脚与肩同宽', '慢慢蹲下再站起，做10次'] },
    { category: '微身体', content: '站起来拉伸2分钟', time: 'day',
      details: ['站起来', '双手向上伸展', '左右各拉伸30秒'] },
    { category: '微身体', content: '去接杯水，慢慢喝完', time: 'day',
      details: ['站起来', '去接一杯温水', '站在窗边慢慢喝完'] },
    
    // 微学习
    { category: '微学习', content: '听一期播客的前15分钟', time: 'all',
      details: ['打开小宇宙APP', '搜索"纵横四海"', '听最新一期的前15分钟'] },
    { category: '微学习', content: '在B站看一个10分钟的知识视频', time: 'all',
      details: ['打开B站', '搜索"硬核的半佛仙人"', '看一个感兴趣的视频'] },
    { category: '微学习', content: '学一个英语单词的完整用法', time: 'all',
      details: ['打开欧路词典', '搜索今天遇到的生词', '看例句和用法'] },
    
    // 微联结
    { category: '微联结', content: '给朋友发一句温暖的话', time: 'social',
      details: ['打开微信', '找到一个好久没联系的朋友', '发"突然想到你，希望你今天开心"'] },
    { category: '微联结', content: '认真回复一条朋友的朋友圈', time: 'social',
      details: ['打开朋友圈', '找一条你想回复的动态', '认真写一条评论'] },
    
    // 微环境
    { category: '微环境', content: '整理你的书桌一角', time: 'all',
      details: ['看看你的书桌', '把不需要的东西收起来', '擦一下桌面'] },
    { category: '微环境', content: '给植物浇水', time: 'all',
      details: ['找到你的植物', '摸摸土壤是否干燥', '适量浇水'] },
    { category: '微环境', content: '把杯子洗了', time: 'all',
      details: ['拿起你用过的杯子', '用洗洁精洗干净', '放回原位'] },
    
    // 深夜微光
    { category: '深夜微光', content: '读一首诗', time: 'night',
      details: ['打开微信读书', '搜索"佩索阿"', '读一首《牧羊人》'] },
    { category: '深夜微光', content: '听一首纯音乐', time: 'night',
      details: ['打开网易云音乐', '搜索"River Flows in You"', '闭上眼睛听完'] },
    { category: '深夜微光', content: '看30秒夜空', time: 'night',
      details: ['走到窗边', '抬头看天空', '什么都不想，看30秒'] }
];

const feedbacks = [
    '你今天往上抬了一点点<br>这很棒',
    '做得好<br>哪怕只是一点点',
    '这一刻<br>你选择了自己',
    '很好<br>你正在变好',
    '就这么多<br>就够了'
];
