#!/usr/bin/env python3
"""
~/.claude/bin/skill-router.py
Unified skill router. Loaded by hooks. Provides:
  - Embedding-based semantic top-K (#1)
  - Project fingerprint detection (#2)
  - Phrase-trigger matching (#3)
  - Tier budget enforcement (#4)
  - Pack expansion (#5)
  - Per-tool routing (#6)
  - Session skill caching (#9)

Usage:
  skill-router.py rebuild-index        # Generate embeddings for every skill/rule
  skill-router.py fingerprint <cwd>    # Emit project fingerprint JSON
  skill-router.py route <prompt> [--cwd PATH] [--cache PATH] [--tool TOOL]
                                       # Resolve full skill manifest for a prompt
  skill-router.py track <skill_id>     # Append used skill to session cache
  skill-router.py index [--json]       # Emit the minimal L0 ecosystem index (all skills+rules, no bodies)
  skill-router.py capsule <id> [--json]  # Emit an L1 capsule (intent + section outline, not the full body)
"""
# PEP 563: defer annotation evaluation so PEP-604 unions (`str | None`) parse on
# Python 3.9 (system python3), not just 3.10+. Keeps the router runnable by hooks.
from __future__ import annotations

import hashlib
import json
import math
import os
import re
import sqlite3
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

try:
    import yaml
except ImportError as exc:  # fail clearly; do not silently fall back to divergent YAML
    raise SystemExit("skill-router requires PyYAML>=6; install requirements-router.txt") from exc

# -----------------------------------------------------------------------------
# Paths
# -----------------------------------------------------------------------------
HOME = Path.home()
CLAUDE_DIR = Path(os.environ.get("EMDASH_CLAUDE_DIR", HOME / ".claude")).resolve()
PLUGIN_DIR = Path(os.environ.get(
    "EMDASH_SKILLS_ROOT", CLAUDE_DIR / "plugins" / "heymegabyte-agent-skills"
)).resolve()
DATA_DIR = Path(os.environ.get("EMDASH_ROUTER_DATA_DIR", CLAUDE_DIR / "data")).resolve()
PROJECTS_DIR = Path(os.environ.get("EMDASH_ROUTER_PROJECTS_DIR", CLAUDE_DIR / "projects")).resolve()
PACKS_DIR = PLUGIN_DIR / "_packs"
DB_PATH = DATA_DIR / "skills.db"

# Embeddings — Cloudflare Workers AI (free, edge; no OpenAI dependency)
CF_EMBED_MODEL = "@cf/baai/bge-base-en-v1.5"  # 768-dim, free on Workers AI
CF_ACCOUNT_ID = "84fa0d1b16ff8086dd958c468ce7fd59"
EMBED_DIM = 768


# Token budget for preamble routing — provider-aware. Lean on DeepSeek's smaller
# context window; generous (bounded) on Claude. Override via EMDASH_ROUTER_BUDGET.
def _default_budget() -> int:
    env = (os.environ.get("EMDASH_ROUTER_BUDGET") or "").strip()
    if env.isdigit():
        return int(env)
    provider = (os.environ.get("ANTHROPIC_BASE_URL", "")
                + " " + os.environ.get("ANTHROPIC_MODEL", "")).lower()
    if "deepseek" in provider:
        return 35_000    # DeepSeek — lean preamble fits the smaller window
    return 200_000       # Claude / default — generous but bounded (was 1_000_000)


DEFAULT_BUDGET_TOKENS = _default_budget()

# -----------------------------------------------------------------------------
# Secrets
# -----------------------------------------------------------------------------
def get_secret(key: str) -> str | None:
    """Use Brian's get-secret helper."""
    try:
        out = subprocess.run(
            ["/Users/Apple/.local/bin/get-secret", key],
            capture_output=True, text=True, timeout=5,
        )
        val = out.stdout.strip()
        if val.startswith('The file "'):
            return None
        return val or None
    except Exception:
        return None


# -----------------------------------------------------------------------------
# Frontmatter parser
# -----------------------------------------------------------------------------
class _UniqueKeyLoader(yaml.SafeLoader):
    """Safe YAML loader that rejects duplicate mapping keys."""


def _construct_unique_mapping(loader, node, deep=False):
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in mapping:
            raise ValueError(f"duplicate YAML key: {key}")
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


_UniqueKeyLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _construct_unique_mapping
)


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Return validated YAML frontmatter and body."""
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    fm_block = text[4:end]
    body = text[end + 5:]
    try:
        fm = yaml.load(fm_block, Loader=_UniqueKeyLoader)
    except (yaml.YAMLError, ValueError) as exc:
        raise ValueError(f"invalid frontmatter: {exc}") from exc
    if fm is None:
        fm = {}
    if not isinstance(fm, dict):
        raise ValueError("frontmatter must be a mapping")
    for key in ("triggers", "paths", "submodules"):
        if key in fm and fm[key] is not None:
            if not isinstance(fm[key], list) or not all(isinstance(v, str) for v in fm[key]):
                raise ValueError(f"frontmatter '{key}' must be a list of strings")
    return fm, body



def _parse_priority(val) -> int:
    """Robust priority parse — never crash on string priorities like 'high'."""
    if isinstance(val, int):
        return val
    m = {"high": 2, "medium": 2, "med": 2, "normal": 2, "low": 3}
    try:
        return int(val)
    except (ValueError, TypeError):
        return m.get(str(val).strip().lower(), 3)


def discover_skills() -> list[dict]:
    """Walk the plugin dir, return list of {id, type, path, name, description, priority, triggers, paths, pack, body}."""
    out = []
    # SKILL.md files
    for skill_md in sorted(PLUGIN_DIR.glob("*/SKILL.md")):
        try:
            text = skill_md.read_text()
        except OSError as exc:
            raise RuntimeError(f"cannot read skill source {skill_md}: {exc}") from exc
        fm, body = parse_frontmatter(text)
        skill_id = skill_md.parent.name
        out.append({
            "id": skill_id,
            "type": "skill",
            "path": str(skill_md.relative_to(PLUGIN_DIR)),
            "name": fm.get("name", skill_id),
            "description": fm.get("description", ""),
            "priority": _parse_priority(fm.get("priority", 3)),
            "triggers": fm.get("triggers", []) if isinstance(fm.get("triggers"), list) else [],
            "paths": fm.get("paths", []) if isinstance(fm.get("paths"), list) else [],
            "pack": fm.get("pack", ""),
            "body": body,
        })
    # Rule files
    for rule_md in sorted((PLUGIN_DIR / "rules").glob("*.md")):
        try:
            text = rule_md.read_text()
        except OSError as exc:
            raise RuntimeError(f"cannot read rule source {rule_md}: {exc}") from exc
        fm, body = parse_frontmatter(text)
        rid = "rules/" + rule_md.stem
        out.append({
            "id": rid,
            "type": "rule",
            "path": str(rule_md.relative_to(PLUGIN_DIR)),
            "name": rule_md.stem,
            "description": fm.get("description", ""),
            "priority": _parse_priority(fm.get("priority", 3)),
            "triggers": fm.get("triggers", []) if isinstance(fm.get("triggers"), list) else [],
            "paths": fm.get("paths", []) if isinstance(fm.get("paths"), list) else [],
            "pack": fm.get("pack", ""),
            "body": body,
        })
    return out


# -----------------------------------------------------------------------------
# Embeddings (Cloudflare Workers AI — @cf/baai/bge-base-en-v1.5, free + edge)
# -----------------------------------------------------------------------------
def embed_text(text: str, api_key: str | None = None) -> list[float]:
    """One embedding via Cloudflare Workers AI bge (free, edge) — no SDK dependency.
    Auth: CF global key (X-Auth-Email + X-Auth-Key); account from env or const."""
    account = os.environ.get("CF_ACCOUNT_ID") or CF_ACCOUNT_ID
    cf_key = api_key or get_secret("CLOUDFLARE_API_KEY")
    cf_email = os.environ.get("CLOUDFLARE_EMAIL") or "blzalewski@gmail.com"
    payload = json.dumps({"text": [text[:4000]]}).encode()
    req = Request(
        f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{CF_EMBED_MODEL}",
        data=payload,
        headers={
            "X-Auth-Email": cf_email,
            "X-Auth-Key": cf_key or "",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urlopen(req, timeout=20) as r:
        data = json.loads(r.read())
    return data["result"]["data"][0]


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))  # no strict= — router runs on py3.9
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


# -----------------------------------------------------------------------------
# SQLite store
# -----------------------------------------------------------------------------
SCHEMA = """
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  triggers TEXT NOT NULL DEFAULT '[]',
  paths TEXT NOT NULL DEFAULT '[]',
  pack TEXT NOT NULL DEFAULT '',
  body_hash TEXT NOT NULL,
  metadata_hash TEXT NOT NULL DEFAULT '',
  embedding_input_hash TEXT NOT NULL DEFAULT '',
  embedding_model TEXT NOT NULL DEFAULT '',
  embedding_dimensions INTEGER NOT NULL DEFAULT 0,
  embedding TEXT,
  tokens INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
