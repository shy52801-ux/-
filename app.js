var lastCategory = '';
var HISTORY_KEY = 'wy_history';
var HISTORY_DAYS = 30;
var JOURNAL_KEY = 'wy_journal';
var QUESTS_KEY = 'wy_quests';
var MAINLINES_KEY = 'wy_mainlines';
var QUESTS_DONE_KEY = 'wy_quests_done';
var SETTINGS_KEY = 'wy_settings';
var NUDGE_KEY = 'wy_nudge';
var MAX_MAINLINES = 5;

var currentWeekStart = getWeekStart(new Date());
var selectedDateKey = formatDateKey(new Date());
var currentView = 'home';

function getTimeCategory() {
    var hour = new Date().getHours();
    if (hour >= 22 || hour < 6) return 'night';
    if (hour >= 9 && hour < 22) return 'social';
    return 'day';
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getHistory() {
    try {
        var raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        var arr = JSON.parse(raw);
        var now = Date.now();
        var cutoff = now - HISTORY_DAYS * 24 * 60 * 60 * 1000;
        return arr.filter(function(entry) { return entry.ts > cutoff; });
    } catch (e) {
        return [];
    }
}

function addToHistory(rec, type) {
    var entry = {
        id: 'wy-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        content: rec.content,
        category: rec.category || '',
        ts: Date.now(),
        completedAt: Date.now()
    };
    if (type) entry.type = type;
    var history = getHistory();
    history.push(entry);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) {}
    return entry;
}

function getJournals() {
    try {
        var raw = localStorage.getItem(JOURNAL_KEY);
        if (!raw) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function getJournalForDate(dateKey) {
    var journals = getJournals();
    var list = [];
    for (var i = 0; i < journals.length; i++) {
        if (journals[i].date === dateKey) list.push(journals[i]);
    }
    list.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
    return list;
}

function addJournal(dateKey, content) {
    var journals = getJournals();
    journals.push({
        id: 'jl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        date: dateKey,
        content: content,
        createdAt: Date.now()
    });
    try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(journals)); } catch (e) {}
}

function formatClock(ts) {
    var d = new Date(ts);
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

function getRecordSource(entry) {
    if (entry.mainlineId) {
        var ml = findMainline(entry.mainlineId);
        if (ml) return '来自：' + ml.title + '主线';
        if (entry.mainlineTitle) return '来自：' + entry.mainlineTitle + '主线';
        return '来自：主线';
    }
    if (entry.type === 'side') return '来自：支线';
    if (entry.category && entry.category.indexOf('主线·') === 0) return '来自：主线';
    return '来自：支线';
}

function getDayTimeline(dateKey) {
    var list = [];
    var records = getRecordsForDate(dateKey);
    for (var i = 0; i < records.length; i++) {
        list.push({
            kind: 'task',
            time: records[i].completedAt || records[i].ts || 0,
            entry: records[i]
        });
    }
    var journals = getJournalForDate(dateKey);
    for (var j = 0; j < journals.length; j++) {
        list.push({
            kind: 'journal',
            time: journals[j].createdAt || 0,
            entry: journals[j]
        });
    }
    list.sort(function(a, b) { return a.time - b.time; });
    return list;
}

function getMainlines() {
    try {
        var raw = localStorage.getItem(MAINLINES_KEY);
        if (!raw) return [];
        var list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

function saveMainlines(list) {
    try { localStorage.setItem(MAINLINES_KEY, JSON.stringify(list)); } catch (e) {}
}

function migrateOldQuests() {
    if (getMainlines().length > 0) return;
    var raw = null;
    try { raw = localStorage.getItem(QUESTS_KEY); } catch (e) {}
    if (!raw) return;
    var ids = [];
    try { ids = JSON.parse(raw); } catch (e) {}
    if (!Array.isArray(ids) || ids.length === 0) return;
    var list = [];
    for (var i = 0; i < ids.length; i++) {
        var tpl = getMainlineTypeById(ids[i]);
        if (!tpl) continue;
        var firstSubject = (tpl.subjects && tpl.subjects.length > 0) ? tpl.subjects[0] : tpl.title;
        list.push({
            id: 'ml-legacy-' + ids[i],
            templateId: tpl.id,
            type: tpl.type,
            title: tpl.title,
            goal: tpl.goal || tpl.title,
            subjects: [firstSubject],
            stage: tpl.stages && tpl.stages.length > 1 ? tpl.stages[1] : (tpl.stages[0] || '刚开始'),
            deadline: '半年内',
            createdAt: Date.now(),
            todayKey: '',
            todayTask: null
        });
    }
    if (list.length > 0) {
        saveMainlines(list);
        try { localStorage.removeItem(QUESTS_KEY); } catch (e) {}
    }
}

function findMainline(mainlineId) {
    var list = getMainlines();
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === mainlineId || list[i].templateId === mainlineId) return list[i];
    }
    return null;
}

function getTodayTask(mainline, index) {
    var todayKey = formatDateKey(new Date());
    if (mainline.todayKey === todayKey && mainline.todayTask) {
        return mainline.todayTask;
    }
    var task = generateMainTask(mainline, index || 0);
    mainline.todayKey = todayKey;
    mainline.todayTask = {
        content: task.content,
        duration: task.duration
    };
    var list = getMainlines();
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === mainline.id) {
            list[i].todayKey = todayKey;
            list[i].todayTask = mainline.todayTask;
            break;
        }
    }
    saveMainlines(list);
    return mainline.todayTask;
}

