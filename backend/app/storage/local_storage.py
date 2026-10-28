from pathlib import Path
from app.core.config import settings
from app.core.exceptions import StorageError
from app.storage.base import StorageProvider


class LocalStorageProvider(StorageProvider):
    def __init__(self, root_dir: str = settings.UPLOAD_DIR):
        self.root_dir = Path(root_dir).resolve()
        self.root_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_safe_path(self, relative_path: str) -> Path:
        """Prevents directory traversal attacks by resolving and asserting prefix."""
        # Strip leading slashes to prevent root traversal
        clean_path = relative_path.lstrip("/\\")
        target = (self.root_dir / clean_path).resolve()
        try:
            target.relative_to(self.root_dir)
        except ValueError:
            raise StorageError(f"Directory traversal detected: {relative_path}")
        return target

    def save(self, content: bytes, relative_path: str) -> str:
        safe_path = self._resolve_safe_path(relative_path)
        safe_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(safe_path, "wb") as f:
                f.write(content)
            return str(safe_path.relative_to(self.root_dir)).replace("\\", "/")
        except Exception as e:
            raise StorageError(f"Failed to save file: {str(e)}")

    def read(self, relative_path: str) -> bytes:
        safe_path = self._resolve_safe_path(relative_path)
        if not safe_path.exists():
            raise StorageError(f"File not found: {relative_path}")
        try:
            with open(safe_path, "rb") as f:
                return f.read()
        except Exception as e:
            raise StorageError(f"Failed to read file: {str(e)}")

    def delete(self, relative_path: str) -> bool:
        safe_path = self._resolve_safe_path(relative_path)
        if safe_path.exists():
            try:
                safe_path.unlink()
                return True
            except Exception as e:
                raise StorageError(f"Failed to delete file: {str(e)}")
        return False

    def get_absolute_path(self, relative_path: str) -> str:
        return str(self._resolve_safe_path(relative_path))
