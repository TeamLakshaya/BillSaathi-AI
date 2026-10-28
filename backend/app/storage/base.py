from abc import ABC, abstractmethod


class StorageProvider(ABC):
    @abstractmethod
    def save(self, content: bytes, destination_path: str) -> str:
        """Saves file content to destination_path and returns the stored relative path."""
        pass

    @abstractmethod
    def read(self, relative_path: str) -> bytes:
        """Reads file content from relative_path."""
        pass

    @abstractmethod
    def delete(self, relative_path: str) -> bool:
        """Deletes file if exists."""
        pass

    @abstractmethod
    def get_absolute_path(self, relative_path: str) -> str:
        """Returns the absolute path for local files or safe resolver."""
        pass