"""


def db_open() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    columns = {row[1] for row in conn.execute("PRAGMA table_info(skills)")}
    migrations = {
        "metadata_hash": "ALTER TABLE skills ADD COLUMN metadata_hash TEXT NOT NULL DEFAULT ''",
        "embedding_input_hash": "ALTER TABLE skills ADD COLUMN embedding_input_hash TEXT NOT NULL DEFAULT ''",
        "embedding_model": "ALTER TABLE skills ADD COLUMN embedding_model TEXT NOT NULL DEFAULT ''",
        "embedding_dimensions": "ALTER TABLE skills ADD COLUMN embedding_dimensions INTEGER NOT NULL DEFAULT 0",
    }
    for name, statement in migrations.items():
        if name not in columns:
            conn.execute(statement)
    return conn


def body_hash(body: str) -> str:
    return hashlib.sha256(body.encode()).hexdigest()


def metadata_hash(skill: dict) -> str:
    payload = {k: skill[k] for k in (
        "id", "type", "path", "name", "description", "priority", "triggers", "paths", "pack"
    )}
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


def embedding_input(skill: dict) -> str:
    return f"{skill['name']}\n{skill['description']}\n{skill['body'][:4000]}"


def estimate_tokens(s: str) -> int:
    # Rough estimate: 1 token ≈ 4 chars
    return max(1, len(s) // 4)


def _one_line(text: str, limit: int = 120) -> str:
    """Collapse whitespace + truncate to a single lean line (for match summaries)."""
    s = " ".join((text or "").split())
    return s[: limit - 1] + "…" if len(s) > limit else s



def cmd_sync_metadata():
    """Fast, KEYLESS sync of routing metadata (priority/pack/triggers/paths/tokens)
    for every skill — no embeddings. Fixes the stale-DB rot: rebuild-index skips
    rows whose BODY is unchanged, so frontmatter-only edits (priority/pack) never
    synced. This updates metadata for ALL rows regardless of body hash. Run on every
    rule write (hook) + manually; full `rebuild-index` still owns embeddings."""
    conn = db_open()
    skills = discover_skills()
    now = int(time.time())
    source_ids = {sk["id"] for sk in skills}
    with conn:
        for sk in skills:
            emb_hash = body_hash(embedding_input(sk))
            existing = conn.execute(
                "SELECT embedding_input_hash, embedding FROM skills WHERE id=?", (sk["id"],)
            ).fetchone()
            keep_embedding = bool(existing and existing[0] == emb_hash and existing[1])
            conn.execute(
                """INSERT INTO skills
                   (id,type,path,name,description,priority,triggers,paths,pack,body_hash,metadata_hash,
                    embedding_input_hash,embedding_model,embedding_dimensions,embedding,tokens,updated_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(id) DO UPDATE SET
                     type=excluded.type,path=excluded.path,name=excluded.name,description=excluded.description,
                     priority=excluded.priority,triggers=excluded.triggers,paths=excluded.paths,pack=excluded.pack,
                     body_hash=excluded.body_hash,metadata_hash=excluded.metadata_hash,
                     embedding_input_hash=excluded.embedding_input_hash,
                     embedding=CASE WHEN ? THEN skills.embedding ELSE NULL END,
                     embedding_model=CASE WHEN ? THEN skills.embedding_model ELSE '' END,
                     embedding_dimensions=CASE WHEN ? THEN skills.embedding_dimensions ELSE 0 END,
                     tokens=excluded.tokens,updated_at=excluded.updated_at""",
                (sk["id"], sk["type"], sk["path"], sk["name"], sk["description"], sk["priority"],
                 json.dumps(sk["triggers"]), json.dumps(sk["paths"]), sk["pack"], body_hash(sk["body"]),
                 metadata_hash(sk), emb_hash, "", 0, None, estimate_tokens(sk["body"]), now,
                 keep_embedding, keep_embedding, keep_embedding),
            )
        if source_ids:
            placeholders = ",".join("?" for _ in source_ids)
            conn.execute(f"DELETE FROM skills WHERE id NOT IN ({placeholders})", tuple(sorted(source_ids)))
        else:
            conn.execute("DELETE FROM skills")
        conn.execute("INSERT OR REPLACE INTO meta(key,value) VALUES('last_metadata_sync', ?)", (str(now),))
    conn.close()
    print(f"[skill-router] metadata synced for {len(skills)} skills/rules (keyless, no embeddings)")


def cmd_rebuild_index():
    """Generate embeddings for every skill/rule. Idempotent — skips unchanged bodies."""
    api_key = get_secret("CLOUDFLARE_API_KEY")
    if not api_key:
        print("ERROR: CLOUDFLARE_API_KEY not in get-secret (needed for Workers AI embeddings)", file=sys.stderr)
        sys.exit(1)
    conn = db_open()
    skills = discover_skills()
    print(f"[skill-router] indexing {len(skills)} skills/rules")
    updated = 0
    skipped = 0
    for s in skills:
        h = body_hash(s["body"])
        emb_input = embedding_input(s)
        emb_hash = body_hash(emb_input)
        cur = conn.execute(
            "SELECT embedding_input_hash,embedding,embedding_model,embedding_dimensions FROM skills WHERE id=?",
            (s["id"],),
        )
        row = cur.fetchone()
        if row and row[0] == emb_hash and row[1] and row[2] == CF_EMBED_MODEL and row[3] == EMBED_DIM:
            try:
                vector = json.loads(row[1])
                if len(vector) == EMBED_DIM and all(math.isfinite(float(v)) for v in vector):
                    skipped += 1
                    continue
            except (ValueError, TypeError, json.JSONDecodeError):
                pass
        try:
            emb = embed_text(emb_input, api_key)
        except URLError as e:
            print(f"[skill-router] embed failed for {s['id']}: {e}", file=sys.stderr)
            continue
        if len(emb) != EMBED_DIM or not all(math.isfinite(float(v)) for v in emb):
            print(f"[skill-router] invalid embedding for {s['id']}", file=sys.stderr)
            continue
        conn.execute(
            """INSERT OR REPLACE INTO skills
               (id,type,path,name,description,priority,triggers,paths,pack,body_hash,metadata_hash,
                embedding_input_hash,embedding_model,embedding_dimensions,embedding,tokens,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                s["id"], s["type"], s["path"], s["name"], s["description"],
                s["priority"],
                json.dumps(s["triggers"]),
                json.dumps(s["paths"]),
                s["pack"],
                h, metadata_hash(s), emb_hash, CF_EMBED_MODEL, EMBED_DIM,
                json.dumps(emb),
                estimate_tokens(s["body"]),
                int(time.time()),
            ),
        )
        updated += 1
        print(f"  [{updated}/{len(skills)}] {s['id']}", file=sys.stderr)
    conn.execute("INSERT OR REPLACE INTO meta(key, value) VALUES('last_rebuild', ?)",
                 (str(int(time.time())),))
    conn.commit()
    conn.close()
    print(f"[skill-router] done — {updated} updated, {skipped} skipped")


