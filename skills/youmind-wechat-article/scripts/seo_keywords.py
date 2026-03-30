#!/usr/bin/env python3
"""
SEO keyword research via search suggestion APIs.

Usage:
    python3 seo_keywords.py --json "AI Agent" "大模型" "效率工具"
"""

import argparse
import json
import logging
import sys
import time
from urllib.parse import quote

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

_DEFAULT_HEADERS = {"User-Agent": "Mozilla/5.0"}
_MAX_RETRIES = 3
_BACKOFF_BASE = 1.0  # 首次重试等待秒数
_RATE_LIMIT_DELAY = 0.5  # API 调用间隔（秒）


def fetch_with_retry(url, *, retries=_MAX_RETRIES, backoff=_BACKOFF_BASE):
    """带指数退避的 HTTP GET 请求，最多重试 retries 次。"""
    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(
                url,
                headers=_DEFAULT_HEADERS,
                timeout=5,
            )
            resp.raise_for_status()
            return resp
        except requests.RequestException as exc:
            last_exc = exc
            if attempt < retries:
                wait = backoff * (2 ** (attempt - 1))
                logger.warning(
                    "请求失败 (第 %d/%d 次): %s — %.1f 秒后重试",
                    attempt,
                    retries,
                    exc,
                    wait,
                )
                time.sleep(wait)
            else:
                logger.error(
                    "请求最终失败 (共 %d 次): %s — %s",
                    retries,
                    url,
                    exc,
                )
    raise last_exc


def baidu_suggestions(keyword):
    """Get Baidu search suggestions as volume proxy."""
    try:
        resp = fetch_with_retry(
            f"https://suggestion.baidu.com/su?wd={quote(keyword)}&action=opensearch",
        )
        data = resp.json()

        # 验证响应结构：OpenSearch 格式应为列表，第二项为建议列表
        if not isinstance(data, list) or len(data) < 2:
            logger.warning("百度建议接口返回格式异常: %s", type(data).__name__)
            return {"source": "baidu", "suggestions": [], "count": 0}

        suggestions = data[1] if isinstance(data[1], list) else []
        return {
            "source": "baidu",
            "suggestions": suggestions[:8],
            "count": len(suggestions),
        }
    except requests.RequestException as exc:
        logger.error("百度建议接口请求失败 [%s]: %s", keyword, exc)
        return {"source": "baidu", "suggestions": [], "count": 0}
    except (ValueError, KeyError, TypeError) as exc:
        logger.error("百度建议接口解析失败 [%s]: %s", keyword, exc)
        return {"source": "baidu", "suggestions": [], "count": 0}


def so_suggestions(keyword):
    """Get 360 search suggestions."""
    try:
        resp = fetch_with_retry(
            f"https://sug.so.360.cn/suggest?word={quote(keyword)}"
            f"&encodein=utf-8&encodeout=utf-8&format=json",
        )
        data = resp.json()

        # 验证响应结构：应包含 "result" 列表
        if not isinstance(data, dict):
            logger.warning("360 建议接口返回格式异常: %s", type(data).__name__)
            return {"source": "360", "suggestions": [], "count": 0}

        items = data.get("result")
        if not isinstance(items, list):
            logger.warning("360 建议接口缺少 result 字段或类型错误")
            return {"source": "360", "suggestions": [], "count": 0}

        suggestions = [
            item.get("word", "") for item in items if isinstance(item, dict)
        ]
        return {
            "source": "360",
            "suggestions": suggestions[:8],
            "count": len(suggestions),
        }
    except requests.RequestException as exc:
        logger.error("360 建议接口请求失败 [%s]: %s", keyword, exc)
        return {"source": "360", "suggestions": [], "count": 0}
    except (ValueError, KeyError, TypeError) as exc:
        logger.error("360 建议接口解析失败 [%s]: %s", keyword, exc)
        return {"source": "360", "suggestions": [], "count": 0}


def score_keyword(keyword):
    """Score a keyword's SEO potential (0-10)."""
    baidu = baidu_suggestions(keyword)
    time.sleep(_RATE_LIMIT_DELAY)  # API 调用间隔限速
    so = so_suggestions(keyword)
    time.sleep(_RATE_LIMIT_DELAY)

    baidu_score = min(10, baidu["count"] * 1.2)
    so_score = min(10, so["count"] * 1.5)
    seo_score = round((baidu_score * 0.6 + so_score * 0.4), 1)

    all_suggestions = list(set(baidu["suggestions"] + so["suggestions"]))

    return {
        "keyword": keyword,
        "seo_score": seo_score,
        "baidu_score": round(baidu_score, 1),
        "so_score": round(so_score, 1),
        "related_keywords": all_suggestions[:10],
    }


def main():
    parser = argparse.ArgumentParser(description="SEO keyword analysis")
    parser.add_argument("keywords", nargs="+", help="Keywords to analyze")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    results = [score_keyword(kw) for kw in args.keywords]

    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for r in results:
            print(f"\n  {r['keyword']}")
            print(f"    SEO Score: {r['seo_score']}/10")
            print(f"    Baidu: {r['baidu_score']}, 360: {r['so_score']}")
            print(f"    Related: {', '.join(r['related_keywords'][:5])}")


if __name__ == "__main__":
    main()
