function buildStudyPool(subject, kind) {
    if (kind === 'language') {
        return {
            '刚开始': [
                { t: '打开' + subject + '资料，只读第一页，10分钟', d: '10分钟' },
                { t: '背5个' + subject + '里最眼生的词，抄一遍就行', d: '8分钟' },
                { t: '听一段1分钟' + subject + '材料，听出3个熟悉的词', d: '10分钟' }
            ],
            '基础阶段': [
                { t: '背15个' + subject + '新词，只处理今天这一组', d: '15分钟' },
                { t: '读一篇200词' + subject + '短文，画出5个没看懂的词', d: '15分钟' },
                { t: subject + '听力：完整听一遍2分钟材料，记下大意', d: '12分钟' }
            ],
            '强化阶段': [
                { t: subject + '真题：挑2道题，做完立刻对答案', d: '25分钟' },
                { t: '整理5条' + subject + '错因，各写一个词', d: '15分钟' },
                { t: '精听' + subject + '材料2分钟，跟读一遍', d: '20分钟' }
            ],
            '冲刺阶段': [
                { t: subject + '模拟：限时20分钟做一组题', d: '20分钟' },
                { t: '复盘上次' + subject + '模拟的3个丢分点', d: '15分钟' },
                { t: '作文/口语：只起草开头，5分钟', d: '5分钟' }
            ]
        };
    }
    if (kind === 'calc') {
        return {
            '刚开始': [
                { t: '打开' + subject + '教材，读一个小节，10分钟内停', d: '10分钟' },
                { t: '挑3道' + subject + '基础题试试手感，做错也没关系', d: '12分钟' },
                { t: '把' + subject + '今天的核心公式抄一遍，不求记住', d: '8分钟' }
            ],
            '基础阶段': [
                { t: '做3道' + subject + '当天讲解的习题，做完就对答案', d: '15分钟' },
                { t: '整理1道' + subject + '错题，把步骤写清楚', d: '15分钟' },
                { t: '默写' + subject + '本节一个核心公式，写不出的再抄一遍', d: '10分钟' }
            ],
            '强化阶段': [
                { t: '限时25分钟，做一组' + subject + '综合题', d: '25分钟' },
                { t: '给' + subject + '错题写2条原因，下次怎么避免', d: '12分钟' },
                { t: '合上书，复述一遍' + subject + '本节思路', d: '10分钟' }
            ],
            '冲刺阶段': [
                { t: subject + '真题选填限时15分钟，只求完成', d: '15分钟' },
                { t: '把最怕的' + subject + '题型再做1道', d: '20分钟' },
                { t: '总结' + subject + '3个易错点，写给明天的自己看', d: '10分钟' }
            ]
        };
    }
    return {
        '刚开始': [
            { t: '打开' + subject + '材料，读一个小节，10分钟内停', d: '10分钟' },
            { t: '抄写' + subject + '今天的一个知识点，抄完就算赢', d: '8分钟' },
            { t: '把' + subject + '目录看一遍，圈出最陌生的1个', d: '5分钟' }
        ],
        '基础阶段': [
            { t: '整理' + subject + '一个小节的要点，写3行', d: '12分钟' },
            { t: '做2道' + subject + '基础练习，做完立马对答案', d: '15分钟' },
            { t: '给自己讲一遍' + subject + '今天的知识点', d: '10分钟' }
        ],
        '强化阶段': [
            { t: '刷一组' + subject + '专项题，限时25分钟', d: '25分钟' },
            { t: '把' + subject + '错题按原因分2类', d: '12分钟' },
            { t: '合上书复述' + subject + '本节框架', d: '10分钟' }
        ],
        '冲刺阶段': [
            { t: subject + '模拟一组题，限时20分钟', d: '20分钟' },
            { t: '复盘' + subject + '最近一次练习的丢分点', d: '12分钟' },
            { t: '整理' + subject + '3个高频考点，各写一句', d: '10分钟' }
        ]
    };
}

