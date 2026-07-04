from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql://kb_eval:kb_eval@localhost:5432/kb_eval"
    redis_url: str = "redis://localhost:6379/0"
    app_env: str = "development"
    app_version: str = "0.1.0"
    cors_origins: list[str] = ["http://localhost:5173"]
    mcp_connect_timeout_seconds: float = 10.0
    mcp_read_timeout_seconds: float = 30.0
    mcp_retry_attempts: int = 2
    mcp_mock_enabled: bool = True
    mcp_mock_domains: list[str] = ["example.com"]


settings = Settings()
