#!/usr/bin/env node
/**
 * 互动功能压力测试脚本
 * 
 * 使用方法:
 * node scripts/loadtest_interactions.mjs [options]
 * 
 * 选项:
 *   --concurrency, -c  并发用户数 (默认: 100)
 *   --duration, -d     测试持续时间秒数 (默认: 60)
 *   --target-type, -t  目标类型: story|booklist|spinoff (默认: story)
 *   --target-id, -i    目标ID (默认: 自动获取第一个)
 *   --endpoint, -e     API端点 (默认: http://localhost:3001/api)
 */

import http from 'http';
import { parseArgs } from 'util';

const { values: args } = parseArgs({
  options: {
    concurrency: { type: 'string', short: 'c', default: '100' },
    duration: { type: 'string', short: 'd', default: '60' },
    'target-type': { type: 'string', short: 't', default: 'story' },
    'target-id': { type: 'string', short: 'i' },
    endpoint: { type: 'string', short: 'e', default: 'http://localhost:3001/api' },
  },
});

const CONFIG = {
  concurrency: parseInt(args.concurrency),
  duration: parseInt(args.duration) * 1000,
  targetType: args['target-type'],
  targetId: args['target-id'],
  endpoint: args.endpoint,
};

// 统计指标
const stats = {
  requests: 0,
  successes: 0,
  failures: 0,
  latencies: [],
  statusCodes: {},
  errors: [],
  startTime: Date.now(),
};

// 生成随机用户ID
const generateUserId = () => `test-user-${Math.random().toString(36).slice(2, 8)}`;

// HTTP请求函数
const makeRequest = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.endpoint);
    const startTime = Date.now();
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          latency,
          data: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
};

// 获取目标ID
const getTargetId = async () => {
  if (CONFIG.targetId) return CONFIG.targetId;
  
  try {
    const response = await makeRequest(`/${CONFIG.targetType}s`);
    if (response.data?.data?.length > 0) {
      return response.data.data[0].id;
    }
  } catch (e) {
    console.error('Failed to get target ID:', e.message);
  }
  return 'test-target-id';
};

// 测试场景
const scenarios = {
  // 场景1: 获取统计信息 (读多)
  getStats: async (targetId) => {
    const response = await makeRequest(`/interactions/${CONFIG.targetType}/${targetId}`);
    return response;
  },

  // 场景2: 点赞操作
  toggleLike: async (targetId, userId) => {
    const response = await makeRequest(
      `/interactions/${CONFIG.targetType}/${targetId}/like`,
      'POST',
      null,
      { 'Authorization': `Bearer ${userId}` }
    );
    return response;
  },

  // 场景3: 评分操作
  submitRating: async (targetId, userId) => {
    const score = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5][Math.floor(Math.random() * 9)];
    const response = await makeRequest(
      `/interactions/${CONFIG.targetType}/${targetId}/rating`,
      'PUT',
      { score, reasonTags: ['剧情精彩'] },
      { 'Authorization': `Bearer ${userId}` }
    );
    return response;
  },

  // 场景4: 分享操作
  recordShare: async (targetId) => {
    const platforms = ['wechat', 'weibo', 'qq', 'copy'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const response = await makeRequest(
      `/interactions/${CONFIG.targetType}/${targetId}/share`,
      'POST',
      { platform }
    );
    return response;
  },
};

// 虚拟用户
class VirtualUser {
  constructor(id, targetId) {
    this.id = id;
    this.userId = generateUserId();
    this.targetId = targetId;
    this.running = true;
  }

  async run() {
    while (this.running && Date.now() - stats.startTime < CONFIG.duration) {
      try {
        // 模拟真实场景分布: 70%读, 15%点赞, 10%评分, 5%分享
        const rand = Math.random();
        let scenario;
        
        if (rand < 0.70) {
          scenario = 'getStats';
        } else if (rand < 0.85) {
          scenario = 'toggleLike';
        } else if (rand < 0.95) {
          scenario = 'submitRating';
        } else {
          scenario = 'recordShare';
        }

        const startTime = Date.now();
        let response;

        switch (scenario) {
          case 'getStats':
            response = await scenarios.getStats(this.targetId);
            break;
          case 'toggleLike':
            response = await scenarios.toggleLike(this.targetId, this.userId);
            break;
          case 'submitRating':
            response = await scenarios.submitRating(this.targetId, this.userId);
            break;
          case 'recordShare':
            response = await scenarios.recordShare(this.targetId);
            break;
        }

        const latency = Date.now() - startTime;
        
        // 记录统计
        stats.requests++;
        stats.latencies.push(latency);
        
        if (response.status >= 200 && response.status < 300) {
          stats.successes++;
        } else {
          stats.failures++;
        }
        
        stats.statusCodes[response.status] = (stats.statusCodes[response.status] || 0) + 1;

        // 检查响应时间是否超过200ms
        if (latency > 200) {
          stats.errors.push({
            time: Date.now(),
            scenario,
            latency,
            message: `Response time exceeded 200ms: ${latency}ms`,
          });
        }

        // 随机间隔 100-500ms
        await new Promise(r => setTimeout(r, 100 + Math.random() * 400));
        
      } catch (error) {
        stats.requests++;
        stats.failures++;
        stats.errors.push({
          time: Date.now(),
          error: error.message,
        });
      }
    }
  }