function removeHistoryById(id) {
    var history = getHistory();
    var filtered = history.filter(function(entry) {
        return entry.id !== id;
    });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered)); } catch (e) {}
}

function getHistorySet() {
    var history = getHistory();
    var set = {};
    for (var i = 0; i < history.length; i++) {
        set[history[i].content] = true;
    }
    return set;
}

function getRecommendation() {
    var timeCat = getTimeCategory();
    var historySet = getHistorySet();

    var eligible = recommendations.filter(function(r) {
        return r.time === 'all' || r.time === timeCat;
    });

    var notSeen = eligible.filter(function(r) {
        return !historySet[r.content];
    });

    if (notSeen.length === 0) {
        try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
        notSeen = eligible;
    }

    if (lastCategory && notSeen.length > 1) {
        var diffCategory = notSeen.filter(function(r) {
            return r.category !== lastCategory;
        });
        if (diffCategory.length > 0) {
            notSeen = diffCategory;
        }
    }

    var item = getRandomItem(notSeen);
    lastCategory = item.category;
    return item;
}

function showCard() {
    var rec = getRecommendation();
    window._currentRec = rec;
    window._lastCompletedEntry = null;
    document.getElementById('card-category').textContent = rec.category;
    document.getElementById('card-content').textContent = rec.content;
    document.getElementById('card-details').style.display = 'none';
    hideDetails();
    
    var detailBtn = document.getElementById('detail-btn');
    var refreshBtn = document.getElementById('refresh-btn');
    var doneBtn = document.getElementById('done-btn');
    var skipBtn = document.getElementById('skip-btn');
    var confirmBtn = document.getElementById('confirm-done-btn');
    
    detailBtn.style.display = rec.details ? 'block' : 'none';
    refreshBtn.style.display = 'block';
    doneBtn.style.display = 'block';
    skipBtn.style.display = 'none';
    confirmBtn.style.display = 'none';
    
    detailBtn.onclick = rec.details ? function() { showDetails(rec.details); } : null;
    refreshBtn.onclick = function() { hideCard(); setTimeout(showCard, 300); };
    doneBtn.onclick = function() { showConfirmCard(rec); };
    
    document.getElementById('card-container').classList.add('show');
}

function showConfirmCard(rec) {
    document.getElementById('card-category').textContent = rec.category;
    document.getElementById('card-content').textContent = rec.content;
    renderInlineDetails(rec.details);
    var confirmBtn = document.getElementById('confirm-done-btn');
    confirmBtn.disabled = false;
    
    document.getElementById('detail-btn').style.display = 'none';
    document.getElementById('refresh-btn').style.display = 'none';
    document.getElementById('done-btn').style.display = 'none';
    document.getElementById('skip-btn').style.display = 'block';
    document.getElementById('confirm-done-btn').style.display = 'block';
    
    document.getElementById('skip-btn').onclick = function() {
        hideCard();
        setTimeout(showCard, 300);
    };
    document.getElementById('confirm-done-btn').onclick = function() {
        if (confirmBtn.disabled) return;
        confirmBtn.disabled = true;
        window._lastCompletedEntry = addToHistory(rec, 'side');
        hideCard();
        setTimeout(function() { showFinalFeedback(); }, 400);
    };
}

function undoLastCompletion() {
    var entry = window._lastCompletedEntry;
    if (!entry || !entry.id) return;
    var undoBtn = document.getElementById('undo-btn');
    if (undoBtn.disabled) return;
    undoBtn.disabled = true;
    removeHistoryById(entry.id);
    if (entry.category && entry.category.indexOf('主线·') === 0) {
        undoQuestDoneByEntry(entry);
    }
    window._lastCompletedEntry = null;
    clearTimeout(window._feedbackTimer);
    document.getElementById('complete-feedback').classList.remove('show');
    undoBtn.style.display = 'none';
    renderQuests();
    showUndoToast();
}

function undoQuestDoneByEntry(entry) {
    var mainlineId = null;
    if (entry.mainlineId) {
        mainlineId = entry.mainlineId;
    } else if (entry.mainlineTitle && entry.content) {
        var prefix = entry.mainlineTitle + '：';
        if (entry.content.indexOf(prefix) === 0) {
            var ml = null;
            var list = getMainlines();
            for (var i = 0; i < list.length; i++) {
                if (entry.mainlineTitle === list[i].title) { ml = list[i]; break; }
            }
            if (ml) mainlineId = ml.id;
        }
    }
    if (!mainlineId) return;
    var todayKey = formatDateKey(new Date());
    try {
        var done = JSON.parse(localStorage.getItem(QUESTS_DONE_KEY) || '{}') || {};
        var list = done[todayKey] || [];
        var idx = list.indexOf(mainlineId);
        if (idx >= 0) list.splice(idx, 1);
        done[todayKey] = list;
        localStorage.setItem(QUESTS_DONE_KEY, JSON.stringify(done));
    } catch (e) {}
}