# -----------------------------------------------------------------------------
# Project fingerprint (#2)
# -----------------------------------------------------------------------------
def cmd_fingerprint(cwd: str | None = None) -> dict:
    """Inspect cwd; return {stack, concerns, scale, org_type, has_payments, …}."""
    cwd_p = Path(cwd or os.getcwd()).resolve()
    fp = {
        "cwd": str(cwd_p),
        "stack": "unknown",
        "concerns": [],
        "scale": "solo",
        "has_payments": False,
        "has_ai": False,
        "has_auth": False,
        "is_website_build": False,
        "is_internal_app": False,
        "is_nonprofit": False,
        "is_saas": False,
        "frameworks": [],
        "languages": [],
    }
    if not cwd_p.exists():
        return fp

    # package.json signals
    pkg_path = cwd_p / "package.json"
    if pkg_path.exists():
        try:
            pkg = json.loads(pkg_path.read_text())
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            if "@angular/core" in deps:
                fp["stack"] = "angular-nx"
                fp["frameworks"].append("angular")
            elif "react" in deps and "vite" in deps:
                fp["stack"] = "react-vite"
                fp["frameworks"].append("react")
            elif "next" in deps:
                fp["stack"] = "react-next"
                fp["frameworks"].append("next")
            elif "astro" in deps:
                fp["stack"] = "astro"
                fp["frameworks"].append("astro")
            elif "hono" in deps and not deps.get("react"):
                fp["stack"] = "hono-only"
                fp["frameworks"].append("hono")
            if "stripe" in deps or "@stripe/stripe-js" in deps:
                fp["has_payments"] = True
                fp["concerns"].append("stripe-billing")
            if "square" in deps:
                fp["has_payments"] = True
                fp["concerns"].append("square-payments")
            if any(d in deps for d in ("resend", "@aws-sdk/client-ses", "nodemailer", "postmark", "@sendgrid/mail")):
                fp["concerns"].append("email")
            if any(d in deps for d in ("shopify", "@shopify/hydrogen", "@shopify/storefront-api-client", "@medusajs/medusa", "swell-js", "snipcart", "@commercelayer/sdk")):
                fp["concerns"].append("ecommerce")
            if "@anthropic-ai/sdk" in deps or "openai" in deps:
                fp["has_ai"] = True
                fp["concerns"].append("ai-features")
            if "better-auth" in deps:
                fp["has_auth"] = True
                fp["concerns"].append("auth")
            if "@hono/zod-validator" in deps or "drizzle-orm" in deps:
                fp["concerns"].append("hono-stack")
            if "playwright" in deps or "@playwright/test" in deps:
                fp["concerns"].append("e2e-testing")
            if any(d in deps for d in ("@sentry/node", "@sentry/cloudflare", "posthog-node", "posthog-js", "@opentelemetry/api", "@axiomhq/js")):
                fp["concerns"].append("observability")
            if any(d in deps for d in ("yjs", "@automerge/automerge", "@liveblocks/client", "partykit", "partysocket")):
                fp["concerns"].append("realtime")
            fp["languages"].append("typescript" if (cwd_p / "tsconfig.json").exists() else "javascript")
        except Exception:
            pass

    # wrangler signal
    if (cwd_p / "wrangler.toml").exists() or (cwd_p / "wrangler.jsonc").exists():
        fp["concerns"].append("cloudflare-workers")
        try:
            for f in ("wrangler.toml", "wrangler.jsonc"):
                p = cwd_p / f
                if p.exists():
                    content = p.read_text().lower()
                    if "d1_database" in content:
                        fp["concerns"].append("d1-database")
                    if "r2_bucket" in content:
                        fp["concerns"].append("r2-storage")
                    if "[ai]" in content or '"ai"' in content:
                        fp["concerns"].append("workers-ai")
        except Exception:
            pass

    # Python project signals
    if (cwd_p / "pyproject.toml").exists() or (cwd_p / "requirements.txt").exists():
        fp["languages"].append("python")
        if fp["stack"] == "unknown":
            fp["stack"] = "python"

    # Marker file signals
    for f in cwd_p.iterdir():
        if not f.is_file():
            continue
        name = f.name.lower()
        if name in {"_research.json", "_brand.json", "_url_inventory.json", "_competitor_aggregate.json"}:
            fp["is_website_build"] = True
            fp["concerns"].append("website-build")
        if name in {"form_990.pdf", "_nonprofit.json"} or "nonprofit" in name:
            fp["is_nonprofit"] = True

    # CLAUDE.md signals
    claude_md = cwd_p / "CLAUDE.md"
    if claude_md.exists():
        try:
            content = claude_md.read_text().lower()
            if "saas" in content or "subscription" in content or "pricing" in content:
                fp["is_saas"] = True
            if "nonprofit" in content or "501(c)(3)" in content or "donation" in content:
                fp["is_nonprofit"] = True
            if "internal" in content and ("dashboard" in content or "admin" in content):
                fp["is_internal_app"] = True
        except Exception:
            pass

    # Dedupe concerns
    fp["concerns"] = list(dict.fromkeys(fp["concerns"]))
    fp["frameworks"] = list(dict.fromkeys(fp["frameworks"]))
    fp["languages"] = list(dict.fromkeys(fp["languages"]))

    return fp


def project_identity(cwd: str) -> str:
    canonical = str(Path(cwd).resolve())
    return hashlib.sha256(canonical.encode()).hexdigest()[:24]


def fingerprint_path(cwd: str) -> Path:
    """Cached fingerprint path per encoded cwd."""
    return PROJECTS_DIR / project_identity(cwd) / "fingerprint.json"


def session_cache_path(cwd: str, session_id: str) -> Path:
    if not session_id:
        raise ValueError("a real session_id is required for session cache state")
    session_key = hashlib.sha256(session_id.encode()).hexdigest()[:24]
    return PROJECTS_DIR / project_identity(cwd) / f"active-skills-{session_key}.json"


# -----------------------------------------------------------------------------
# Pack resolution (#5)
# -----------------------------------------------------------------------------
def resolve_pack(pack_name: str) -> list[str]:
    """Read pack YAML; return list of skill IDs."""
    pack_file = PACKS_DIR / f"{pack_name}.yml"
    if not pack_file.exists():
        return []
    out = []
    in_members = False
    for line in pack_file.read_text().split("\n"):
        if line.startswith("members:"):
            in_members = True
            continue
        if in_members:
            if line.startswith("  - "):
                out.append(line[4:].strip())
            elif line and not line.startswith(" "):
                in_members = False
    return out