function buildTechPool(subject) {
    return {
        '刚开始': [
            { t: '打开编辑器，写一行能运行的' + subject + '代码', d: '10分钟' },
            { t: '照教程做' + subject + '第一个小例子，跟着敲就行', d: '12分钟' },
            { t: '把今天遇到的1个' + subject + '报错抄下来，明天查', d: '5分钟' }
        ],
        '基础阶段': [
            { t: '完成一个20行以内的' + subject + '小功能', d: '15分钟' },
            { t: '读' + subject + '官方文档的一个小节', d: '12分钟' },
            { t: '本地跑通一个' + subject + '示例代码', d: '15分钟' }
        ],
        '强化阶段': [
            { t: '实现一个' + subject + '小功能并跑通，30分钟内', d: '30分钟' },
            { t: '给一段' + subject + '代码加3行注释，写清楚逻辑', d: '10分钟' },
            { t: '拆解一个' + subject + '开源小函数的实现', d: '20分钟' }
        ],
        '冲刺阶段': [
            { t: subject + '实战：做一个完整的迷你项目，今天只做第一步', d: '30分钟' },
            { t: '提交本周的' + subject + '代码，写清提交说明', d: '10分钟' },
            { t: '把' + subject + '一个技术点讲给自己听', d: '10分钟' }
        ]
    };
}

function buildDesignPool(subject) {
    return {
        '刚开始': [
            { t: '收集3张让你心动的' + subject + '作品', d: '8分钟' },
            { t: '临摹一个' + subject + '局部，5分钟就停', d: '5分钟' },
            { t: '在纸上画3条' + subject + '配色小练习', d: '8分钟' }
        ],
        '基础阶段': [
            { t: '临摹一张' + subject + '案例的基本布局', d: '15分钟' },
            { t: '给昨天收集的' + subject + '图写1句为什么好看', d: '5分钟' },
            { t: '用' + subject + '工具排一个2个元素的小版式', d: '15分钟' }
        ],
        '强化阶段': [
            { t: '重做一张' + subject + '参考案例，不需要完美', d: '25分钟' },
            { t: '为一个页面画2种' + subject + '方案草图', d: '15分钟' },
            { t: '把' + subject + '临摹还原到80%', d: '25分钟' }
        ],
        '冲刺阶段': [
            { t: '完成一个完整的' + subject + '作品并导出', d: '35分钟' },
            { t: '给' + subject + '作品写100字设计说明', d: '10分钟' },
            { t: '从' + subject + '作品里挑出1件代表作', d: '8分钟' }
        ]
    };
}

function buildCreativePool(subject) {
    return {
        '刚开始': [
            { t: '写下100字，不限主题，不修改，写完就停', d: '8分钟' },
            { t: '记录今天一个想写的' + subject + '瞬间', d: '5分钟' },
            { t: '抄写一段打动你的' + subject + '文字或片段', d: '8分钟' }
        ],
        '基础阶段': [
            { t: '写200字完整的' + subject + '段落', d: '15分钟' },
            { t: '列出3个想做的' + subject + '选题', d: '5分钟' },
            { t: '昨天写的内容扩写到300字', d: '15分钟' }
        ],
        '强化阶段': [
            { t: '写500字' + subject + '内容，只允许改一次开头', d: '25分钟' },
            { t: '为一个' + subject + '主题写3个开头尝试', d: '15分钟' },
            { t: '完成一篇' + subject + '作品，不追求完美', d: '30分钟' }
        ],
        '冲刺阶段': [
            { t: '完成一篇' + subject + '作品并发布或存档', d: '35分钟' },
            { t: '给旧' + subject + '稿做一次结构整理', d: '15分钟' },
            { t: '把最满意的' + subject + '一段读给别人听', d: '8分钟' }
        ]
    };
}

function buildBodyPool(subject) {
    return {
        '刚开始': [
            { t: '出门走10分钟，只求完成', d: '10分钟' },
            { t: '做一套5分钟的全身' + subject + '拉伸', d: '5分钟' },
            { t: '跟视频做3个最简单的' + subject + '动作', d: '8分钟' }
        ],
        '习惯阶段': [
            { t: '完成一组15分钟' + subject + '训练', d: '15分钟' },
            { t: '今天走够5000步', d: '全天' },
            { t: '睡前做8分钟' + subject + '拉伸', d: '8分钟' }
        ],
        '坚持阶段': [
            { t: '完成一次完整的' + subject + '训练，20分钟', d: '20分钟' },
            { t: '加一组你最想放弃的' + subject + '动作', d: '10分钟' },
            { t: '记录今天的' + subject + '训练时长', d: '3分钟' }
        ]
    };
}

