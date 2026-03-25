import json
import subprocess
import unittest
from pathlib import Path


class TestScriptsIntegration(unittest.TestCase):
    def test_production_training_script(self) -> None:
        output_dir = Path("ml/output_test")
        if output_dir.exists():
            for child in output_dir.rglob("*"):
                if child.is_file():
                    child.unlink()

        subprocess.run(
            [
                "python",
                "-m",
                "ml_pipeline.scripts.run_production_training",
                "--data-source",
                "synthetic",
                "--years",
                "1",
                "--interval-hours",
                "6",
                "--output",
                str(output_dir),
            ],
            check=True,
        )

        summary_path = output_dir / "training_summary.json"
        self.assertTrue(summary_path.exists())
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
        self.assertIn("edge_metrics", summary)
        self.assertIn("model_paths", summary)


if __name__ == "__main__":
    unittest.main()