def all_packs() -> dict[str, list[str]]:
    if not PACKS_DIR.exists():
        return {}
    return {p.stem: resolve_pack(p.stem) for p in PACKS_DIR.glob("*.yml")}


# -----------------------------------------------------------------------------
# Per-tool routing (#6)
# -----------------------------------------------------------------------------
TOOL_TO_SKILLS = {
    # Playwright tools → testing skills
    "mcp__playwright__": ["07-quality-and-verification", "rules/e2e-tdd-organization",
                          "rules/e2e-visual-inspection", "rules/verification-loop"],
    "mcp__plugin_playwright_": ["07-quality-and-verification", "rules/e2e-tdd-organization"],
    # CF tools → CF skills
    "mcp__plugin_cloudflare_": ["05-architecture-and-stack", "rules/cloudflare-lock-in-is-leverage",
                                 "rules/hono-api", "08-deploy-and-runtime-verification"],
    # Sentry → observability
    "mcp__plugin_sentry_": ["13-observability-and-growth", "rules/auto-meta-work"],
    "mcp__sentry__": ["13-observability-and-growth", "rules/error-recovery"],
    # Stripe → payments
    "mcp__stripe__": ["13-observability-and-growth", "rules/payments-routing"],
    # PostHog → analytics
    "mcp__posthog__": ["13-observability-and-growth", "rules/auto-meta-work"],
    # Resend → email
    "mcp__plugin_resend_": ["13-observability-and-growth", "rules/auto-meta-work"],
    "mcp__resend__": ["13-observability-and-growth"],
    # Computer use → safety
    "mcp__desktop-control__": ["rules/computer-use-safety", "rules/full-autonomy"],
    "mcp__computer-use__": ["rules/computer-use-safety", "rules/full-autonomy"],
    # GitHub → repo + CI
    "mcp__github__": ["08-deploy-and-runtime-verification", "rules/main-only-branch"],
    "mcp__github-mcp__": ["08-deploy-and-runtime-verification"],
    # Research
    "WebFetch": ["rules/fetch-defaults"],
    "mcp__firecrawl__": ["rules/fetch-defaults"],
    # Bash with specific commands
    "Bash:wrangler": ["05-architecture-and-stack", "08-deploy-and-runtime-verification",
                       "rules/cloudflare-lock-in-is-leverage"],
    "Bash:npm test": ["07-quality-and-verification", "rules/e2e-tdd-organization"],
    "Bash:npm run e2e": ["07-quality-and-verification", "rules/e2e-tdd-organization"],
    "Bash:npm run deploy": ["08-deploy-and-runtime-verification", "rules/verification-loop"],
}


def tool_to_skills(tool: str, command: str = "") -> list[str]:
    """Map tool + optional command to skill list."""
    out = []
    # Direct prefix match
    for pat, skills in TOOL_TO_SKILLS.items():
        if ":" in pat:
            t, _, c = pat.partition(":")
            if tool == t and c in command:
                out.extend(skills)
        elif tool.startswith(pat) or tool == pat:
            out.extend(skills)
    return list(dict.fromkeys(out))


# -----------------------------------------------------------------------------
# Phrase trigger matching (#3)
# -----------------------------------------------------------------------------
def match_triggers(prompt: str, conn: sqlite3.Connection) -> list[str]:
    """Return skill IDs whose trigger phrases match the prompt."""
    prompt_lower = prompt.lower()
    cur = conn.execute("SELECT id, triggers FROM skills WHERE triggers != '[]'")
    out = []
    for sid, triggers_json in cur.fetchall():
        try:
            triggers = json.loads(triggers_json)
        except json.JSONDecodeError:
            continue
        for trig in triggers:
            t = trig.lower()
            # Defined grammar: non-empty {identifier} placeholders match one non-space token.
            parts = re.split(r"(\{[a-z_][a-z0-9_-]*\})", t)
            pattern = "".join(r"[^\s]+" if p.startswith("{") else re.escape(p) for p in parts)
            if re.search(pattern, prompt_lower):
                out.append(sid)
                break
    return out


# -----------------------------------------------------------------------------
# Top-K embedding search (#1)
# -----------------------------------------------------------------------------
def embedding_topk(prompt: str, conn: sqlite3.Connection, k: int = 8) -> list[tuple[str, float]]:
    """Return [(skill_id, similarity)] sorted desc."""
    if os.environ.get("EMDASH_DISABLE_EMBEDDINGS") == "1":
        return []
    api_key = get_secret("CLOUDFLARE_API_KEY")
    if not api_key:
        return []
    try:
        prompt_emb = embed_text(prompt, api_key)
    except (URLError, KeyError, OSError):
        return []
    out = []
    cur = conn.execute("SELECT id, embedding FROM skills WHERE embedding IS NOT NULL")
    for sid, emb_json in cur.fetchall():
        try:
            emb = json.loads(emb_json)
        except json.JSONDecodeError:
            continue
        sim = cosine(prompt_emb, emb)
        out.append((sid, sim))
    out.sort(key=lambda x: -x[1])
    return out[:k]


# -----------------------------------------------------------------------------
# Tier budget (#4)
# -----------------------------------------------------------------------------
REASON_PRIORITY_BUMP = {
    "tier-1 always": -100,      # IMMUTABLE — priority:1 reserved before all else,
                                # never budget-dropped (the always-load-budget gate
                                # keeps this set <38K so it always fits). Was 0, which
                                # let trigger-match(-3) outrank it and drop `always`.
    "trigger-match": -3,        # explicit phrase = strong signal — loads first
    "pack:": -3,                # pack named in prompt — loads first
    "semantic": -2,             # embedding top-K — high confidence
    "tool:": -2,                # tool-activated — relevant to current op
    "session-cache": -1,        # known to be used recently — soft prefer
    "path-match": 0,            # paths-wildcard doesn't bump
}