function showUndoToast(text) {
    var toast = document.getElementById('undo-toast');
    if (!toast) return;
    toast.textContent = text || '已撤销';
    toast.classList.add('show');
    clearTimeout(window._undoToastTimer);
    window._undoToastTimer = setTimeout(function() {
        toast.classList.remove('show');
    }, 1200);
}

function renderInlineDetails(details) {
    var box = document.getElementById('card-details');
    var list = document.getElementById('card-details-list');
    if (!details || details.length === 0) {
        box.style.display = 'none';
        return;
    }
    list.innerHTML = details.map(function(d) { return '<li>' + d + '</li>'; }).join('');
    box.style.display = 'block';
}

function showFinalFeedback() {
    var feedback = document.getElementById('complete-feedback');
    var undoBtn = document.getElementById('undo-btn');
    document.getElementById('feedback-text').innerHTML = '这一刻<br>你选择了自己。';
    if (window._lastCompletedEntry) {
        undoBtn.style.display = 'block';
        undoBtn.disabled = false;
        undoBtn.onclick = undoLastCompletion;
    } else {
        undoBtn.style.display = 'none';
    }
    feedback.classList.add('show');
    clearTimeout(window._feedbackTimer);
    window._feedbackTimer = setTimeout(function() {
        feedback.classList.remove('show');
        undoBtn.style.display = 'none';
    }, 2500);
}

function hideCard() {
    document.getElementById('card-container').classList.remove('show');
    document.getElementById('detail-panel').classList.remove('show');
}

function showDetails(details) {
    var list = document.getElementById('detail-list');
    list.innerHTML = details.map(function(d) { return '<li>' + d + '</li>'; }).join('');
    document.getElementById('detail-panel').classList.add('show');
}

function hideDetails() {
    document.getElementById('detail-panel').classList.remove('show');
}

var WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function formatDateKey(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return date.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
}

function getWeekStart(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var dow = d.getDay();
    var diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    return d;
}

function getWeekRangeText() {
    var start = currentWeekStart;
    var end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return (start.getMonth() + 1) + '月' + start.getDate() + '日 — ' + (end.getMonth() + 1) + '月' + end.getDate() + '日';
}

function getRecordsForDate(dateKey) {
    var history = getHistory();
    var list = [];
    for (var i = 0; i < history.length; i++) {
        if (formatDateKey(new Date(history[i].ts)) === dateKey) {
            history[i].category = history[i].category || '';
            list.push(history[i]);
        }
    }
    list.sort(function(a, b) { return a.ts - b.ts; });
    return list;
}

function renderWeek() {
    var todayKey = formatDateKey(new Date());
    var grid = document.getElementById('week-grid');
    grid.innerHTML = '';

    var date = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate());
    for (var i = 0; i < 7; i++) {
        var dayKey = formatDateKey(date);
        var dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        if (dayKey === selectedDateKey) dayCell.className += ' selected';

        var label = document.createElement('div');
        label.className = 'day-label';
        label.textContent = WEEK_LABELS[date.getDay()];

        var num = document.createElement('div');
        num.className = 'day-num';
        num.textContent = date.getDate();
        if (dayKey === todayKey) num.className += ' today';

        var dot = document.createElement('div');
        dot.className = 'day-dot';
        dot.style.display = getRecordsForDate(dayKey).length > 0 ? 'block' : 'none';

        dayCell.appendChild(label);
        dayCell.appendChild(num);
        dayCell.appendChild(dot);
        dayCell.dataset.date = dayKey;
        dayCell.addEventListener('click', function() {
            showDayRecords(this.dataset.date);
        });
        grid.appendChild(dayCell);

        date.setDate(date.getDate() + 1);
    }

    document.getElementById('week-range').textContent = getWeekRangeText();
}

function applyView(view) {
    currentView = view;
    var showMap = {
        'home': 'main',
        'history': 'history-page',
        'history-day': 'history-day-page',
        'quests': 'quests-page',
        'create': 'quest-create-page',
        'settings': 'settings-page'
    };
    for (var key in showMap) {
        var el = document.getElementById(showMap[key]);
        if (!el) continue;
        var ref = key;
        if (key === 'home') el.classList.toggle('show', currentView === 'home');
        else el.classList.toggle('show', currentView === ref);
    }
}

function navigateTo(view) {
    applyView(view);
    try { history.pushState({ view: view }, ''); } catch (e) {}
}

function showDayRecords(dateKey) {
    selectedDateKey = dateKey;
    renderDayRecords();
    navigateTo('history-day');
}

