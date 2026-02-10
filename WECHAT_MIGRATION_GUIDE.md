# 微信小程序迁移说明

本项目已成功从 React + Vite Web 应用迁移为微信小程序版本。

## 迁移完成内容

### 1. 项目结构迁移

| 原项目 (React) | 小程序版本 | 说明 |
|---------------|-----------|------|
| `App.tsx` | `app.js/app.json/app.wxss` | 小程序入口配置 |
| `components/*.tsx` | `pages/index/index.wxml` | 组件转换为小程序页面 |
| `services/geminiService.ts` | `cloudfunctions/calculateKinship/` | 服务端逻辑转为云函数 |
| `vite.config.ts` | `project.config.json` | 项目配置 |

### 2. UI 样式保持完全一致

- **颜色方案**：品牌色 `#3b82f6`（blue-500）完全一致
- **字体样式**：使用系统字体栈，保持相同视觉效果
- **卡片设计**：圆角 32rpx、阴影、边框等细节完全复刻
- **响应式布局**：使用 rpx 单位，适配所有手机屏幕

### 3. 功能特性完整保留

✅ **关系输入**：支持文本输入和快捷按钮
✅ **回退/清空**：完整的编辑功能
✅ **AI 计算**：通过云函数调用 AI API
✅ **结果展示**：渐变色结果卡片，带装饰效果
✅ **计算过程**：步骤分解，带时间线样式
✅ **关系图谱**：使用 Canvas 2D 重新实现 D3 功能

### 4. 关系图谱替代方案

原项目使用 D3.js 实现力导向图，小程序版本使用原生 Canvas 2D API：

**实现功能：**
- 节点渲染（不同颜色区分起点/中间/终点）
- 连线绘制（带箭头）
- 关系标签显示
- 简化的力导向布局
- 触摸拖拽移动
- 缩放控制（放大/缩小/适应屏幕）

### 5. API 调用优化

原项目直接使用 OpenAI SDK，小程序版本：

- 前端通过 `wx.cloud.callFunction` 调用云函数
- 云函数中集中管理 API Key
- 支持降级到本地模拟数据（开发测试用）
- 符合小程序安全规范

## 文件映射关系

```
原 React 项目                  小程序项目
─────────────────────────────────────────────────
App.tsx                     →  pages/index/index.js
components/InputSection     →  整合到 index.wxml
components/ResultSection    →  整合到 index.wxml
components/AnalysisSection  →  整合到 index.wxml
components/GraphSection     →  整合到 index.js (Canvas)
services/geminiService.ts   →  cloudfunctions/calculateKinship/index.js
types.ts                    →  内联到各文件中
```

## 部署步骤

### 方式一：微信开发者工具（推荐）

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择 `miniprogram` 文件夹
4. 填入小程序 AppID
5. 开通云开发并部署云函数
6. 预览或发布

### 方式二：云开发控制台

1. 登录 [微信云开发控制台](https://console.cloud.tencent.com/tcb)
2. 创建新环境
3. 上传云函数代码
4. 配置环境变量
5. 部署并发布

## 配置说明

### 必需配置

1. **云开发环境 ID**
   ```javascript
   // pages/index/index.js
   wx.cloud.init({
     env: 'your-env-id',  // ← 替换为你的环境ID
     traceUser: true
   });
   ```

2. **百度千帆 API Key**（可选，用于真实 AI 计算）
   ```json
   // cloudbaserc.json
   {
     "functions": [{
       "name": "calculateKinship",
       "config": {
         "environment": {
           "BAIDU_QIANFAN_API_KEY": "your-api-key"
         }
       }
     }]
   }
   ```

## 性能优化

小程序版本进行了多项性能优化：

1. **懒加载**：使用 `lazyCodeLoading: requiredComponents`
2. **Canvas 优化**：
   - 使用 2D Canvas 类型
   - 考虑像素比 (DPR)
   - 局部重绘
3. **数据绑定优化**：减少不必要的 setData 调用
4. **云函数缓存**：可在云函数中实现结果缓存

## 与原版本的差异

| 特性 | 原 Web 版 | 小程序版 | 说明 |
|-----|----------|---------|-----|
| 图表库 | D3.js | Canvas 2D | 功能等效 |
| 构建工具 | Vite | 微信开发者工具 | 无需配置 |
| 状态管理 | React Hooks | 小程序数据绑定 | 逻辑相同 |
| 样式方案 | Tailwind CSS | WXSS | 效果一致 |
| API 调用 | fetch | wx.cloud | 更安全 |
| 部署方式 | Vercel | 微信云开发 | 国内访问更快 |

## 后续优化建议

1. **添加更多关系快捷按钮**
2. **实现历史记录功能**（使用云数据库）
3. **添加分享功能**（生成关系图卡片）
4. **优化图谱算法**（更平滑的动画效果）
5. **添加语音输入支持**

## 技术支持

如有问题，请参考：
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [百度千帆 API 文档](https://cloud.baidu.com/doc/WENXINWORKSHOP/s/klnt7ub2v)
