"""日报 + 口播稿（Kimi-k2.5）。

- make_digest：用【用户真实的 prompt】把推文/文章生成分类中文日报（与线上 Dify 里同一套 prompt）
- to_script：把日报改写成适合数字人/TTS 念的口播稿（口语化、短句）

注意：日报 prompt 原样保留用户的版本，不要随意改动——这是用户迭代过的成果。
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from parse_tweets import Tweet  # noqa: E402
from llm import kimi, chat      # noqa: E402

# ===== 用户的真实日报 prompt（与线上一致，勿改）=====
DIGEST_PROMPT = """这是从twitter上爬下来的硅谷大佬发的推文和一些网站上爬下来的和AI有关的文章。请你把这些内容生成一份AI日报供AI爱好者了解当天硅谷发生了什么。
要求：1、可读性强，结构明确逻辑清晰，翻译得不能拗口该跨文化转译的要转译清楚，不能让中国人看不懂，重点突出不能读起来像流水账，相同内容合并重组，合并以后影响可读性的可以在最后单开一个"今日其他值得关注的内容"板块，都放在这块，不要硬融入前文影响可读性，可读性是第一档要求，字数不限但不要太多，毕竟是份日报。不要写长难句，尽量写短句，一句一个信息点。例如：SpaceX 官方今日宣布，其内部 AI 部门 SpaceXAI 已与 AI 编程工具 Cursor 展开战略合作，目标是打造全球最强的代码与知识工作 AI。此次合作将 Cursor 在专业开发者中的产品力与分发网络，与 SpaceX 拥有百万张 H100 等效算力的 Colossus 超算集群深度结合。协议中披露了一项重磅商业条款：Cursor 已授予 SpaceX 在今年晚些时候以 600 亿美元收购该公司的选择权，或为此次联合研发支付 100 亿美元。Cursor 联合创始人 Michael Truell 确认了该合作，称这是其构建最佳 AI 编程环境的关键一步。要写成这样的短句：SpaceX和Cursor官宣合作，要一起做"全球最强编程AI"——SpaceX出算力，Cursor出产品和用户。协议里藏了个重磅条款：SpaceX今年晚些时候可以600亿美元收购Cursor，或者直接付100亿买合作成果。2、不要捏造没有的信息。3、不要曲解原文的意思，忠于原文想表达的。4、不要丢核心信息。5、过滤掉和AI、科技无关的内容。6、重要内容放前边。比如新模型发布、行业动态、产品动态，这些和商业、产品有关的放前边，学术、技术相关的放后边。6、不要用#和*等任何符号，每个大的主题前边加一个图标"""


def _format_tweets(tweets: list[Tweet]) -> str:
    lines = []
    for t in tweets:
        block = f"【{t.account}】{t.text}"
        if t.quoted:
            block += f"\n（原帖：{t.quoted}）"
        lines.append(block)
    return "\n\n".join(lines)


def make_digest(tweets: list[Tweet]) -> str:
    """生成分类中文日报（纯文本，用户的格式）。"""
    user = DIGEST_PROMPT + "\n\n以下是今天的内容：\n\n" + _format_tweets(tweets)
    return chat(kimi(), system="你是硅谷速递的资深中文编辑。", user=user,
                max_tokens=4000, temperature=0.4)


def to_script(digest: str) -> str:
    """把日报改写成数字人/TTS 口播稿。"""
    system = "你是把书面日报改写成口播稿的编辑。"
    user = (
        "把下面这份 AI 日报改写成一段【数字人口播稿】，要求：\n"
        "- 口语化、自然流畅，像主播在讲，不是念列表\n"
        "- 短句为主，一句一个信息点\n"
        "- 开头一句问候+今天看点，结尾一句收束\n"
        "- 英文术语处理好读音（如 GPT-5 读作 GPT 五，Claude 等保留）\n"
        "- 控制在 250-400 字（约 1-2 分钟）\n"
        "- 纯文本，不要任何符号、序号、图标\n\n"
        f"日报内容：\n{digest}"
    )
    return chat(kimi(), system=system, user=user, max_tokens=1500, temperature=0.5)
