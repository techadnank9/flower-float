import httpx, pytest
BASE = "http://localhost:8001/api"
@pytest.fixture
def client():
    with httpx.Client(base_url=BASE, timeout=15) as c:
        yield c
