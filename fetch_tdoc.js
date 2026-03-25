// 腾讯文档数据同步脚本
// 使用 mcporter 获取腾讯文档数据并转换为 notices.json 格式

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function fetchAndSync() {
    try {
        // 调用 mcporter 获取腾讯文档数据
        console.log('正在获取腾讯文档数据...');
        const result = execSync('mcporter call tencent-docs.get_content file_id=DWm5Mc3REcFVwcHNH', {
            encoding: 'utf8',
            timeout: 30000
        });
        
        const data = JSON.parse(result);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // 解析表格内容
        const lines = data.content.trim().split('\n');
        
        if (lines.length < 2) {
            console.log('没有数据');
            return;
        }
        
        // 跳过表头，解析数据行
        const notices = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('|') === false) continue;
            
            // 解析 CSV 格式
            const parts = line.split('|').filter(p => p.trim());
            
            if (parts.length >= 5) {
                const publishTime = parts[0].trim();
                const title = parts[1].trim();
                const content = parts[2].trim();
                const channel = parts[3].trim();
                const expireTime = parts[4].trim();
                
                notices.push({
                    id: `notice_${Date.now()}_${i}`,
                    title: title,
                    content: content,
                    channel: channel,
                    publishTime: publishTime,
                    expireTime: expireTime,
                    status: 'active'
                });
            }
        }
        
        // 生成 notices.json
        const noticesData = {
            notices: notices,
            lastUpdated: new Date().toISOString()
        };
        
        // 保存到文件
        const outputPath = path.join(__dirname, 'notices.json');
        fs.writeFileSync(outputPath, JSON.stringify(noticesData, null, 2), 'utf8');
        
        console.log(`✅ 成功同步 ${notices.length} 条通知到 notices.json`);
        
    } catch (error) {
        console.error('❌ 同步失败:', error.message);
        process.exit(1);
    }
}

fetchAndSync();
