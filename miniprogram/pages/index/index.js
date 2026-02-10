// 关系按钮配置
const RELATIONS = [
  { label: '父', value: '的爸爸' },
  { label: '母', value: '的妈妈' },
  { label: '夫', value: '的丈夫' },
  { label: '妻', value: '的妻子' },
  { label: '兄', value: '的哥哥' },
  { label: '弟', value: '的弟弟' },
  { label: '姐', value: '的姐姐' },
  { label: '妹', value: '的妹妹' },
  { label: '子', value: '的儿子' },
  { label: '女', value: '的女儿' },
];

// 加载环境配置
const config = require('../../config.js');

// 百度千帆 API 配置
const QIANFAN_CONFIG = {
  apiKey: config.QIANFAN_API_KEY,
  baseURL: config.QIANFAN_BASE_URL,
  model: config.QIANFAN_MODEL
};

// 系统提示词
const SYSTEM_PROMPT = `
你是一位精通中国传统亲戚关系和称呼的专家。
你的任务是分析用户输入的亲戚关系链，准确计算出最终的称呼，并生成计算步骤和关系图谱数据。

核心规则：
1. 默认从"我"的角度出发进行计算。
2. 对于直系亲属和常见旁系亲属，使用标准准确称呼（如：舅舅、表妹、姨父）。
3. **强制单一称呼原则（重要）**：
   - 'finalTitle' 字段**绝对禁止**包含"的"字（如"表姐夫的哥哥"是错误的，必须修正）。
   - 必须将描述性关系转化为社交场景下的**单一直接称呼**。
   - **转化指南**：
     - 复杂姻亲同辈（如配偶的兄弟姐妹、堂表亲的配偶的兄弟姐妹） -> 统称为"哥哥"、"姐姐"、"弟弟"或"妹妹"（视年龄而定，若无法确定年龄默认用尊称"哥哥/姐姐"）。
     - 复杂长辈 -> 统称为"叔叔"、"伯伯"或"阿姨"。
     - 复杂晚辈 -> 统称为"侄子"、"外甥"或提示"直呼其名"。
   - 例子：输入"妻子的姐姐的丈夫的哥哥"，不能输出"大姨姐的丈夫的哥哥"，应输出"哥哥"或"连襟的哥哥"（如果连襟的哥哥也叫哥）。最通用的口语是"哥哥"。
4. "爸爸的妻子"在没有特定继母语境下，应默认视为"妈妈"。
5. 分析过程必须拆解为清晰的步骤。

输出要求：
请严格返回合法的 JSON 对象，不要包含 Markdown 代码块（如 \`\`\`json ... \`\`\`）。

JSON 数据结构如下：
{
  "finalTitle": "最终的计算结果称呼 (String，不含'的'字)",
  "steps": [
    { 
      "step": "当前推算的这一步关系（例如：'妈妈的姐姐'）", 
      "result": "这一步得到的称呼（例如：'姨妈'）", 
      "explanation": "简短的逻辑解释" 
    }
  ],
  "graphData": {
    "nodes": [
      { "id": "唯一ID字符串", "label": "节点显示的称呼", "group": 0 (代表'我'), 1 (代表中间亲戚), 2 (代表最终结果) }
    ],
    "links": [
      { "source": "来源节点ID", "target": "目标节点ID", "label": "连线上的关系名称" }
    ]
  }
}
`;

