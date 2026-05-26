"""Supabase client singleton for AI service."""
import os
from types import SimpleNamespace
from supabase import create_client, Client

_client: Client = None


class _NoopQuery:
    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def in_(self, *args, **kwargs):
        return self

    def lt(self, *args, **kwargs):
        return self

    def lte(self, *args, **kwargs):
        return self

    def gte(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def single(self):
        return self

    def insert(self, *args, **kwargs):
        return self

    def update(self, *args, **kwargs):
        return self

    def upsert(self, *args, **kwargs):
        return self

    def execute(self):
        return SimpleNamespace(data=[], count=0)


class _NoopAuth:
    def get_user(self, *args, **kwargs):
        return SimpleNamespace(data=SimpleNamespace(user=None), error=None)


class _NoopSupabase:
    auth = _NoopAuth()

    def from_(self, *args, **kwargs):
        return _NoopQuery()

    def rpc(self, *args, **kwargs):
        return _NoopQuery()


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            _client = _NoopSupabase()
            return _client
        _client = create_client(url, key)
    return _client