function renderDayRecords() {
    var timeline = getDayTimeline(selectedDateKey);
    var container = document.getElementById('day-records');

    var todayKey = formatDateKey(new Date());
    var monthDay = Number(selectedDateKey.split('-')[1]) + '月' + Number(selectedDateKey.split('-')[2]) + '日';
    var taskCount = timeline.filter(function(t) { return t.kind === 'task'; }).length;
    if (selectedDateKey === todayKey) {
        document.getElementById('day-summary').textContent = '今天 · 完成了 ' + taskCount + ' 件小事';
    } else {
        document.getElementById('day-summary').textContent = monthDay + ' · 完成了 ' + taskCount + ' 件小事';
    }
    document.getElementById('day-date').textContent = monthDay;

    if (timeline.length === 0) {
        container.innerHTML = '<div class="empty-hint">这一天，还没有留下记录。</div>';
    } else {
        var html = '';
        for (var i = 0; i < timeline.length; i++) {
            var node = timeline[i];
            var timeText = formatClock(node.time);
            if (node.kind === 'journal') {
                html += '<div class="tl-item tl-journal">' +
                    '<div class="tl-time">' + timeText + '</div>' +
                    '<div class="tl-node tl-node-journal">✎</div>' +
                    '<div class="tl-body">' +
                    '<div class="tl-content">' + node.entry.content + '</div>' +
                    '<div class="tl-source">今日记录</div>' +
                    '</div></div>';
            } else {
                var e = node.entry;
                var undoLink = e.id
                    ? '<button class="rec-undo" data-id="' + e.id + '">撤销</button>'
                    : '';
                html += '<div class="tl-item">' +
                    '<div class="tl-time">' + timeText + '</div>' +
                    '<div class="tl-node"></div>' +
                    '<div class="tl-body">' +
                    '<div class="tl-content">' + e.content + '</div>' +
                    '<div class="tl-meta"><span class="tl-source">' + getRecordSource(e) + '</span>' + undoLink + '</div>' +
                    '</div></div>';
            }
        }
        container.innerHTML = html;
    }

    var undoBtns = container.querySelectorAll('.rec-undo');
    for (var j = 0; j < undoBtns.length; j++) {
        undoBtns[j].addEventListener('click', function() {
            undoRecord(this.getAttribute('data-id'), this);
        });
    }

    document.getElementById('journal-toggle').style.display = selectedDateKey === todayKey ? 'block' : 'none';
    var editor = document.getElementById('journal-editor');
    if (selectedDateKey !== todayKey) editor.style.display = 'none';
}

function undoRecord(id, btn) {
    if (!id || btn.disabled) return;
    btn.disabled = true;
    var target = null;
    var history = getHistory();
    for (var i = 0; i < history.length; i++) {
        if (history[i].id === id) { target = history[i]; break; }
    }
    window._lastCompletedEntry = null;
    removeHistoryById(id);
    if (target && target.category && target.category.indexOf('主线·') === 0) {
        undoQuestDoneByEntry(target);
    }
    renderDayRecords();
    renderWeek();
    renderQuests();
    showUndoToast();
}

function showHistory() {
    currentWeekStart = getWeekStart(new Date());
    selectedDateKey = formatDateKey(new Date());
    renderWeek();
    navigateTo('history');
}

function hideHistory() {
    applyView('home');
    try { history.pushState({ view: 'home' }, ''); } catch (e) {}
}

function hideDayRecords() {
    renderWeek();
    navigateTo('history');
}

function isQuestDoneToday(mainlineId) {
    var todayKey = formatDateKey(new Date());
    try {
        var raw = localStorage.getItem(QUESTS_DONE_KEY);
        if (!raw) return false;
        var map = JSON.parse(raw);
        var list = map[todayKey] || [];
        return list.indexOf(mainlineId) >= 0;
    } catch (e) {
        return false;
    }
}

function markQuestDone(mainlineId) {
    var todayKey = formatDateKey(new Date());
    var map = {};
    try { map = JSON.parse(localStorage.getItem(QUESTS_DONE_KEY) || '{}') || {}; } catch (e) {}
    var list = map[todayKey] || [];
    if (list.indexOf(mainlineId) < 0) list.push(mainlineId);
    map[todayKey] = list;
    try { localStorage.setItem(QUESTS_DONE_KEY, JSON.stringify(map)); } catch (e) {}
}

function addMainQuestDone(mainline) {
    var task = mainline.todayTask;
    var entry = addToHistory({
        content: mainline.title + '：' + task.content,
        category: '主线·' + mainline.title,
        ts: Date.now()
    }, 'main');
    entry.mainlineId = mainline.id;
    entry.mainlineTitle = mainline.title;
    var history = getHistory();
    for (var i = history.length - 1; i >= 0; i--) {
        if (history[i].id === entry.id) {
            history[i].mainlineId = mainline.id;
            history[i].mainlineTitle = mainline.title;
            break;
        }
    }
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) {}
    return entry;
}

