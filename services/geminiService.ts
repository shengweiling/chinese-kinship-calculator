import OpenAI from "openai";
import { KinshipResult } from "../types";

// Configuration for Baidu Qianfan via OpenAI SDK compatibility
const client = new OpenAI({
  apiKey: import.meta.env.VITE_BAIDU_QIANFAN_API_KEY || process.env.VITE_BAIDU_QIANFAN_API_KEY,
  baseURL: 'https://qianfan.baidubce.com/v2',
  dangerouslyAllowBrowser: true // Required since we are calling from the browser
});

export const calculateKinship = async (input: string): Promise<KinshipResult> => {
  const systemPrompt = `
    你是一位精通中国传统亲戚关系和称呼的专家。
    你的任务是分析用户输入的亲戚关系链，准确计算出最终的称呼，并生成计算步骤和关系图谱数据。

    核心规则：
    1. 默认从“我”的角度出发进行计算。
    2. 对于直系亲属和常见旁系亲属，使用标准准确称呼（如：舅舅、表妹、姨父）。
    3. **强制单一称呼原则（重要）**：
       - 'finalTitle' 字段**绝对禁止**包含“的”字（如“表姐夫的哥哥”是错误的，必须修正）。
       - 必须将描述性关系转化为社交场景下的**单一直接称呼**。
       - **转化指南**：
         - 复杂姻亲同辈（如配偶的兄弟姐妹、堂表亲的配偶的兄弟姐妹） -> 统称为“哥哥”、“姐姐”、“弟弟”或“妹妹”（视年龄而定，若无法确定年龄默认用尊称“哥哥/姐姐”）。
         - 复杂长辈 -> 统称为“叔叔”、“伯伯”或“阿姨”。
         - 复杂晚辈 -> 统称为“侄子”、“外甥”或提示“直呼其名”。
       - 例子：输入“妻子的姐姐的丈夫的哥哥”，不能输出“大姨姐的丈夫的哥哥”，应输出“哥哥”或“连襟的哥哥”（如果连襟的哥哥也叫哥）。最通用的口语是“哥哥”。
    4. “爸爸的妻子”在没有特定继母语境下，应默认视为“妈妈”。
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

  try {
    const response = await client.chat.completions.create({
      model: "ernie-4.5-turbo-128k",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请分析这个亲戚关系："${input}"，并返回 JSON 结果。` }
      ],
      temperature: 0.3, // Lower temperature slightly to stick to rules, but keeping enough for logic
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("No content received from AI");
    }

    // Clean potential markdown code blocks if the model adds them despite instructions
    const jsonString = content.replace(/```json\n?|\n?```/g, "").trim();

    return JSON.parse(jsonString) as KinshipResult;

  } catch (error) {
    console.error("Error calculating kinship with Baidu:", error);
    throw error;
  }
};