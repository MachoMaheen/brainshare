"""Offline regression suite for asset publication preflight."""
import contextlib
import io
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from publication_preflight import scan_vault
import importlib.util

SCRIPT = Path(__file__).with_name("bulk-publish-full.py")
SPEC = importlib.util.spec_from_file_location("bulk_publish_full", SCRIPT)
BULK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BULK)

PNG = b"\x89PNG\r\n\x1a\n" + b"safe-raster-fixture"
GIF = b"GIF89a" + b"safe-gif-fixture"

class PreflightTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def put(self, name, data):
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(data if isinstance(data, bytes) else data.encode())
        return file

    def codes(self, report):
        return {issue["code"] for issue in report["errors"]}

    def test_inventory_hash_size_mime_and_nested_reference(self):
        self.put("notes/post.md", "# Approved\n![Image](../images/diagram.png)")
        self.put("images/diagram.png", PNG)
        report = scan_vault(self.root)
        self.assertTrue(report["ok"], report["errors"])
        self.assertEqual(report["asset_count"], 1)
        asset = next(e for e in report["entries"] if e["kind"]=="asset")
        self.assertEqual(asset["mime"],"image/png")
        self.assertEqual(asset["size"],len(PNG))
        self.assertEqual(len(asset["sha256"]),64)

    def test_svg_and_extension_spoofing_are_rejected(self):
        self.put("docs/index.md","# Title\n![image](payload.svg)")
        self.put("docs/payload.svg",'<svg onload="alert(1)"></svg>')
        r=scan_vault(self.root)
        self.assertFalse(r["ok"])
        self.assertIn("unsupported_or_spoofed_image",self.codes(r))
        self.put("docs/fake.png",b"<script>alert('hi')</script>")
        r=scan_vault(self.root)
        self.assertIn("unsupported_or_spoofed_image",self.codes(r))

    def test_rejects_embedded_image_metadata(self):
        self.put("meta.png", PNG + b"tEXt" + b"EXIF_PRIVATE_CANARY")
        report = scan_vault(self.root)
        self.assertIn("embedded_image_metadata",self.codes(report))
        self.assertNotIn("EXIF_PRIVATE_CANARY",str(report))

    def test_missing_or_excluded_assets_rejected(self):
        self.put("README.md","# Public\n![logo](private/logo.png)")
        r=scan_vault(self.root)
        self.assertIn("missing_or_ambiguous_image",self.codes(r))

    def test_external_embedded_resource_rejected(self):
        self.put("README.md","![pixel](https://tracking.invalid/pixel.png)")
        self.assertIn("external_embedded_resource",self.codes(scan_vault(self.root)))

    def test_secrets_are_redacted_from_report(self):
        secret="ghp_"+"x"*30
        self.put("README.md","# Title\n"+secret)
        report=scan_vault(self.root)
        self.assertIn("github_token",self.codes(report))
        self.assertNotIn(secret,str(report))

    def test_unicode_case_collision_and_ambiguous_basename(self):
        self.put("a/Logo.PNG",PNG)
        self.put("b/logo.png",PNG)
        self.put("README.md","# Title")
        self.assertIn("ambiguous_asset_basename",self.codes(scan_vault(self.root)))
        self.put("a/logo.png",PNG)
        self.assertIn("path_collision",self.codes(scan_vault(self.root)))

    def test_symlink_does_not_publish_private_data(self):
        if not hasattr(os,"symlink"):self.skipTest("OS does not support symlinks")
        with tempfile.TemporaryDirectory() as outside:
            target=Path(outside)/"private.png"
            target.write_bytes(PNG)
            try:(self.root/"linked.png").symlink_to(target)
            except OSError:self.skipTest("No symlink permission")
            report=scan_vault(self.root)
            self.assertIn("symlink_file",self.codes(report))
            self.assertFalse(any(e["path"]=="linked.png" for e in report["entries"]))

    def test_deny_large_asset(self):
        self.put("huge.png",b"\x89PNG\r\n\x1a\n"+b"x"*5_000_001)
        self.assertIn("asset_too_large",self.codes(scan_vault(self.root)))

    def test_blocks_before_any_remote_put_or_local_stamping(self):
        old="---\ntitle: Test\n---\n\n# File\n"
        self.put("README.md",old)
        self.put("secrets.svg",'<svg><script>untrusted()</script></svg>')
        output=io.StringIO()
        with patch.object(BULK,"http_put") as sent, patch.object(sys,"argv",["bulk-publish-full.py",str(self.root),"https://test.invalid","synthetic-only"]), contextlib.redirect_stderr(output):
            status=BULK.main()
        self.assertEqual(status,2)
        sent.assert_not_called()
        self.assertEqual((self.root/"README.md").read_text(),old)
        self.assertNotIn("<script>",output.getvalue())
        self.assertIn("Publication blocked",output.getvalue())

if __name__=="__main__":
    unittest.main()
