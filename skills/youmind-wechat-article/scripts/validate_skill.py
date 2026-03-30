#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_PATHS = [
    "SKILL.md",
    "README.md",
    "config.example.yaml",
    "references/cli-reference.md",
    "references/frameworks.md",
    "references/operations.md",
    "references/pipeline.md",
    "references/seo-rules.md",
    "references/skill-maintenance.md",
    "references/topic-selection.md",
    "references/visual-prompts.md",
    "references/writing-guide.md",
    "references/youmind-integration.md",
    "scripts/fetch_hotspots.py",
    "scripts/seo_keywords.py",
    "toolkit/package.json",
    "toolkit/src/build-playbook.ts",
    "toolkit/src/cli.ts",
    "toolkit/src/fetch-stats.ts",
    "toolkit/src/image-gen.ts",
    "toolkit/src/learn-edits.ts",
    "toolkit/src/youmind-api.ts",
    "clients/demo/style.yaml",
    "clients/demo/history.yaml",
    "agents/openai.yaml",
]

REQUIRED_SKILL_HEADINGS = [
    "## Skill Directory",
    "## Critical Quality Rules",
    "## Pipeline Overview",
    "## Gotchas",
]

REQUIRED_PACKAGE_SCRIPTS = [
    "build",
    "dev",
    "preview",
    "publish",
    "themes",
    "colors",
    "theme-preview",
    "image-gen",
    "youmind-api",
    "fetch-stats",
    "learn-edits",
    "build-playbook",
    "validate-skill",
]

README_MUST_MENTION = [
    "agents/openai.yaml",
    "scripts/validate_skill.py",
    "image-gen.ts",
    "youmind-api.ts",
    "fetch-stats.ts",
    "build-playbook.ts",
    "learn-edits.ts",
    "npm run validate-skill",
]

README_STALE_TOKENS = [
    "scripts/fetch_stats.py",
    "scripts/build_playbook.py",
    "scripts/learn_edits.py",
]

CLI_REFERENCE_TOKENS = [
    "dist/cli.js",
    "dist/image-gen.js",
    "dist/youmind-api.js",
    "dist/fetch-stats.js",
    "dist/learn-edits.js",
    "dist/build-playbook.js",
]

OPENAI_YAML_TOKENS = [
    "interface:",
    "display_name:",
    "short_description:",
    "default_prompt:",
]

PIPELINE_IMAGE_INTAKE_TOKENS = [
    "AskUserQuestion",
    "cover + inline images",
    "cover only",
    "inline only",
    "no images",
]


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    for rel_path in REQUIRED_PATHS:
        path = ROOT / rel_path
        if not path.exists():
            errors.append(f"Missing required path: {rel_path}")

    skill_text = read_text("SKILL.md", errors)
    if skill_text:
        check_frontmatter("SKILL.md", skill_text, errors)
        for heading in REQUIRED_SKILL_HEADINGS:
            if heading not in skill_text:
                errors.append(f"SKILL.md is missing heading: {heading}")

        line_count = len(skill_text.splitlines())
        if line_count > 220:
            warnings.append(
                f"SKILL.md is {line_count} lines; consider splitting content to preserve progressive disclosure."
            )

    readme_text = read_text("README.md", errors)
    if readme_text:
        for token in README_MUST_MENTION:
            if token not in readme_text:
                errors.append(f"README.md should mention: {token}")
        for token in README_STALE_TOKENS:
            if token in readme_text:
                errors.append(f"README.md still contains stale reference: {token}")
        if "npm run build" not in readme_text:
            warnings.append("README.md should recommend building the toolkit before using dist commands.")

    openai_yaml = read_text("agents/openai.yaml", errors)
    if openai_yaml:
        for token in OPENAI_YAML_TOKENS:
            if token not in openai_yaml:
                errors.append(f"agents/openai.yaml is missing token: {token}")

    cli_reference = read_text("references/cli-reference.md", errors)
    if cli_reference:
        for token in CLI_REFERENCE_TOKENS:
            if token not in cli_reference:
                errors.append(f"references/cli-reference.md should mention: {token}")

    pipeline_text = read_text("references/pipeline.md", errors)
    if pipeline_text:
        for token in PIPELINE_IMAGE_INTAKE_TOKENS:
            if token not in pipeline_text:
                errors.append(f"references/pipeline.md should mention image-intake token: {token}")

    package_json = read_json("toolkit/package.json", errors)
    if package_json is not None:
        scripts = package_json.get("scripts", {})
        if not isinstance(scripts, dict):
            errors.append("toolkit/package.json has a non-object scripts field.")
        else:
            for name in REQUIRED_PACKAGE_SCRIPTS:
                if name not in scripts:
                    errors.append(f"toolkit/package.json is missing npm script: {name}")

    referenced_paths = collect_local_doc_paths(
        [
            ROOT / "SKILL.md",
            ROOT / "README.md",
            ROOT / "references" / "pipeline.md",
            ROOT / "references" / "operations.md",
            ROOT / "references" / "skill-maintenance.md",
        ]
    )
    for doc_path, raw_path, resolved_path in referenced_paths:
        if not resolved_path.exists():
            errors.append(
                f"{doc_path.relative_to(ROOT)} references missing local path: {raw_path}"
            )

    print(f"Checked skill at: {ROOT}")
    for message in warnings:
        print(f"WARN  {message}")
    for message in errors:
        print(f"ERROR {message}")

    if errors:
        print(f"\nValidation failed with {len(errors)} error(s) and {len(warnings)} warning(s).")
        return 1

    print(f"Validation passed with {len(warnings)} warning(s).")
    return 0