function renderQuests() {
    migrateOldQuests();
    var list = document.getElementById('quests-list');
    var mainlines = getMainlines();
    if (mainlines.length === 0) {
        list.innerHTML = '<div class="empty-hint">还没有主线。<br>给自己一个想走去的方向。</div>' +
            '<button class="quest-add-empty" id="quest-add-empty">添加主线</button>';
        var addBtn = document.getElementById('quest-add-empty');
        if (addBtn) addBtn.addEventListener('click', showCreate);
        return;
    }
    var html = '';
    for (var i = 0; i < mainlines.length; i++) {
        var ml = mainlines[i];
        var task = getTodayTask(ml, i);
        var done = isQuestDoneToday(ml.id);
        var foot = '';
        if (done) {
            foot = '<span class="quest-done-mark">✓ 已完成</span>' +
                '<button class="quest-undo-btn" data-quest="' + ml.id + '">撤销</button>';
        } else {
            foot = '<button class="quest-done-btn" data-quest="' + ml.id + '">做完了</button>';
        }
        html += '<div class="quest-item" data-quest="' + ml.id + '">' +
            '<div class="quest-head"><span class="quest-name">' + ml.title + '</span>' +
            '<button class="quest-more" data-quest="' + ml.id + '">···</button></div>' +
            '<div class="quest-stage">' + ml.stage +
            (ml.deadline ? ' · ' + ml.deadline : '') + '</div>' +
            (ml.subjects && ml.subjects.length > 0
                ? '<div class="quest-week">方向：' + ml.subjects.join(' / ') + '</div>'
                : '') +
            '<div class="quest-today">今天 · ' + (done ? '✓ ' : '○ ') + task.content +
            (task.duration ? '<span class="quest-duration"> ' + task.duration + '</span>' : '') +
            '</div>' +
            '<div class="quest-foot">' + foot + '</div>' +
            '<div class="quest-confirm" data-quest="' + ml.id + '" style="display:none;">' +
            '<div class="quest-confirm-title">删除「' + ml.title + '」？</div>' +
            '<div class="quest-confirm-text">将停止这个主线之后的任务安排。过去已经完成的记录仍会保留。</div>' +
            '<div class="quest-confirm-actions">' +
            '<button class="quest-cancel" data-quest="' + ml.id + '">取消</button>' +
            '<button class="quest-delete" data-quest="' + ml.id + '">删除主线</button>' +
            '</div></div>' +
            '</div>';
    }
    list.innerHTML = html;

    var btns = list.querySelectorAll('.quest-done-btn');
    for (var j = 0; j < btns.length; j++) {
        btns[j].addEventListener('click', function() {
            var id = this.getAttribute('data-quest');
            var ml = findMainline(id);
            if (ml) {
                this.disabled = true;
                window._lastCompletedEntry = addMainQuestDone(ml);
                markQuestDone(ml.id);
                if (window.AudioManager) window.AudioManager.playComplete();
                renderQuests();
                showFinalFeedback();
            }
        });
    }

    var undoBtns = list.querySelectorAll('.quest-undo-btn');
    for (var u = 0; u < undoBtns.length; u++) {
        undoBtns[u].addEventListener('click', function() {
            undoMainQuestToday(this.getAttribute('data-quest'));
        });
    }

    var moreBtns = list.querySelectorAll('.quest-more');
    for (var m = 0; m < moreBtns.length; m++) {
        moreBtns[m].addEventListener('click', function() {
            var id = this.getAttribute('data-quest');
            var confirmBox = list.querySelector('.quest-confirm[data-quest="' + id + '"]');
            if (confirmBox) {
                var isHidden = confirmBox.style.display === 'none';
                var allBoxes = list.querySelectorAll('.quest-confirm');
                for (var b = 0; b < allBoxes.length; b++) allBoxes[b].style.display = 'none';
                confirmBox.style.display = isHidden ? 'block' : 'none';
            }
        });
    }

    var cancelBtns = list.querySelectorAll('.quest-cancel');
    for (var c = 0; c < cancelBtns.length; c++) {
        cancelBtns[c].addEventListener('click', function() {
            var id = this.getAttribute('data-quest');
            var confirmBox = list.querySelector('.quest-confirm[data-quest="' + id + '"]');
            if (confirmBox) confirmBox.style.display = 'none';
        });
    }

    var delBtns = list.querySelectorAll('.quest-delete');
    for (var d = 0; d < delBtns.length; d++) {
        delBtns[d].addEventListener('click', function() {
            deleteQuest(this.getAttribute('data-quest'));
        });
    }
}

function deleteQuest(mainlineId) {
    var list = getMainlines();
    var kept = list.filter(function(m) { return m.id !== mainlineId; });
    saveMainlines(kept);

    var todayKey = formatDateKey(new Date());
    try {
        var done = JSON.parse(localStorage.getItem(QUESTS_DONE_KEY) || '{}') || {};
        var dl = done[todayKey] || [];
        var didx = dl.indexOf(mainlineId);
        if (didx >= 0) dl.splice(didx, 1);
        done[todayKey] = dl;
        localStorage.setItem(QUESTS_DONE_KEY, JSON.stringify(done));
    } catch (e) {}

    window._lastCompletedEntry = null;
    renderQuests();
    showUndoToast('已删除主线');
}

