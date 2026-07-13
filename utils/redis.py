from upstash_redis import Redis
from dotenv import load_dotenv
import os

load_dotenv()

r = Redis(url="https://leading-gull-111037.upstash.io", token=os.getenv("REDIS_TOKEN")

#r.set("foo", "bar")
#value = red.get("foo")