def read_text(rel_path: str, errors: list[str]) -> str:
    path = ROOT / rel_path
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return ""
    except OSError as exc:
        errors.append(f"Unable to read {rel_path}: {exc}")
        return ""


def read_json(rel_path: str, errors: list[str]) -> dict | None:
    path = ROOT / rel_path
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as exc:
        errors.append(f"Invalid JSON in {rel_path}: {exc}")
        return None
    except OSError as exc:
        errors.append(f"Unable to read {rel_path}: {exc}")
        return None


def check_frontmatter(rel_path: str, text: str, errors: list[str]) -> None:
    match = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not match:
        errors.append(f"{rel_path} is missing YAML frontmatter.")
        return

    frontmatter = match.group(1)
    for field in ("name:", "description:"):
        if field not in frontmatter:
            errors.append(f"{rel_path} frontmatter is missing field: {field[:-1]}")


def collect_local_doc_paths(doc_paths: list[Path]) -> list[tuple[Path, str, Path]]:
    found: list[tuple[Path, str, Path]] = []
    seen: set[tuple[str, str]] = set()

    for doc_path in doc_paths:
        text = doc_path.read_text(encoding="utf-8")
        candidates = re.findall(r"`([^`]+)`", text)
        candidates.extend(re.findall(r"\[[^\]]+\]\(([^)]+)\)", text))

        for raw in candidates:
            normalized = normalize_path(raw)
            if not normalized:
                continue

            key = (str(doc_path), normalized)
            if key in seen:
                continue
            seen.add(key)

            resolved = (doc_path.parent / normalized).resolve()
            if not resolved.exists():
                resolved = (ROOT / normalized).resolve()

            found.append((doc_path, normalized, resolved))

    return found


def normalize_path(raw: str) -> str | None:
    candidate = raw.strip()
    if not candidate or "://" in candidate:
        return None

    if candidate.startswith("{skill_dir}/"):
        candidate = candidate[len("{skill_dir}/") :]
    if candidate.startswith("./"):
        candidate = candidate[2:]

    if any(token in candidate for token in ("*", "{", "}", "(", ")", "$", "|")):
        return None
    if candidate.startswith("/"):
        return None
    if candidate.startswith("--"):
        return None
    if " " in candidate:
        return None

    allowed_roots = (
        "agents/",
        "clients/",
        "output/",
        "references/",
        "scripts/",
        "themes/",
        "toolkit/",
    )
    if not candidate.startswith(allowed_roots):
        return None

    if candidate.endswith("/"):
        return candidate

    if "/" not in candidate:
        return None

    return candidate


if __name__ == "__main__":
    sys.exit(main())
