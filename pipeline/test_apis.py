"""连通性自检：确认 .env 里的 key 能用，再往上搭流水线。

用法：
    1) 先 `pip install -r requirements.txt`
    2) 复制 .env.example 为 .env，填入你的真实 key
    3) python test_apis.py
"""
from __future__ import annotations

import os
import sys
import asyncio
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")


def _has(key: str) -> bool:
    v = os.getenv(key, "")
    return bool(v) and not v.startswith("sk-xxxx") and not v.startswith("xxxx")


def check_chat(name: str, key_env: str, base_url_env: str, model_env: str, default_model: str) -> None:
    if not _has(key_env):
        print(f"[跳过] {name}：未在 .env 配置 {key_env}")
        return
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv(key_env), base_url=os.getenv(base_url_env))
    model = os.getenv(model_env, default_model)
    try:
        r = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "用一句话证明你在线"}],
            max_tokens=50,
        )
        print(f"[OK]  {name}（{model}）：{r.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"[失败] {name}（{model}）：{e}")
        print(f"       ↳ 如果是模型名错误，去 {name} 控制台看真实模型 id，改 .env 里的 {model_env}")


async def check_edge_tts() -> None:
    try:
        import edge_tts
        out = Path(__file__).parent / "output"
        out.mkdir(exist_ok=True)
        f = out / "_tts_test.mp3"
        await edge_tts.Communicate("语音合成连通性测试，硅谷速递。", "zh-CN-XiaoxiaoNeural").save(str(f))
        print(f"[OK]  edge-tts：已生成测试音频 {f}（免费、无需 key）")
    except Exception as e:
        print(f"[失败] edge-tts：{e}")


def check_dream() -> None:
    # 仅检查 key 是否就位；具体生图/视频接口在搭生成环节时再接
    if _has("DREAM_API_KEY"):
        print("[OK]  DreamAPI：key 已配置（生图/视频接口在生成环节接入）")
    else:
        print("[跳过] DreamAPI：未在 .env 配置 DREAM_API_KEY")


def main() -> None:
    print("=== 连通性自检 ===")
    check_chat("Kimi", "KIMI_API_KEY", "KIMI_BASE_URL", "KIMI_MODEL", "kimi-k2-0711-preview")
    check_chat("DeepSeek", "DEEPSEEK_API_KEY", "DEEPSEEK_BASE_URL", "DEEPSEEK_MODEL", "deepseek-chat")
    check_dream()
    asyncio.run(check_edge_tts())
    print("\n全部 [OK] 就可以往上搭选题/摘要/生成了。任何 [失败] 把整行发我。")


if __name__ == "__main__":
    main()