Page({
  data: {
    // 系统信息
    statusBarHeight: 20,
    navHeight: 64,
    currentYear: new Date().getFullYear(),

    // 输入状态
    inputString: '',
    relations: RELATIONS,

    // 加载状态
    loading: false,
    error: null,

    // 结果状态
    result: null,
    showAnalysis: false,
    pageLocked: false,

    // 流程图数据
    flowchartNodes: [],
    flowchartLinks: []
  },

  onLoad() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navHeight = statusBarHeight + 44; // 44是导航栏高度

    this.setData({
      statusBarHeight,
      navHeight
    });
  },

  // 输入框变化
  onInputChange(e) {
    this.setData({
      inputString: e.detail.value
    });
  },

  // 添加关系
  handleAddRelation(e) {
    const value = e.currentTarget.dataset.value;
    let nextVal = value;

    // 如果是第一个输入，去掉开头的"的"
    if (this.data.inputString === '' && value.startsWith('的')) {
      nextVal = value.substring(1);
    }

    this.setData({
      inputString: this.data.inputString + nextVal
    });
  },

  // 回退
  handleBackspace() {
    const input = this.data.inputString;
    if (input.length === 0) return;

    // 尝试删除"的xx"模式（3个字符）
    const lastDe = input.lastIndexOf('的');
    if (lastDe !== -1 && lastDe === input.length - 3) {
      this.setData({
        inputString: input.substring(0, lastDe)
      });
    } else {
      this.setData({
        inputString: input.substring(0, input.length - 1)
      });
    }
  },

  // 清空
  handleClear() {
    this.setData({
      inputString: ''
    });
  },

  // 计算关系
  async handleCalculate() {
    if (!this.data.inputString.trim()) return;

    this.setData({
      loading: true,
      error: null,
      result: null,
      showAnalysis: false
    });

    try {
      const result = await this.calculateKinship(this.data.inputString);
      this.setData({
        result,
        loading: false
      });
    } catch (err) {
      console.error('计算错误:', err);
      this.setData({
        error: '无法识别该关系或网络连接错误，请检查输入后重试。',
        loading: false
      });
    }
  },

  // 调用百度千帆 API 计算关系
  calculateKinship(input) {
    return new Promise((resolve, reject) => {
      // 检查 API Key 是否配置
      if (QIANFAN_CONFIG.apiKey === 'YOUR_API_KEY') {
        reject(new Error('请先配置百度千帆 API Key'));
        return;
      }

      wx.request({
        url: `${QIANFAN_CONFIG.baseURL}/chat/completions`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${QIANFAN_CONFIG.apiKey}`
        },
        data: {
          model: QIANFAN_CONFIG.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `请分析这个亲戚关系："${input}"，并返回 JSON 结果。` }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            try {
              const content = res.data.choices && res.data.choices[0] && res.data.choices[0].message && res.data.choices[0].message.content;
              if (!content) {
                throw new Error('API 返回数据格式错误');
              }
              // 清理可能的 Markdown 代码块
              const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
              const result = JSON.parse(jsonString);
              resolve(result);
            } catch (err) {
              console.error('解析 API 响应失败:', err);
              reject(new Error('解析结果失败，请重试'));
            }
          } else {
            console.error('API 调用失败:', res);
            reject(new Error(`API 调用失败: ${res.statusCode || '未知错误'}`));
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      });
    });
  },

  // 切换分析显示
  toggleAnalysis() {
    const newShowAnalysis = !this.data.showAnalysis;
    this.setData({
      showAnalysis: newShowAnalysis,
      pageLocked: newShowAnalysis
    });

    if (newShowAnalysis && this.data.result && this.data.result.graphData) {
      this.initFlowchart();
    }
  },

  // 初始化流程图
  initFlowchart() {
    const graphData = this.data.result.graphData;
    if (!graphData || !graphData.nodes || !graphData.links) return;

    // 按 group 排序节点（0:我, 1:中间, 2:结果）
    const sortedNodes = [...graphData.nodes].sort((a, b) => a.group - b.group);

    // 构建连线映射
    const linkMap = {};
    graphData.links.forEach(link => {
      linkMap[link.source] = link;
    });

    // 按节点顺序获取对应的连线
    const sortedLinks = [];
    sortedNodes.forEach((node, index) => {
      if (index < sortedNodes.length - 1) {
        const link = linkMap[node.id];
        if (link) {
          sortedLinks.push(link);
        } else {
          // 如果没有找到连线，添加一个默认连线
          sortedLinks.push({ label: '的' });
        }
      }
    });

    this.setData({
      flowchartNodes: sortedNodes,
      flowchartLinks: sortedLinks
    });
  }
});