function undoMainQuestToday(mainlineId) {
    var ml = findMainline(mainlineId);
    if (!ml) return;
    var todayKey = formatDateKey(new Date());
    var history = getHistory();
    var candidates = [];
    for (var i = 0; i < history.length; i++) {
        var e = history[i];
        if (formatDateKey(new Date(e.ts)) !== todayKey) continue;
        var isMain = (e.type === 'main' && (e.mainlineId === ml.id || e.mainlineId === ml.templateId)) ||
            (!e.type && e.content.indexOf(ml.title + '：') === 0);
        if (isMain) candidates.push(e);
    }
    candidates.sort(function(a, b) { return a.ts - b.ts; });
    if (candidates.length > 0) {
        var target = candidates[candidates.length - 1];
        if (target.id) {
            removeHistoryById(target.id);
        } else {
            var filtered = history.filter(function(ent) {
                return !(ent.content === target.content && ent.ts === target.ts);
            });
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered)); } catch (e) {}
        }
    }
    try {
        var done = JSON.parse(localStorage.getItem(QUESTS_DONE_KEY) || '{}') || {};
        var list = done[todayKey] || [];
        var didx = list.indexOf(ml.id);
        if (didx >= 0) list.splice(didx, 1);
        done[todayKey] = list;
        localStorage.setItem(QUESTS_DONE_KEY, JSON.stringify(done));
    } catch (e) {}

    window._lastCompletedEntry = null;
    renderQuests();
    renderWeek();
    renderDayRecords();
    showUndoToast();
}

function showQuests() {
    renderQuests();
    navigateTo('quests');
}

function hideQuests() {
    applyView('home');
    try { history.pushState({ view: 'home' }, ''); } catch (e) {}
}

var CREATE_STATE = null;

function createMainlineObject(tpl) {
    var id = 'ml-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    return {
        id: id,
        templateId: tpl.id,
        type: tpl.type,
        title: tpl.title,
        goal: tpl.goal || tpl.title,
        subjects: [],
        stage: '',
        deadline: '',
        createdAt: Date.now(),
        todayKey: '',
        todayTask: null
    };
}

function renderCreateStep() {
    var state = CREATE_STATE;
    if (!state) return;
    var title = document.getElementById('create-title');
    var sub = document.getElementById('create-sub');
    var options = document.getElementById('create-options');
    var nextBtn = document.getElementById('create-next-btn');
    var html = '';

    if (state.step === 0) {
        title.textContent = '你想完成什么？';
        sub.textContent = '「微仰」会把它拆成今天就能迈出的一小步';
        var groups = {};
        for (var i = 0; i < MAINLINE_TYPES.length; i++) {
            var t = MAINLINE_TYPES[i];
            if (!groups[t.group]) groups[t.group] = [];
            groups[t.group].push(t);
        }
        for (var g in groups) {
            html += '<div class="create-group-title">' + g + '</div>';
            for (var j = 0; j < groups[g].length; j++) {
                var t2 = groups[g][j];
                html += '<button class="create-opt' + (state.typeId === t2.id ? ' selected' : '') + '" data-type="' + t2.id + '">' + t2.title + '</button>';
            }
        }
        nextBtn.textContent = '下一步';
    } else if (state.step === 1) {
        var tpl = getMainlineTypeById(state.typeId);
        if (!tpl) return;
        title.textContent = tpl.askSubject || '你想做什么方向？';
        sub.textContent = '可多选，围绕这些方向生成每天的任务';
        for (var s = 0; s < tpl.subjects.length; s++) {
            var subj = tpl.subjects[s];
            var sel = state.subjects.indexOf(subj) >= 0;
            html += '<button class="create-opt' + (sel ? ' selected' : '') + '" data-subject="' + subj + '">' + (sel ? '✓ ' : '') + subj + '</button>';
        }
        nextBtn.textContent = '下一步';
    } else if (state.step === 2) {
        var tpl2 = getMainlineTypeById(state.typeId);
        if (!tpl2) return;
        title.textContent = '你现在进行到哪里了？';
        sub.textContent = '决定任务的轻重：刚开始，任务会非常小';
        for (var st = 0; st < tpl2.stages.length; st++) {
            var stage = tpl2.stages[st];
            html += '<button class="create-opt' + (state.stage === stage ? ' selected' : '') + '" data-stage="' + stage + '">' + stage + '</button>';
        }
        nextBtn.textContent = '下一步';
    } else if (state.step === 3) {
        title.textContent = '你希望什么时候完成？';
        sub.textContent = '先给这个目标一个时间感';
        var deadlines = ['3个月内', '半年内', '一年内'];
        for (var d = 0; d < deadlines.length; d++) {
            var dl = deadlines[d];
            html += '<button class="create-opt' + (state.deadline === dl ? ' selected' : '') + '" data-deadline="' + dl + '">' + dl + '</button>';
        }
        nextBtn.textContent = '创建主线';
    }

    options.innerHTML = html;

    var opts = options.querySelectorAll('.create-opt');
    for (var o = 0; o < opts.length; o++) {
        opts[o].addEventListener('click', function() {
            var el = this;
            if (state.step === 0) {
                state.typeId = el.getAttribute('data-type');
            } else if (state.step === 1) {
                var s = el.getAttribute('data-subject');
                var idx = state.subjects.indexOf(s);
                if (idx >= 0) state.subjects.splice(idx, 1);
                else state.subjects.push(s);
            } else if (state.step === 2) {
                state.stage = el.getAttribute('data-stage');
            } else if (state.step === 3) {
                state.deadline = el.getAttribute('data-deadline');
            }
            renderCreateStep();
        });
    }

    var canNext = false;
    if (state.step === 0) canNext = !!state.typeId;
    else if (state.step === 1) canNext = state.subjects.length > 0;
    else if (state.step === 2) canNext = !!state.stage;
    else if (state.step === 3) canNext = !!state.deadline;
    nextBtn.style.display = canNext ? 'block' : 'none';
}

