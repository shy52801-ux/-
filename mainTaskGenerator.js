/*
 * mainTaskGenerator.js
 * 主线今日任务生成器（独立模块）。
 * 未来订阅版将由 AI 规划替换本模块：
 *   只需保持 generateMainTask(mainline, index) 的输入输出契约不变。
 */
function getDayNumber(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor(d.getTime() / 86400000);
}

function generateMainTask(mainline, index) {
    var tpl = getMainlineTypeById(mainline.templateId || mainline.id);
    if (!tpl) return { content: '为' + mainline.title + '迈出今天的第一步', duration: '10分钟' };

    var subjects = (mainline.subjects && mainline.subjects.length > 0) ? mainline.subjects : [tpl.title];
    var dayNum = getDayNumber(new Date()) + (index || 0);
    var subject = subjects[dayNum % subjects.length];

    var pool = null;
    if (tpl.pools && tpl.pools[subject]) {
        pool = tpl.pools[subject][mainline.stage] || tpl.pools[subject][tpl.stages[0]];
    }
    if (!pool || pool.length === 0) {
        pool = [{ t: '为「' + subject + '」翻开今天的第一步', d: '10分钟' }];
    }

    var task = pool[dayNum % pool.length];
    return {
        content: task.t,
        duration: task.d,
        subject: subject
    };
}