var MAINLINE_TYPES = [
    {
        id: 'kaoyan',
        type: 'exam',
        group: '学习考试',
        title: '考研',
        goal: '研究生考试',
        askSubject: '你准备学习哪些科目？',
        subjects: ['英语', '数学', '政治', '专业课'],
        stages: ['刚开始', '基础阶段', '强化阶段', '冲刺阶段'],
        pools: {
            '英语': buildStudyPool('英语', 'language'),
            '数学': buildStudyPool('数学', 'calc'),
            '政治': buildStudyPool('政治', 'memory'),
            '专业课': buildStudyPool('专业课', 'memory')
        }
    },
    {
        id: 'gaokao',
        type: 'exam',
        group: '学习考试',
        title: '高考',
        goal: '高考',
        askSubject: '你准备主攻哪些科目？',
        subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'],
        stages: ['刚开始', '基础阶段', '强化阶段', '冲刺阶段'],
        pools: {
            '语文': buildStudyPool('语文', 'memory'),
            '数学': buildStudyPool('数学', 'calc'),
            '英语': buildStudyPool('英语', 'language'),
            '物理': buildStudyPool('物理', 'calc'),
            '化学': buildStudyPool('化学', 'calc'),
            '生物': buildStudyPool('生物', 'memory'),
            '历史': buildStudyPool('历史', 'memory'),
            '地理': buildStudyPool('地理', 'memory'),
            '政治': buildStudyPool('政治', 'memory')
        }
    },
    {
        id: 'englishexam',
        type: 'exam',
        group: '学习考试',
        title: '英语考试',
        goal: '英语考试',
        askSubject: '你准备考哪个？',
        subjects: ['四级', '六级', '雅思', '托福'],
        stages: ['刚开始', '基础阶段', '强化阶段', '冲刺阶段'],
        pools: {
            '四级': buildStudyPool('四级', 'language'),
            '六级': buildStudyPool('六级', 'language'),
            '雅思': buildStudyPool('雅思', 'language'),
            '托福': buildStudyPool('托福', 'language')
        }
    },
    {
        id: 'programming',
        type: 'skill',
        group: '技能成长',
        title: '编程',
        goal: '编程能力',
        askSubject: '你想主攻哪个方向？',
        subjects: ['Web前端', '后端', '算法', '移动开发'],
        stages: ['刚开始', '基础阶段', '强化阶段', '冲刺阶段'],
        pools: {
            'Web前端': buildTechPool('Web前端'),
            '后端': buildTechPool('后端'),
            '算法': buildTechPool('算法'),
            '移动开发': buildTechPool('移动开发')
        }
    },
    {
        id: 'design',
        type: 'skill',
        group: '技能成长',
        title: '设计',
        goal: '设计能力',
        askSubject: '你想主攻哪个方向？',
        subjects: ['平面设计', 'UI设计', '插画'],
        stages: ['刚开始', '基础阶段', '强化阶段', '冲刺阶段'],
        pools: {
            '平面设计': buildDesignPool('平面设计'),
            'UI设计': buildDesignPool('UI设计'),
            '插画': buildDesignPool('插画')
        }
    },
    {
        id: 'creativity',
        type: 'skill',
        group: '技能成长',
        title: '创作',
        goal: '持续创作',
        askSubject: '你想主攻哪种创作？',
        subjects: ['写作', '视频', '音乐'],
        stages: ['刚开始', '基础阶段', '强化阶段', '冲刺阶段'],
        pools: {
            '写作': buildCreativePool('写作'),
            '视频': buildCreativePool('视频'),
            '音乐': buildCreativePool('音乐')
        }
    },
    {
        id: 'fitness',
        type: 'body',
        group: '身体',
        title: '健身',
        goal: '身体状态',
        askSubject: '你最想改善什么？',
        subjects: ['减脂', '增肌', '体能'],
        stages: ['刚开始', '习惯阶段', '坚持阶段'],
        pools: {
            '减脂': buildBodyPool('减脂'),
            '增肌': buildBodyPool('增肌'),
            '体能': buildBodyPool('体能')
        }
    }
];

function getMainlineTypeById(id) {
    for (var i = 0; i < MAINLINE_TYPES.length; i++) {
        if (MAINLINE_TYPES[i].id === id) return MAINLINE_TYPES[i];
    }
    return null;
}