function createNext() {
    var state = CREATE_STATE;
    if (!state) return;
    if (state.step < 3) {
        state.step += 1;
        renderCreateStep();
        return;
    }
    var tpl = getMainlineTypeById(state.typeId);
    if (!tpl) return;
    var list = getMainlines();
    if (list.length >= MAX_MAINLINES) {
        showUndoToast('主线最多 ' + MAX_MAINLINES + ' 条');
        return;
    }
    var ml = createMainlineObject(tpl);
    ml.subjects = state.subjects.slice();
    ml.stage = state.stage;
    ml.deadline = state.deadline;
    list.push(ml);
    saveMainlines(list);
    getTodayTask(ml, list.length - 1);
    CREATE_STATE = null;
    renderQuests();
    navigateTo('quests');
    showUndoToast('已创建「' + ml.title + '」');
}

function showCreate() {
    CREATE_STATE = { step: 0, typeId: null, subjects: [], stage: null, deadline: null };
    renderCreateStep();
    navigateTo('create');
}

function hideCreate() {
    CREATE_STATE = null;
    navigateTo('quests');
}

function renderSettings() {
    var s = getSettings();
    document.getElementById('morning-enabled').checked = s.morning.enabled;
    document.getElementById('evening-enabled').checked = s.evening.enabled;
}

function getSettings() {
    var def = {
        morning: { enabled: false, time: '08:00' },
        evening: { enabled: true, time: '21:30' }
    };
    try {
        var raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return def;
        var s = JSON.parse(raw);
        if (!s.morning) s.morning = def.morning;
        if (!s.evening) s.evening = def.evening;
        return s;
    } catch (e) {
        return def;
    }
}

function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
}

function showSettings() {
    renderSettings();
    navigateTo('settings');
}

function hideSettings() {
    applyView('home');
    try { history.pushState({ view: 'home' }, ''); } catch (e) {}
}

