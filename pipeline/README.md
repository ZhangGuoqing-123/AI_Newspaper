# 硅谷速递 · Agent 流水线

把爬来的 Twitter 资讯，自动做成个性化多模态日报的 agent。对应面试讲法见 `../docs/项目深挖讲法.md`。

## 流程

```
解析 txt → 预过滤+DeepSeek选题（碰撞①）→ Kimi摘要+口播稿
        → DeepSeek质检，不达标自动重做（自检闭环 = agent）
        → edge-tts 出音频（故事级缓存 = 碰撞②）
        → [--media]  小硅屏幕脸+声波驱动，本地合成口播视频（零成本）
        → [--images] SiliconFlow 生成日报封面图（免费额度）
```

## 模型分工（按任务选最优）

| 任务 | 模型 |
|---|---|
| 选题 / 排序 / 质检 | DeepSeek |
| 摘要 / 口播稿（中文文笔）| Kimi K2.5（实测多模型后选定）|
| 生封面图 | FLUX.1-schnell（SiliconFlow，有免费额度）|
| 数字人视频 | 本地代码（屏幕脸+声波驱动，零成本零 API）|
| 语音合成 | edge-tts（免费免 key）|

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
| `select.py` | 预过滤 + DeepSeek 选题（碰撞①）| ✅ 预过滤已验证；选题需 key |
| `summarize.py` | Kimi 摘要 + 口播稿 | 需 key |
| `judge.py` | DeepSeek 质检（自检闭环）| ✅ 已接进 `run.py`：不达标带问题反馈重做，最多 `--max-redo` 次（默认 2）；无 key 自动跳过 |
| `tts.py` | edge-tts 音频 + 故事级缓存（碰撞②）| 免费免 key |
| `run.py` | 编排主程序（agent 本体）| 需 key；已支持 `--media` 接多模态 |
| `generate_media.py` | SiliconFlow（FLUX.1-schnell）生封面图 | ✅ 完整实现，`--images` 触发；缓存同 prompt 不重复调 |
| `talking_head.py` | 小硅口播视频（屏幕脸+声波驱动）| ✅ 本地零成本，`--media` 触发 |

> 封面图：`python run.py "某天.txt" --images`（需在 `.env` 配 `SILICONFLOW_API_KEY`）。
> 口播视频：`python run.py "某天.txt" --media`（纯本地，无 key 要求）。
> 全套：`python run.py "某天.txt" --media --images`。
> 各步骤失败不中断主流程，日报+音频始终产出。

## 待办

- [ ] 跑出真实指标填进讲法文档：过滤比、单条成本、缓存命中率等
- [ ] 生产级 TTS 想更自然可换 MiniMax / 火山
- [ ] 自部署 TTS（CosyVoice / GPT-SoVITS）给小硅克隆专属音色（Colab 免费 GPU）