def reason_priority(reason: str, base_priority: int) -> float:
    """Apply reason-based priority bump. Lower = loads first."""
    for prefix, bump in REASON_PRIORITY_BUMP.items():
        if reason.startswith(prefix):
            return base_priority + bump
    return base_priority


def apply_budget(selections: list[tuple[str, str]], conn: sqlite3.Connection,
                 budget_tokens: int = DEFAULT_BUDGET_TOKENS) -> dict:
    """Filter skill set to fit under budget; sort by (reason-adjusted) priority asc.
    selections = [(skill_id, reason)]"""
    if not selections:
        return {"selected": [], "used_tokens": 0, "unsatisfied_required": []}
    skill_ids = [s[0] for s in selections]
    reason_map = dict(selections)
    cur = conn.execute(
        f"SELECT id, priority, tokens FROM skills WHERE id IN ({','.join('?' * len(skill_ids))})",
        skill_ids,
    )
    rows = []
    for sid, pri, toks in cur.fetchall():
        eff_pri = reason_priority(reason_map.get(sid, ""), pri)
        rows.append((sid, eff_pri, toks))
    # Sort by effective priority asc, then size asc (load smaller first within tier to fit more)
    rows.sort(key=lambda r: (r[1], r[2]))
    required = [r for r in rows if reason_map.get(r[0]) == "tier-1 always"]
    optional = [r for r in rows if reason_map.get(r[0]) != "tier-1 always"]
    out = []
    used = 0
    unsatisfied = []
    for sid, _eff, toks in required:
        if used + toks > budget_tokens:
            unsatisfied.append(sid)
            continue
        out.append(sid)
        used += toks
    if unsatisfied:
        return {"selected": out, "used_tokens": used, "unsatisfied_required": unsatisfied}
    for sid, _eff, toks in optional:
        if used + toks > budget_tokens:
            continue
        out.append(sid)
        used += toks
    return {"selected": out, "used_tokens": used, "unsatisfied_required": []}


# -----------------------------------------------------------------------------
# Path matching (#2 applies fingerprint to skill `paths`)
# -----------------------------------------------------------------------------
def path_match(skill_paths: list[str], fingerprint: dict) -> bool:
    """Return True for a positive project match.

    A bare `*` means globally eligible, not globally selected. Treating it as a
    positive match loaded nearly every rule before intent routing and defeated
    progressive disclosure.
    """
    if not skill_paths:
        return True
    cwd = fingerprint.get("cwd", "")
    for pattern in skill_paths:
        # Glob-like patterns operating on fingerprint
        if pattern.startswith("stack:"):
            if fingerprint.get("stack") == pattern[6:]:
                return True
        elif pattern.startswith("concern:"):
            if pattern[8:] in fingerprint.get("concerns", []):
                return True
        elif pattern.startswith("org:"):
            if fingerprint.get(f"is_{pattern[4:]}", False):
                return True
        elif pattern in cwd:
            return True
        elif pattern == "*":
            continue
    return False


