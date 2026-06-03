"""LLM 封装：按任务选模型——决策用 DeepSeek，中文生成用 Kimi。

两家都是 OpenAI 兼容接口，用同一个 openai SDK，只是 base_url / model 不同。
key 从 pipeline/.env 读取，绝不硬编码。
"""
from __future__ import annotations

import os
import json
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")


def _client(key_env: str, base_env: str):
    from openai import OpenAI
    key = os.getenv(key_env)
    if not key:
        raise RuntimeError(f"缺少 {key_env}，请在 pipeline/.env 里配置")
    return OpenAI(api_key=key, base_url=os.getenv(base_env))


def deepseek():
    """决策模型：选题 / 排序 / 质检。"""
    return _client("DEEPSEEK_API_KEY", "DEEPSEEK_BASE_URL"), os.getenv("DEEPSEEK_MODEL", "deepseek-chat")


def kimi():
    """中文生成模型：摘要 / 口播稿（实测多模型后选定）。"""
    return _client("KIMI_API_KEY", "KIMI_BASE_URL"), os.getenv("KIMI_MODEL", "kimi-k2-0711-preview")


def chat(client_model, system: str, user: str, json_mode: bool = False,
         max_tokens: int = 2000, temperature: float = 0.3) -> str:
    client, model = client_model
    kwargs = dict(
        model=model,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}],
        max_tokens=max_tokens,
        temperature=temperature,
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content


def chat_json(client_model, system: str, user: str, **kw) -> dict:
    """要求模型返回 JSON 并解析。"""
    txt = chat(client_model, system, user, json_mode=True, **kw)
    try:
        return json.loads(txt)
    except json.JSONDecodeError:
        # 个别模型会裹 ```json ```，剥一下
        cleaned = txt.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(cleaned)
