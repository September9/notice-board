// ===== Notice Board App =====
'use strict';

// ===== Configuration =====
const CONFIG = {
    noticesJsonUrl: 'notices.json',
    refreshInterval: 30000,          // 30秒刷新一次
    pageSize: 8,                     // 每页显示条数（紧凑模式）
    slideInterval: 10000,            // 10秒翻页
    maxRetries: 3
};

// ===== State =====
let notices = [];
let filteredNotices = [];
let currentPage = 0;
let totalPages = 0;
let refreshTimer = null;
let slideTimer = null;
let countdownTimer = null;
let countdownSeconds = CONFIG.refreshInterval / 1000;

// ===== DOM Elements =====
const elements = {
    noticesContainer: null,
    updateTime: null,
    noticeCount: null,
    pageIndicator: null,
    refreshInterval: null,
    nextRefresh: null,
    statusText: null
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    loadNotices();
    startAutoRefresh();
    startSlideShow();
});

// ===== Element Initialization =====
function initElements() {
    elements.noticesContainer = document.getElementById('noticesContainer');
    elements.updateTime = document.getElementById('updateTime');
    elements.noticeCount = document.getElementById('noticeCount');
    elements.pageIndicator = document.getElementById('pageIndicator');
    elements.refreshInterval = document.getElementById('refreshInterval');
    elements.nextRefresh = document.getElementById('nextRefresh');
    elements.statusText = document.getElementById('statusText');
    
    elements.refreshInterval.textContent = CONFIG.refreshInterval / 1000;
}

// ===== Sample Data (Fallback) =====
const SAMPLE_DATA = {
    notices: [
        {
            id: "1",
            title: "网络安全培训",
            content: "请各部门于4月15日前完成培训",
            channel: "oa群",
            publishTime: "2026/3/23",
            expireTime: "2026/4/15",
            status: "active"
        },
        {
            id: "2",
            title: "体检通知",
            content: "教职工体检已开始",
            channel: "微信群",
            publishTime: "2026/3/24",
            expireTime: "2026/3/31",
            status: "active"
        },
        {
            id: "3",
            title: "科技成果申报",
            content: "请于4月20日前提交材料",
            channel: "邮件",
            publishTime: "2026/3/23",
            expireTime: "2026/4/20",
            status: "active"
        }
    ]
};

// ===== Load Notices =====
async function loadNotices() {
    try {
        // Try to load from notices.json (synced from Tencent Docs)
        let data = null;
        try {
            const response = await fetch(CONFIG.noticesJsonUrl + '?t=' + Date.now(), {
                cache: 'no-cache'
            });
            if (response.ok) {
                data = await response.json();
            }
        } catch (e) {
            console.log('Failed to load notices.json, using sample data');
        }
        
        // Use fetched data or embedded sample data
        notices = data?.notices || SAMPLE_DATA.notices;
        
        // Filter and sort notices
        filteredNotices = filterAndSortNotices(notices);
        
        // Update UI
        updateDisplay();
        updateStatus('success');
        
    } catch (error) {
        console.error('Load error:', error);
        updateStatus('error');
        showError(error.message);
    }
}

// ===== Filter & Sort =====
function filterAndSortNotices(notices) {
    const now = new Date();
    
    return notices
        .filter(notice => {
            if (!notice.expireTime) return true;
            return new Date(notice.expireTime) > now;
        })
        .sort((a, b) => {
            // 1. 即将过期的优先
            const daysUntilExpireA = getDaysUntilExpire(a.expireTime);
            const daysUntilExpireB = getDaysUntilExpire(b.expireTime);
            
            if (daysUntilExpireA <= 3 && daysUntilExpireB > 3) return -1;
            if (daysUntilExpireB <= 3 && daysUntilExpireA > 3) return 1;
            
            // 2. 按发布时间倒序
            return new Date(b.publishTime) - new Date(a.publishTime);
        });
}

function getDaysUntilExpire(expireTime) {
    if (!expireTime) return 999;
    const now = new Date();
    const expire = new Date(expireTime);
    return Math.ceil((expire - now) / (1000 * 60 * 60 * 24));
}

// ===== Update Display =====
function updateDisplay() {
    // Update header
    const now = new Date();
    elements.updateTime.textContent = formatTime(now);
    elements.noticeCount.textContent = filteredNotices.length;
    
    // Calculate pagination based on screen height
    const screenHeight = window.innerHeight;
    CONFIG.pageSize = screenHeight > 800 ? 5 : 3;
    
    totalPages = Math.ceil(filteredNotices.length / CONFIG.pageSize) || 1;
    currentPage = Math.min(currentPage, totalPages - 1);
    
    // Render current page
    renderPage(currentPage);
    updatePagination();
}

function renderPage(pageIndex) {
    elements.noticesContainer.innerHTML = '';
    
    const start = pageIndex * CONFIG.pageSize;
    const end = start + CONFIG.pageSize;
    const pageNotices = filteredNotices.slice(start, end);
    
    if (pageNotices.length === 0) {
        renderEmpty();
        return;
    }
    
    const wrapper = document.createElement('div');
    wrapper.className = 'notices-wrapper active';
    
    pageNotices.forEach((notice, index) => {
        const card = createNoticeCard(notice, start + index);
        wrapper.appendChild(card);
    });
    
    elements.noticesContainer.appendChild(wrapper);
}