# -----------------------------------------------------------------------------
# Main router — unified route command
# -----------------------------------------------------------------------------
def cmd_route(prompt: str, cwd: str | None = None, cache_only: bool = False,
              tool: str = "", command: str = "", session_id: str = "") -> dict:
    """
    Return {selected_skills, fingerprint, reasons, total_tokens}.
    Selection order:
      1. Tier-1 always-loaded (priority=1)
      2. Project-fingerprint matches
      3. Session cache (#9)
      4. Phrase triggers (#3)
      5. Pack expansion (#5)
      6. Tool→skills (#6)
      7. Embedding top-K (#1) — only if budget allows
    Then apply tier budget (#4).
    """
    cwd = cwd or os.getcwd()
    conn = db_open()

    # Fingerprint
    fp = cmd_fingerprint(cwd)

    # Prompt-intent: a one-line website-build prompt ("build a website for X") has none
    # of the cwd marker files (_research.json etc.) that set is_website_build — those only
    # appear AFTER Phase 0. So detect build intent from the PROMPT (any website-build pack
    # member trigger-matched) and set the flag here, BEFORE path-match — otherwise the
    # org:website_build-scoped rules (cinematic-ui-patterns, copy-writing, supreme-polish,
    # the forms/media/motion/visualization supervisors) would never load on the very prompt
    # they exist for. Reuses match_triggers data → no trigger duplication.
    try:
        _triggered = set(match_triggers(prompt, conn))
        _wb_members = set(all_packs().get("website-build", []))
        if _triggered & _wb_members:
            fp["is_website_build"] = True
            if "website-build" not in fp["concerns"]:
                fp["concerns"].append("website-build")
    except Exception:
        pass

    selected: dict[str, str] = {}  # id → reason

    # 1. Tier-1 always
    cur = conn.execute("SELECT id FROM skills WHERE priority = 1")
    for (sid,) in cur.fetchall():
        selected[sid] = "tier-1 always"

    # 2. Fingerprint-path matching for tier-2+
    cur = conn.execute("SELECT id, paths FROM skills WHERE priority > 1 AND paths != '[]'")
    for sid, paths_json in cur.fetchall():
        try:
            paths = json.loads(paths_json)
        except json.JSONDecodeError:
            continue
        if path_match(paths, fp):
            selected[sid] = f"path-match {paths}"

    # 3. Session cache
    cache_p = session_cache_path(cwd, session_id) if session_id else None
    if cache_p and cache_p.exists():
        try:
            cache = json.loads(cache_p.read_text())
            fresh = int(time.time()) - int(cache.get("updated_at", 0)) <= 86400
            for sid in cache.get("active", []) if fresh else []:
                if sid not in selected:
                    selected[sid] = "session-cache"
        except json.JSONDecodeError:
            pass

    # Reasons by strength — stronger overwrites weaker
    REASON_STRENGTH = {
        "tier-1 always": 100,    # immutable
        "trigger-match": 90,     # explicit user phrase
        "semantic": 80,          # embedding similarity
        "pack:": 70,             # pack membership
        "tool:": 60,             # tool-activated
        "session-cache": 50,     # historical
        "path-match": 10,        # weakest — wildcard match
    }

    def reason_strength(r: str) -> int:
        for prefix, s in REASON_STRENGTH.items():
            if r.startswith(prefix):
                return s
        return 0

    def upgrade_reason(sid: str, new_reason: str) -> None:
        existing = selected.get(sid)
        if existing is None or reason_strength(new_reason) > reason_strength(existing):
            selected[sid] = new_reason

    if not cache_only:
        # 4. Phrase triggers — strong signal, upgrades reason
        triggered = match_triggers(prompt, conn)
        for sid in triggered:
            upgrade_reason(sid, "trigger-match")

        # 5a. Pack expansion — when prompt mentions pack name
        prompt_lower = prompt.lower()
        packs = all_packs()
        for pack_name, members in packs.items():
            if pack_name.replace("-", " ") in prompt_lower or pack_name in prompt_lower:
                for m in members:
                    upgrade_reason(m, f"pack:{pack_name}")

        # 5b. Pack auto-expand — when a triggered skill is a pack member,
        #     pull in pack siblings (only for explicit name-packs, not catch-all)
        TRIGGERED_PACK_EXPANSION = {"website-build", "angular", "ecommerce", "payments", "ai", "testing", "media"}
        for sid in list(selected.keys()):
            if not selected[sid].startswith("trigger-match"):
                continue
            for pack_name, members in packs.items():
                if pack_name not in TRIGGERED_PACK_EXPANSION:
                    continue
                if sid in members:
                    for m in members:
                        upgrade_reason(m, f"pack:{pack_name}")

        # 6. Tool routing
        if tool:
            for sid in tool_to_skills(tool, command):
                upgrade_reason(sid, f"tool:{tool}")

        # 7. Embedding top-K — only if we have budget
        try:
            for sid, score in embedding_topk(prompt, conn, k=8):
                if score > 0.35:
                    upgrade_reason(sid, f"semantic({score:.2f})")
        except Exception:
            pass

    # Apply tier budget — reason-aware priority bumps
    budget_result = apply_budget(list(selected.items()), conn, DEFAULT_BUDGET_TOKENS)
    final = budget_result["selected"]
    final_set = set(final)
    dropped = [sid for sid in selected if sid not in final_set]

    # Token total
    if final:
        cur = conn.execute(
            f"SELECT SUM(tokens) FROM skills WHERE id IN ({','.join('?' * len(final))})",
            final,
        )
        total = cur.fetchone()[0] or 0
    else:
        total = 0

    # id → one-line description for the selected set (additive; lets a consumer show WHAT
    # matched, not just that it matched — existing hooks read id/reason + ignore this field)
    desc_map = {}
    if final:
        drow = conn.execute(
            f"SELECT id, description FROM skills WHERE id IN ({','.join('?' * len(final))})",
            final,
        )
        desc_map = {r[0]: r[1] for r in drow.fetchall()}

    conn.close()

    return {
        "selected": [
            {"id": sid, "reason": selected[sid], "description": _one_line(desc_map.get(sid, ""))}
            for sid in final
        ],
        "dropped_for_budget": dropped,
        "fingerprint": fp,
        "total_tokens": total,
        "budget": DEFAULT_BUDGET_TOKENS,
        "unsatisfied_required": budget_result["unsatisfied_required"],
        "status": "unsatisfied-budget" if budget_result["unsatisfied_required"] else "ok",
    }


