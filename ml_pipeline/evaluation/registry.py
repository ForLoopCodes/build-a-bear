from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List


@dataclass
class InMemoryModelRegistry:
    records: List[Dict[str, str | float]] = field(default_factory=list)

    def register(self, model_name: str, version: str, metrics: Dict[str, float]) -> Dict[str, str | float]:
        record = {
            "model_name": model_name,
            "version": version,
            "registered_at": datetime.now(timezone.utc).isoformat(),
            **metrics,
        }
        self.records.append(record)
        return record

    def latest(self, model_name: str) -> Dict[str, str | float] | None:
        candidates = [record for record in self.records if record["model_name"] == model_name]
        if not candidates:
            return None
        return candidates[-1]