function createNoticeCard(notice, index) {
    const card = document.createElement('div');
    card.className = `notice-card color-${index % 8}`;
    card.style.animationDelay = `${index * 0.1}s`;
    
    const daysUntil = getDaysUntilExpire(notice.expireTime);
    
    // Add urgency class
    if (daysUntil <= 1) {
        card.classList.add('urgent');
    } else if (daysUntil <= 3) {
        card.classList.add('expiring');
    }
    
    // Channel icon and label
    const channelIcon = getChannelIcon(notice.channel);
    const channelLabel = getChannelLabel(notice.channel);
    
    // Expire warning
    let expireHtml = '';
    if (notice.expireTime) {
        const expireDate = new Date(notice.expireTime);
        const expireDateStr = expireDate.toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit'
        });
        
        let expireIcon = '';
        let expireClass = '';
        
        if (daysUntil <= 0) {
            expireIcon = '🔴';
            expireClass = 'urgent';
        } else if (daysUntil <= 3) {
            expireIcon = '⚠️';
            expireClass = 'expiring';
        } else {
            expireIcon = '📅';
        }
        
        expireHtml = `<span class="notice-expire ${expireClass}">${expireIcon} 截止：${expireDateStr}</span>`;
    }
    
    card.innerHTML = `
        <div class="notice-main">
            <div class="notice-channel-icon" data-channel="${notice.channel || 'default'}">
                <span class="channel-emoji">${channelIcon}</span>
                <span class="channel-text">${channelLabel}</span>
            </div>
            <div class="notice-body">
                <div class="notice-title">${notice.title || '无标题'}</div>
                <div class="notice-content">${notice.content || ''}</div>
                <div class="notice-meta">
                    <span class="notice-time">📅 ${formatDate(notice.publishTime)}</span>
                    ${expireHtml}
                </div>
            </div>
        </div>
    `;
    
    return card;
}

function renderEmpty() {
    elements.noticesContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-title">暂无通知</div>
            <div class="empty-subtitle">敬请期待...</div>
        </div>
    `;
}

function updatePagination() {
    elements.pageIndicator.textContent = `${currentPage + 1} / ${totalPages}`;
}

// ===== Channel Helpers =====
function getChannelIcon(channel) {
    const icons = {
        'oa': '🔔',
        'oa群': '🔔',
        '微信': '💬',
        '微信群': '💬',
        '邮件': '📧',
        'email': '📧',
        '点对点': '💌',
        '短信': '📱'
    };
    return icons[channel] || '📌';
}

function getChannelLabel(channel) {
    const labels = {
        'oa': 'OA群',
        'oa群': 'OA群',
        '微信': '微信',
        '微信群': '微信',
        '邮件': '邮件',
        'email': '邮件',
        '点对点': '点对点',
        '短信': '短信'
    };
    return labels[channel] || channel || '其他';
}

// ===== Time Formatters =====
function formatTime(date) {
    return date.toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== Auto Refresh =====
function startAutoRefresh() {
    resetCountdown();
    
    refreshTimer = setInterval(() => {
        loadNotices();
        resetCountdown();
    }, CONFIG.refreshInterval);
    
    countdownTimer = setInterval(() => {
        countdownSeconds--;
        if (countdownSeconds <= 0) countdownSeconds = CONFIG.refreshInterval / 1000;
        elements.nextRefresh.textContent = `下次刷新: ${countdownSeconds}秒`;
    }, 1000);
}

function resetCountdown() {
    countdownSeconds = CONFIG.refreshInterval / 1000;
}

// ===== Slideshow =====
function startSlideShow() {
    if (totalPages <= 1) return;
    
    slideTimer = setInterval(() => {
        currentPage = (currentPage + 1) % totalPages;
        renderPage(currentPage);
        updatePagination();
    }, CONFIG.slideInterval);
}

// ===== Status =====
function updateStatus(status) {
    const statusMap = {
        'success': { text: '数据正常', class: 'active' },
        'error': { text: '连接异常', class: '' },
        'loading': { text: '加载中...', class: '' }
    };
    
    const info = statusMap[status] || statusMap.loading;
    elements.statusText.textContent = info.text;
    
    const dot = document.querySelector('.status-dot');
    if (dot) dot.className = `status-dot ${info.class}`;
}

function showError(message) {
    elements.noticesContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <div class="empty-title">加载失败</div>
            <div class="empty-subtitle">${message}</div>
        </div>
    `;
}

// ===== Utility =====
function stopAllTimers() {
    if (refreshTimer) clearInterval(refreshTimer);
    if (slideTimer) clearInterval(slideTimer);
    if (countdownTimer) clearInterval(countdownTimer);
}

// ===== Handle resize =====
window.addEventListener('resize', () => {
    updateDisplay();
});

// ===== Visibility API - pause when hidden =====
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAllTimers();
    } else {
        loadNotices();
        startAutoRefresh();
        startSlideShow();
    }
});
