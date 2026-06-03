"""解析爬取的 Twitter txt（每个文件是一天的推文）。

txt 格式：
    日期: 2026-04-14  共 61 条
    ====...====
    【账号】@handle  【类型】转发/原创推文/引用推文
    【时间】2026-04-14 00:10
    【点赞】0  【转发】104  【回复】0  【浏览】2
    【正文】
    正文多行...
    【转发的原帖】/【引用的帖子】 作者/时间/内容（可选）
    ====...====

用法：
    python parse_tweets.py "路径/2026-04-14.txt"        # 解析单个文件，打印概览
    python parse_tweets.py --dir "路径/tweets_original"  # 批量解析整个文件夹
"""
from __future__ import annotations

import re
import sys
import json
from pathlib import Path
from dataclasses import dataclass, asdict, field

# Windows 控制台默认 GBK，强制 UTF-8 输出，避免中文/符号乱码或报错
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


@dataclass
class Tweet:
    account: str          # 账号 handle，如 @_akhaliq
    kind: str             # 类型：原创推文 / 转发 / 引用推文
    time: str             # 发布时间
    likes: int            # 点赞
    retweets: int         # 转发
    replies: int          # 回复
    views: int            # 浏览
    text: str             # 正文
    quoted: str = ""      # 转发/引用的原帖内容（如有）
    date: str = ""        # 来源文件日期

    @property
    def engagement(self) -> int:
        """简单热度分：点赞权重最高，转发其次，浏览兜底。用于预过滤排序。"""
        return self.likes * 3 + self.retweets * 2 + self.replies + self.views // 1000


_SEP = re.compile(r"={10,}")
_RE_ACCOUNT = re.compile(r"【账号】\s*(\S+)")
_RE_KIND = re.compile(r"【类型】\s*(\S+)")
_RE_TIME = re.compile(r"【时间】\s*([\d\-:\s]+?)\s*$", re.M)
_RE_STATS = re.compile(r"【点赞】\s*(\d+)\s*【转发】\s*(\d+)\s*【回复】\s*(\d+)\s*【浏览】\s*(\d+)")


def _extract_body(block: str) -> tuple[str, str]:
    """从一个 block 里抽出正文，以及转发/引用的原帖内容（如有）。"""
    idx = block.find("【正文】")
    if idx == -1:
        return "", ""
    rest = block[idx + len("【正文】"):]
    # 正文到下一个 【转发的原帖】/【引用的帖子】 或 block 结尾为止
    quoted = ""
    m = re.search(r"【(?:转发的原帖|引用的帖子)】", rest)
    if m:
        body = rest[: m.start()]
        quoted_block = rest[m.end():]
        qm = re.search(r"内容[:：]\s*(.+)", quoted_block, re.S)
        quoted = qm.group(1).strip() if qm else quoted_block.strip()
    else:
        body = rest
    return body.strip(), quoted.strip()


def parse_text(text: str, date: str = "") -> list[Tweet]:
    tweets: list[Tweet] = []
    for block in _SEP.split(text):
        block = block.strip()
        if not block or block.startswith("日期:"):
            continue
        acc = _RE_ACCOUNT.search(block)
        if not acc:
            continue
        kind = _RE_KIND.search(block)
        tm = _RE_TIME.search(block)
        stats = _RE_STATS.search(block)
        body, quoted = _extract_body(block)
        likes, rts, reps, views = (
            (int(stats.group(1)), int(stats.group(2)), int(stats.group(3)), int(stats.group(4)))
            if stats else (0, 0, 0, 0)
        )
        tweets.append(Tweet(
            account=acc.group(1),
            kind=kind.group(1) if kind else "",
            time=tm.group(1).strip() if tm else "",
            likes=likes, retweets=rts, replies=reps, views=views,
            text=body, quoted=quoted, date=date,
        ))
    return tweets


def parse_file(path: str | Path) -> list[Tweet]:
    path = Path(path)
    date = path.stem  # 文件名即日期
    return parse_text(path.read_text(encoding="utf-8"), date=date)


def _overview(tweets: list[Tweet]) -> None:
    print(f"解析到 {len(tweets)} 条推文")
    by_kind: dict[str, int] = {}
    for t in tweets:
        by_kind[t.kind] = by_kind.get(t.kind, 0) + 1
    print("按类型：", by_kind)
    print("\n热度 Top 3（点赞×3+转发×2+回复+浏览/1000）：")
    for t in sorted(tweets, key=lambda x: x.engagement, reverse=True)[:3]:
        snippet = t.text.replace("\n", " ")[:80]
        print(f"  [{t.engagement:>6}] {t.account} ({t.kind}) 赞{t.likes} 转{t.retweets} 览{t.views}")
        print(f"          {snippet}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(0)

    if args[0] == "--dir":
        folder = Path(args[1])
        files = sorted(folder.glob("*.txt"))
        total = 0
        for f in files:
            n = len(parse_file(f))
            total += n
            print(f"{f.name}: {n} 条")
        print(f"\n共 {len(files)} 个文件，{total} 条推文")
    else:
        tweets = parse_file(args[0])
        _overview(tweets)