function getCurrentMinutes() {
    var now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function isEveningNudgeTime(settings) {
    if (!settings.evening.enabled) return false;
    var parts = settings.evening.time.split(':');
    var target = Number(parts[0]) * 60 + Number(parts[1]);
    return getCurrentMinutes() >= target;
}

function nudgeShownToday() {
    var todayKey = formatDateKey(new Date());
    try {
        var raw = localStorage.getItem(NUDGE_KEY);
        if (!raw) return true;
        var map = JSON.parse(raw);
        return map[todayKey] === true;
    } catch (e) {
        return true;
    }
}

function markNudgeShown() {
    var todayKey = formatDateKey(new Date());
    var map = {};
    try { map = JSON.parse(localStorage.getItem(NUDGE_KEY) || '{}') || {}; } catch (e) {}
    map[todayKey] = true;
    try { localStorage.setItem(NUDGE_KEY, JSON.stringify(map)); } catch (e) {}
}

function checkNudge() {
    var settings = getSettings();
    if (!isEveningNudgeTime(settings)) return;
    if (nudgeShownToday()) return;
    document.getElementById('evening-nudge').classList.add('show');
}

function hideNudge() {
    document.getElementById('evening-nudge').classList.remove('show');
    markNudgeShown();
}

var sqCurrentRec = null;

function showSideQuestCard() {
    var card = document.getElementById('sq-card');

    function fill() {
        var rec = getRecommendation();
        sqCurrentRec = rec;
        document.getElementById('sq-cat').textContent = rec.category;
        document.getElementById('sq-task').textContent = rec.content;
        card.classList.remove('expanded');
        renderSqInlineDetails(rec.details);

        var refreshBtn = document.getElementById('sq-refresh');
        var doBtn = document.getElementById('sq-do');
        var skipBtn = document.getElementById('sq-skip');
        var confirmBtn = document.getElementById('sq-confirm');
        var undoBtn = document.getElementById('sq-undo');
        undoBtn.style.display = 'none';
        confirmBtn.disabled = false;

        refreshBtn.style.display = 'block';
        doBtn.style.display = 'block';
        skipBtn.style.display = 'none';
        confirmBtn.style.display = 'none';

        refreshBtn.onclick = function() {
            if (window.AudioManager) window.AudioManager.playClick();
            showSideQuestCard();
        };
        doBtn.onclick = function() {
            if (window.AudioManager) window.AudioManager.playClick();
            card.classList.add('expanded');
            card.scrollIntoView({ block: 'nearest' });
            refreshBtn.style.display = 'none';
            doBtn.style.display = 'none';
            skipBtn.style.display = 'block';
            confirmBtn.style.display = 'block';
            confirmBtn.disabled = false;
        };
        skipBtn.onclick = function() {
            if (window.AudioManager) window.AudioManager.playClick();
            showSideQuestCard();
        };
        confirmBtn.onclick = function() {
            if (confirmBtn.disabled) return;
            confirmBtn.disabled = true;
            window._lastCompletedEntry = addToHistory(rec, 'side');
            document.getElementById('sq-details').style.display = 'none';
            card.classList.remove('expanded');
            skipBtn.style.display = 'none';
            confirmBtn.style.display = 'none';
            document.getElementById('sq-task').textContent = '这一刻 你选择了自己。';
            undoBtn.style.display = 'block';
            undoBtn.disabled = false;
            if (window.AudioManager) window.AudioManager.playComplete();
            undoBtn.onclick = function() {
                clearTimeout(window._sqNextTimer);
                undoLastCompletion();
                undoBtn.style.display = 'none';
                showSideQuestCard();
            };
            clearTimeout(window._sqNextTimer);
            window._sqNextTimer = setTimeout(function() {
                undoBtn.style.display = 'none';
                showSideQuestCard();
            }, 1500);
        };
    }

    if (card.classList.contains('switching')) {
        fill();
        return;
    }
    card.classList.add('switching');
    setTimeout(function() {
        fill();
        card.classList.remove('switching');
    }, 220);
}

function renderSqInlineDetails(details) {
    var list = document.getElementById('sq-details-list');
    if (!details || details.length === 0) {
        list.innerHTML = '';
        return;
    }
    list.innerHTML = details.map(function(d) { return '<li>' + d + '</li>'; }).join('');
}

window.addEventListener('popstate', function(e) {
    var target = (e.state && e.state.view) || 'home';
    if (target === 'history-day') {
        renderDayRecords();
    } else if (target === 'history') {
        renderWeek();
    } else if (target === 'quests') {
        renderQuests();
    } else if (target === 'create') {
        renderCreateStep();
    }
    applyView(target);
});

window.addEventListener('DOMContentLoaded', function() {
    migrateOldQuests();
    var riseLine = document.getElementById('riseLine');
    var riseDot = document.getElementById('riseDot');

    var len = riseLine.getTotalLength();
    riseLine.style.strokeDasharray = len;
    riseLine.style.strokeDashoffset = len;

    setTimeout(function() {
        riseLine.classList.add('animate');
    }, 300);

    setTimeout(function() {
        riseDot.classList.add('animate');
    }, 300 + 1100 - 150);

    setTimeout(function() {
        document.getElementById('brand-name').classList.add('show');
    }, 300 + 1100 + 100);

    setTimeout(function() {
        document.getElementById('tagline').classList.add('show');
    }, 300 + 1100 + 500);

    setTimeout(function() {
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('main').classList.add('show');
    }, 300 + 1100 + 1400);

    document.getElementById('quests-entry').addEventListener('click', function() {
        if (window.AudioManager) window.AudioManager.playClick();
        showQuests();
    });
    document.getElementById('side-entry').addEventListener('click', function() {
        if (window.AudioManager) window.AudioManager.playClick();
        if (window.BLINDS && window.BLINDS.quickEnterSideQuest) {
            window.BLINDS.quickEnterSideQuest();
        } else {
            window.navigateToSideQuest();
        }
    });
    document.getElementById('sq-card').addEventListener('click', function(e) {
        if (e.target && e.target.closest && e.target.closest('.sq-btn, .feedback-undo, .sq-back')) return;
        this.classList.toggle('expanded');
    });
    document.getElementById('close-detail').addEventListener('click', hideDetails);
    document.getElementById('history-link').addEventListener('click', function() {
        if (window.AudioManager) window.AudioManager.playClick();
        showHistory();
    });
    document.getElementById('settings-link').addEventListener('click', function() {
        if (window.AudioManager) window.AudioManager.playClick();
        showSettings();
    });
    document.getElementById('history-home-back').addEventListener('click', hideHistory);
    document.getElementById('day-back').addEventListener('click', hideDayRecords);
    document.getElementById('prev-week').addEventListener('click', function() {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderWeek();
    });
    document.getElementById('next-week').addEventListener('click', function() {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderWeek();
    });
    document.getElementById('quests-back').addEventListener('click', hideQuests);
    document.getElementById('add-quest-btn').addEventListener('click', showCreate);
    document.getElementById('create-back').addEventListener('click', hideCreate);
    document.getElementById('create-next-btn').addEventListener('click', createNext);
    document.getElementById('settings-back').addEventListener('click', hideSettings);
    document.getElementById('morning-enabled').addEventListener('change', function() {
        var s = getSettings();
        s.morning.enabled = this.checked;
        saveSettings(s);
    });
    document.getElementById('evening-enabled').addEventListener('change', function() {
        var s = getSettings();
        s.evening.enabled = this.checked;
        saveSettings(s);
    });
    document.getElementById('nudge-dismiss').addEventListener('click', hideNudge);
    document.getElementById('nudge-open').addEventListener('click', function() {
        hideNudge();
        showHistory();
    });
    document.getElementById('journal-toggle').addEventListener('click', function() {
        var editor = document.getElementById('journal-editor');
        var isHidden = editor.style.display === 'none';
        editor.style.display = isHidden ? 'block' : 'none';
        if (isHidden) document.getElementById('journal-input').focus();
    });
    document.getElementById('journal-save').addEventListener('click', function() {
        var input = document.getElementById('journal-input');
        var text = input.value.replace(/^\s+|\s+$/g, '');
        if (!text) return;
        addJournal(selectedDateKey, text);
        input.value = '';
        document.getElementById('journal-editor').style.display = 'none';
        renderDayRecords();
    });
    window.onSideQuestOpen = showSideQuestCard;
    checkNudge();
});
