import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@ldesign/monitor',
  description: '企业级前端监控 SDK - 性能监控、错误追踪、用户行为分析',
  
  lang: 'zh-CN',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: 'API 参考', link: '/api/core' },
      { text: '增强功能', link: '/enhanced/overview' },
      { text: '示例', link: '/examples/basic' },
      { 
        text: '更新日志', 
        link: 'https://github.com/ldesign/monitor/blob/main/CHANGELOG.md' 
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
            { text: '配置', link: '/guide/configuration' },
          ],
        },
        {
          text: '核心功能',
          items: [
            { text: '性能监控', link: '/guide/performance' },
            { text: '错误追踪', link: '/guide/error-tracking' },
            { text: '用户行为', link: '/guide/user-behavior' },
            { text: 'API 监控', link: '/guide/api-monitoring' },
          ],
        },
        {
          text: '高级功能',
          items: [
            { text: '会话回放', link: '/guide/session-replay' },
            { text: '热力图', link: '/guide/heatmap' },
            { text: '漏斗分析', link: '/guide/funnel' },
            { text: 'A/B 测试', link: '/guide/ab-testing' },
          ],
        },
        {
          text: '框架集成',
          items: [
            { text: 'Vue 3', link: '/guide/vue' },
            { text: 'React', link: '/guide/react' },
          ],
        },
        {
          text: '最佳实践',
          items: [
            { text: '性能优化', link: '/guide/performance-tips' },
            { text: '隐私保护', link: '/guide/privacy' },
            { text: '生产部署', link: '/guide/production' },
          ],
        },
      ],

      '/enhanced/': [
        {
          text: '增强功能',
          items: [
            { text: '概述', link: '/enhanced/overview' },
            { text: '快速开始', link: '/enhanced/getting-started' },
          ],
        },
        {
          text: '性能增强',
          items: [
            { text: '自定义性能标记', link: '/enhanced/performance-marks' },
            { text: 'Long Tasks 检测', link: '/enhanced/long-tasks' },
            { text: '内存监控', link: '/enhanced/memory-monitor' },
            { text: 'FPS 监控', link: '/enhanced/fps-monitor' },
            { text: '优化建议', link: '/enhanced/optimization' },
          ],
        },
        {
          text: '行为增强',
          items: [
            { text: '滚动深度追踪', link: '/enhanced/scroll-depth' },
            { text: '停留时间统计', link: '/enhanced/time-on-page' },
          ],
        },
        {
          text: 'API 增强',
          items: [
            { text: 'GraphQL 监控', link: '/enhanced/graphql' },
            { text: 'WebSocket 监控', link: '/enhanced/websocket' },
            { text: '离线缓存', link: '/enhanced/offline-storage' },
          ],
        },
        {
          text: '错误增强',
          items: [
            { text: '跨域错误处理', link: '/enhanced/cross-origin-error' },
            { text: '框架错误集成', link: '/enhanced/framework-error' },
            { text: '错误分析', link: '/enhanced/error-analytics' },
          ],
        },
      ],

      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '核心 API', link: '/api/core' },
            { text: '性能监控', link: '/api/performance' },
            { text: '错误追踪', link: '/api/error' },
            { text: '用户行为', link: '/api/behavior' },
            { text: 'API 监控', link: '/api/api-monitoring' },
          ],
        },
        {
          text: '增强 API',
          items: [
            { text: 'EnhancedMonitor', link: '/api/enhanced-monitor' },
            { text: 'PerformanceEnhancer', link: '/api/performance-enhancer' },
            { text: 'BehaviorEnhancer', link: '/api/behavior-enhancer' },
            { text: 'ErrorAnalytics', link: '/api/error-analytics' },
          ],
        },
        {
          text: '类型定义',
          items: [
            { text: '配置类型', link: '/api/types/config' },
            { text: '事件类型', link: '/api/types/events' },
            { text: '增强类型', link: '/api/types/enhanced' },
          ],
        },
      ],

      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '基础使用', link: '/examples/basic' },
            { text: 'Vue 3 应用', link: '/examples/vue' },
            { text: 'React 应用', link: '/examples/react' },
            { text: '增强监控', link: '/examples/enhanced' },
          ],
        },
        {
          text: '实战场景',
          items: [
            { text: '电商结账', link: '/examples/e-commerce' },
            { text: 'SPA 路由', link: '/examples/spa-router' },
            { text: '实时仪表板', link: '/examples/dashboard' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ldesign/monitor' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present LDesign Team',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
      label: '目录',
    },

    editLink: {
      pattern: 'https://github.com/ldesign/monitor/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    lastUpdated: {
      text: '最后更新',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
})
