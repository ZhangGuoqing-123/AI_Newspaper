# 硅谷速递 · Agent 流水线

把爬来的 Twitter 资讯，自动做成个性化多模态日报的 agent。对应面试讲法见 `../docs/项目深挖讲法.md`。

## 流程

```
解析 txt
  → [本地] 预过滤（去低信噪转发、近似去重、按热度裁到 80 条候选）
  → [DeepSeek agent ①] 选题：从候选里精选最重要的 N 条，去重话题排序
  → [Kimi] 摘要生成日报 + 改写口播稿
  → [DeepSeek agent ②] 质检自检：打分，不达标带问题反馈重做（最多 max_redo 次）
  → [edge-tts] 出音频（故事级缓存，同脚本不重复合成）
  → [--media]  小硅屏幕脸+声波驱动，本地合成口播视频（零成本）
  → [--images] Kimi 提炼封面 prompt → SiliconFlow FLUX 生图
  → [--publish] 写入 Supabase（日报 + 播报表）
```

> **两个 DeepSeek agent 均可在无 key 时优雅跳过**，不阻断日报和音频产出。

## 模型分工（按任务选最优）

| 任务 | 模型 | 备注 |
|---|---|---|
| 选题 agent（碰撞①）| DeepSeek | 从候选挑最重要 N 条，无 key 跳过 |
| 质检 agent（碰撞②）| DeepSeek | 打分、指出问题、触发重做，无 key 跳过 |
| 摘要 / 口播稿 | Kimi K2.5 | 实测多模型后选定，中文文笔最佳 |
| 封面图 prompt | Kimi | 从日报提炼英文 prompt，无 key 本地提取 |
| 生封面图 | FLUX.1-schnell（SiliconFlow）| 有免费额度，`--images` 触发 |
| 数字人视频 | 本地代码 | 屏幕脸+声波驱动，零成本零 API，`--media` 触发 |
| 语音合成 | edge-tts | 免费免 key |

## 跑起来

```powershell
cd pipeline
pip install -r requirements.txt
Copy-Item .env.example .env      # 然后把真实 key 填进 .env
python test_apis.py              # 连通性自检
python run.py "C:\...\tweets_original\2026-04-14.txt"   # 跑一天的日报
```

产物在 `output/`：`<日期>.json`（日报+质检结论）、`output/audio/*.mp3`（口播音频）。

## 各文件

| 文件 | 作用 | 状态 |
|---|---|---|
| `parse_tweets.py` | 解析爬取的 txt | ✅ 真实数据验证通过 |
| `topic_select.py`（原 `select.py`，因与标准库 `select` 模块重名导致 httpx 报"Connection error"已改名）| 两段式：本地预过滤 + DeepSeek 选题 agent | ✅ 完整；`prefilter` + `select_stories` 都已接进 `run.py` |
| `summarize.py` | Kimi 摘要 + 口播稿 | 需 key |
| `judge.py` | DeepSeek 质检 agent（LLM-as-judge 自检闭环）| ✅ 完整；打分→反馈→重做，无 key 跳过 |
| `tts.py` | edge-tts 音频 + 故事级缓存（碰撞②）| 免费免 key |
| `run.py` | 日报生成主程序（agent 本体）| 需 key；已支持 `--media` 接多模态 |
| `generate_media.py` | SiliconFlow（FLUX.1-schnell）生封面图 | ✅ 完整实现，`--images` 触发；缓存同 prompt 不重复调 |
| `talking_head.py` | 小硅口播视频（屏幕脸+声波驱动）| ✅ 本地零成本，`--media` 触发 |
| `chat_agent.py` | **对话式情报助手**（DeepSeek Function Calling + while 循环）| ✅ 已跑通，见下方说明 |
| `digest_subagent.py` | 日报生成子 agent（封装 `run.py` 整条链路）| 仅独立运行；已从 `chat_agent.py` 工具集摘除 |

> 封面图：`python run.py "某天.txt" --images`（需在 `.env` 配 `SILICONFLOW_API_KEY`）。
> 口播视频：`python run.py "某天.txt" --media`（纯本地，无 key 要求）。
> 全套：`python run.py "某天.txt" --media --images`。
> 各步骤失败不中断主流程，日报+音频始终产出。

## 待办

- [ ] 跑出真实指标填进讲法文档：过滤比、单条成本、缓存命中率等
- [ ] 生产级 TTS 想更自然可换 MiniMax / 火山
- [ ] 自部署 TTS（CosyVoice / GPT-SoVITS）给小硅克隆专属音色（Colab 免费 GPU）
