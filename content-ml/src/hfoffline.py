import os
from pathlib import Path

_hub = Path(os.environ.get("HF_HOME", Path.home() / ".cache" / "huggingface")) / "hub"
_repo = _hub / "models--mlx-community--Qwen2.5-1.5B-Instruct-4bit"


def _complete():
    snaps = _repo / "snapshots"
    if not snaps.exists() or any((_repo / "blobs").glob("*.incomplete")):
        return False
    for rev in snaps.iterdir():
        weights = [p for p in rev.glob("*.safetensors") if p.resolve().exists()]
        if weights and (rev / "config.json").exists() and (rev / "tokenizer.json").exists():
            return True
    return False


if _complete():
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