# -----------------------------------------------------------------------------
# Track skill usage (#9)
# -----------------------------------------------------------------------------
def cmd_track(skill_id: str, cwd: str | None = None, session_id: str = "") -> None:
    cwd = cwd or os.getcwd()
    if not session_id:
        raise ValueError("track requires --session-id or EMDASH_SESSION_ID")
    p = session_cache_path(cwd, session_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists():
        try:
            data = json.loads(p.read_text())
        except json.JSONDecodeError:
            data = {"active": []}
    else:
        data = {"active": []}
    if skill_id not in data["active"]:
        data["active"].append(skill_id)
    data["updated_at"] = int(time.time())
    data["project_id"] = project_identity(cwd)
    data["schema_version"] = 1
    tmp = p.with_suffix(f".tmp-{os.getpid()}")
    tmp.write_text(json.dumps(data, indent=2))
    os.replace(tmp, p)


# -----------------------------------------------------------------------------
# CLI dispatch
# -----------------------------------------------------------------------------
def make_capsule(item: dict, max_sections: int = 14) -> str:
    """Build the L1 capsule for a skill/rule (REVISION 2 §11): intent + structural
    outline — the id line, the description, and the body's section-header outline
    (## / ### lines) — but NOT the full body. The mid-tier between the L0 index line
    and the L4 full body: load a capsule for a mid-priority selection to orient on
    what a skill covers + its shape at a fraction of the body's tokens."""
    body = item.get("body", "") or ""
    headers = []
    for line in body.splitlines():
        s = line.strip()
        if s.startswith("### "):
            headers.append("  - " + s[4:].strip())
        elif s.startswith("## "):
            headers.append("- " + s[3:].strip())
    desc = " ".join((item.get("description") or "").split())
    out = [f"## {item['id']} [{item.get('pack') or '-'}/p{item.get('priority', 3)}]", ""]
    if desc:
        out += [desc, ""]
    if headers:
        out.append("Sections:")
        out += headers[:max_sections]
        if len(headers) > max_sections:
            out.append(f"- … (+{len(headers) - max_sections} more sections)")
    else:
        out.append("(no section headers — short rule; load full body if needed)")
    out += ["", f"→ full body: `{item.get('path', '')}`"]
    return "\n".join(out)


def cmd_capsule(skill_id: str, as_json: bool = False) -> int:
    """Emit the L1 capsule for ONE skill/rule id (+ its body-vs-capsule token
    reduction). Accepts a skill id (`07-quality-and-verification`) or a rule id
    (`rules/verification-loop` or the bare `verification-loop`)."""
    items = discover_skills()
    item = next((s for s in items if s["id"] == skill_id), None)
    if item is None:
        item = next((s for s in items if s["id"] == f"rules/{skill_id}"), None)
    if item is None:
        print(f"capsule: unknown skill/rule id: {skill_id}", file=sys.stderr)
        return 1
    capsule = make_capsule(item)
    body_tok = estimate_tokens(item.get("body", "") or "")
    cap_tok = estimate_tokens(capsule)
    reduction = round(100 * (1 - cap_tok / body_tok)) if body_tok else 0
    if as_json:
        print(json.dumps({
            "id": item["id"],
            "path": item.get("path", ""),
            "body_tokens": body_tok,
            "capsule_tokens": cap_tok,
            "reduction_pct": reduction,
            "capsule": capsule,
        }, indent=2))
    else:
        print(capsule)
        print(f"\n<!-- L1 capsule: {cap_tok} tok vs {body_tok} tok body — {reduction}% reduction -->",
              file=sys.stderr)
    return 0


def cmd_index(as_json: bool = False) -> None:
    """Emit the minimal L0 ecosystem index (REVISION 2 §11): one compact line per
    skill + rule — id · [pack/priority] · one-line description — derived LIVE from
    discover_skills() so it can never drift from a hand-maintained copy. The cheap
    L0 layer of progressive retrieval: orient over the whole ecosystem without
    loading a single full body, narrow the set, THEN load L4 source on demand."""
    items = discover_skills()

    def one_line(text: str) -> str:
        collapsed = " ".join((text or "").split())
        return collapsed[:117] + "..." if len(collapsed) > 120 else collapsed

    skills = [s for s in items if s["type"] == "skill"]
    rules = [s for s in items if s["type"] == "rule"]
    if as_json:
        print(json.dumps({
            "meta": {
                "generated_by": "skill-router.py index",
                "skills": len(skills),
                "rules": len(rules),
                "total": len(items),
            },
            "items": [
                {
                    "id": s["id"],
                    "type": s["type"],
                    "pack": s["pack"],
                    "priority": s["priority"],
                    "triggers": len(s["triggers"]),
                    "path": s["path"],
                    "description": one_line(s["description"]),
                }
                for s in items
            ],
        }, indent=2))
        return
    lines = [
        "# L0 Ecosystem Index (generated — `skill-router.py index`)",
        "",
        f"{len(skills)} skills · {len(rules)} rules · {len(items)} total. "
        "Minimal routing layer — id · [pack/priority] · one-line description; "
        "load a full body only after this L0 pass narrows the set.",
        "",
        "## Skills",
        "",
    ]
    for s in skills:
        lines.append(f"- **{s['id']}** [{s['pack'] or '-'}/p{s['priority']}] — {one_line(s['description'])}")
    lines += ["", "## Rules", ""]
    for s in rules:
        lines.append(f"- **{s['id']}** [{s['pack'] or '-'}/p{s['priority']}] — {one_line(s['description'])}")
    print("\n".join(lines))


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        return 1
    cmd = argv[1]
    if cmd == "rebuild-index":
        cmd_rebuild_index()
        return 0
    if cmd == "sync-metadata":
        cmd_sync_metadata()
        return 0
    if cmd == "fingerprint":
        cwd = argv[2] if len(argv) > 2 else None
        print(json.dumps(cmd_fingerprint(cwd), indent=2))
        return 0
    if cmd == "route":
        prompt = argv[2] if len(argv) > 2 else ""
        cwd = None
        tool = ""
        command = ""
        session_id = os.environ.get("EMDASH_SESSION_ID", "")
        for i, arg in enumerate(argv[3:], start=3):
            if arg == "--cwd" and i + 1 < len(argv):
                cwd = argv[i + 1]
            elif arg == "--tool" and i + 1 < len(argv):
                tool = argv[i + 1]
            elif arg == "--command" and i + 1 < len(argv):
                command = argv[i + 1]
            elif arg == "--session-id" and i + 1 < len(argv):
                session_id = argv[i + 1]
        result = cmd_route(prompt, cwd=cwd, tool=tool, command=command, session_id=session_id)
        print(json.dumps(result, indent=2))
        return 0
    if cmd == "track":
        if len(argv) < 3:
            print("usage: track <skill_id> [--cwd PATH]", file=sys.stderr)
            return 1
        cwd = None
        session_id = os.environ.get("EMDASH_SESSION_ID", "")
        if "--cwd" in argv:
            cwd = argv[argv.index("--cwd") + 1]
        if "--session-id" in argv:
            session_id = argv[argv.index("--session-id") + 1]
        cmd_track(argv[2], cwd, session_id)
        return 0
    if cmd == "index":
        cmd_index(as_json="--json" in argv)
        return 0
    if cmd == "capsule":
        if len(argv) < 3:
            print("usage: capsule <skill_id> [--json]", file=sys.stderr)
            return 1
        return cmd_capsule(argv[2], as_json="--json" in argv)
    print(f"unknown command: {cmd}", file=sys.stderr)
    print(__doc__, file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
