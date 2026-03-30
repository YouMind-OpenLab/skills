#!/usr/bin/env python3
"""
Fetch trending hotspots from multiple Chinese platforms.
Aggregates: Weibo, Toutiao, Baidu.

Usage:
    python3 fetch_hotspots.py --limit 30
"""

import argparse
import json
import logging
import time
from datetime import datetime

import requests

logger = logging.getLogger(__name__)

# 默认请求头
DEFAULT_HEADERS = {"User-Agent": "Mozilla/5.0"}

# 重试配置：最多尝试3次，退避间隔1s/2s/4s
MAX_RETRIES = 3
BACKOFF_SECONDS = [1, 2, 4]
REQUEST_TIMEOUT = 15


def fetch_with_retry(url, headers=None, timeout=REQUEST_TIMEOUT):
    """带重试和指数退避的请求辅助函数。

    尝试最多 MAX_RETRIES 次，每次失败后按 BACKOFF_SECONDS 等待。
    成功时返回解析后的 JSON；全部失败时返回 None。
    """
    if headers is None:
        headers = DEFAULT_HEADERS

    last_exc = None
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, headers=headers, timeout=timeout)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            last_exc = e
            if attempt < MAX_RETRIES - 1:
                wait = BACKOFF_SECONDS[attempt]
                logger.warning(
                    "请求 %s 第%d次失败: %s，%d秒后重试",
                    url, attempt + 1, e, wait,
                )
                time.sleep(wait)

    logger.error("请求 %s 全部%d次尝试均失败: %s", url, MAX_RETRIES, last_exc)
    return None


def fetch_weibo(limit=30):
    """Fetch Weibo hot search."""
    data = fetch_with_retry("https://weibo.com/ajax/side/hotSearch")
    if data is None:
        return []

    try:
        realtime = data.get("data", {}).get("realtime", [])
        if not isinstance(realtime, list):
            logger.warning("微博返回数据结构异常: 'realtime' 不是列表")
            return []

        items = []
        for item in realtime[:limit]:
            word = item.get("word", "")
            items.append({
                "title": word,
                "hotness": item.get("num", 0),
                "source": "weibo",
                "url": f"https://s.weibo.com/weibo?q={word}",
            })
        return items
    except Exception as e:
        logger.warning("解析微博数据失败: %s", e)
        return []


def fetch_toutiao(limit=30):
    """Fetch Toutiao hot board."""
    data = fetch_with_retry(
        "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc"
    )
    if data is None:
        return []

    try:
        board = data.get("data", [])
        if not isinstance(board, list):
            logger.warning("头条返回数据结构异常: 'data' 不是列表")
            return []

        items = []
        for item in board[:limit]:
            items.append({
                "title": item.get("Title", ""),
                "hotness": item.get("HotValue", 0),
                "source": "toutiao",
                "url": item.get("Url", ""),
            })
        return items
    except Exception as e:
        logger.warning("解析头条数据失败: %s", e)
        return []


def fetch_baidu(limit=30):
    """Fetch Baidu hot search."""
    data = fetch_with_retry(
        "https://top.baidu.com/api/board?platform=wise&tab=realtime"
    )
    if data is None:
        return []

    try:
        cards = data.get("data", {}).get("cards", [])
        if not isinstance(cards, list) or not cards:
            logger.warning("百度返回数据结构异常: 'cards' 为空或不是列表")
            return []

        content = cards[0].get("content", [])
        if not isinstance(content, list):
            logger.warning("百度返回数据结构异常: 'content' 不是列表")
            return []

        items = []
        for item in content[:limit]:
            items.append({
                "title": item.get("word", ""),
                "hotness": int(item.get("hotScore", 0)),
                "source": "baidu",
                "url": item.get("url", ""),
            })
        return items
    except Exception as e:
        logger.warning("解析百度数据失败: %s", e)
        return []


def deduplicate(items):
    """Remove duplicates by title similarity."""
    seen = set()
    result = []
    for item in items:
        key = item["title"].strip().lower()
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result


def main():
    parser = argparse.ArgumentParser(description="Fetch trending hotspots from Chinese platforms")
    parser.add_argument("--limit", type=int, default=30, help="Max items per source")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=__import__("sys").stderr,
    )

    all_items = []
    all_items.extend(fetch_weibo(args.limit))
    all_items.extend(fetch_toutiao(args.limit))
    all_items.extend(fetch_baidu(args.limit))

    all_items = deduplicate(all_items)
    all_items.sort(key=lambda x: int(x.get("hotness", 0) or 0), reverse=True)

    output = {
        "timestamp": datetime.now().isoformat(),
        "sources": ["weibo", "toutiao", "baidu"],
        "count": len(all_items),
        "items": all_items,
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