  stop() {
    this.running = false;
  }
}

// 计算百分位数
const percentile = (arr, p) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

// 生成报告
const generateReport = () => {
  const duration = (Date.now() - stats.startTime) / 1000;
  const rps = (stats.requests / duration).toFixed(2);
  const successRate = ((stats.successes / stats.requests) * 100).toFixed(2);
  
  const latencies = stats.latencies;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  
  const slowRequests = latencies.filter(l => l > 200).length;
  const availability = ((stats.successes / stats.requests) * 100).toFixed(3);

  console.log('\n' + '='.repeat(60));
  console.log('📊 互动功能压力测试报告');
  console.log('='.repeat(60));
  console.log(`\n🎯 测试配置:`);
  console.log(`   并发用户数: ${CONFIG.concurrency}`);
  console.log(`   测试时长: ${duration.toFixed(1)}秒`);
  console.log(`   目标类型: ${CONFIG.targetType}`);
  console.log(`   目标ID: ${CONFIG.targetId}`);
  console.log(`\n📈 请求统计:`);
  console.log(`   总请求数: ${stats.requests}`);
  console.log(`   成功请求: ${stats.successes}`);
  console.log(`   失败请求: ${stats.failures}`);
  console.log(`   成功率: ${successRate}%`);
  console.log(`   QPS: ${rps}`);
  console.log(`\n⏱️  响应时间 (ms):`);
  console.log(`   平均: ${avgLatency.toFixed(2)}`);
  console.log(`   P50:  ${p50.toFixed(2)}`);
  console.log(`   P95:  ${p95.toFixed(2)}`);
  console.log(`   P99:  ${p99.toFixed(2)}`);
  console.log(`   最大: ${Math.max(...latencies)}`);
  console.log(`   >200ms: ${slowRequests} (${((slowRequests/stats.requests)*100).toFixed(2)}%)`);
  console.log(`\n📊 HTTP状态码分布:`);
  Object.entries(stats.statusCodes)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([code, count]) => {
      console.log(`   ${code}: ${count} (${((count/stats.requests)*100).toFixed(1)}%)`);
    });
  console.log(`\n🎯 SLA检查:`);
  console.log(`   接口响应时间 ≤ 200ms: ${avgLatency <= 200 ? '✅ 通过' : '❌ 未通过'}`);
  console.log(`   P95 ≤ 200ms: ${p95 <= 200 ? '✅ 通过' : '❌ 未通过'}`);
  console.log(`   可用性 ≥ 99.9%: ${parseFloat(availability) >= 99.9 ? '✅ 通过' : '❌ 未通过'}`);
  console.log(`   成功率 ≥ 99%: ${parseFloat(successRate) >= 99 ? '✅ 通过' : '❌ 未通过'}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  错误样本 (前10条):`);
    stats.errors.slice(0, 10).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.message || err.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // 返回JSON报告
  return {
    config: CONFIG,
    summary: {
      duration,
      totalRequests: stats.requests,
      successCount: stats.successes,
      failureCount: stats.failures,
      successRate: parseFloat(successRate),
      rps: parseFloat(rps),
      availability: parseFloat(availability),
    },
    latency: {
      avg: avgLatency,
      p50,
      p95,
      p99,
      max: Math.max(...latencies),
      slowRequests,
      slowRequestRate: (slowRequests / stats.requests) * 100,
    },
    statusCodes: stats.statusCodes,
    sla: {
      avgLatencyMet: avgLatency <= 200,
      p95LatencyMet: p95 <= 200,
      availabilityMet: parseFloat(availability) >= 99.9,
      successRateMet: parseFloat(successRate) >= 99,
    },
  };
};

// 主函数
const main = async () => {
  console.log('🚀 启动互动功能压力测试...\n');
  
  // 获取目标ID
  CONFIG.targetId = await getTargetId();
  console.log(`✅ 目标ID: ${CONFIG.targetId}\n`);
  
  // 创建虚拟用户
  const users = [];
  for (let i = 0; i < CONFIG.concurrency; i++) {
    users.push(new VirtualUser(i, CONFIG.targetId));
  }
  
  console.log(`🔄 启动 ${CONFIG.concurrency} 个虚拟用户...`);
  
  // 启动所有用户
  const userPromises = users.map(user => user.run());
  
  // 显示进度
  const progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
    const rps = (stats.requests / parseInt(elapsed || 1)).toFixed(1);
    process.stdout.write(`\r⏱️  ${elapsed}s | 请求: ${stats.requests} | 成功: ${stats.successes} | QPS: ${rps}    `);
  }, 1000);
  
  // 等待测试完成
  await Promise.all(userPromises);
  
  clearInterval(progressInterval);
  console.log('\n');
  
  // 生成报告
  const report = generateReport();
  
  // 保存报告到文件
  const fs = await import('fs');
  const reportPath = `loadtest-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 详细报告已保存: ${reportPath}`);
  
  // 根据SLA判断是否通过
  const allPassed = Object.values(report.sla).every(v => v);
  process.exit(allPassed ? 0 : 1);
};

main().catch(console.error);
