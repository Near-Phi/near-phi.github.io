"""
Near Phi - X/Twitter posting automation via agent-browser
Usage:
    python scripts/post_to_x.py "Your post text here"
    python scripts/post_to_x.py --thread "Post 1" "Post 2" "Post 3"
    python scripts/post_to_x.py --draft "Preview this post without sending"
"""
import subprocess
import sys
import json
import time

AGENT_BROWSER = r"C:\Users\damon\AppData\Roaming\npm\agent-browser.cmd"
X_COMPOSE_URL = "https://x.com/compose/post"

def post_single(text: str, dry_run: bool = False):
    """Post a single tweet via agent-browser."""
    if dry_run:
        print(f"[DRAFT] Would post:\n{text}\n({len(text)} chars)")
        return True

    if len(text) > 280:
        print(f"WARNING: Post is {len(text)} chars (limit 280)")
        confirm = input("Continue anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            return False

    # Use agent-browser to compose and send
    steps = json.dumps([
        {"action": "open", "url": X_COMPOSE_URL},
        {"action": "wait", "seconds": 3},
        {"action": "type", "text": text},
        {"action": "wait", "seconds": 1},
        {"action": "click", "selector": "[data-testid='tweetButton']"},
        {"action": "wait", "seconds": 3},
        {"action": "screenshot"}
    ])

    print(f"Posting: {text[:80]}...")
    result = subprocess.run(
        [AGENT_BROWSER, "run", "--steps", steps],
        capture_output=True, text=True, timeout=60
    )

    if result.returncode == 0:
        print("Posted successfully.")
        return True
    else:
        print(f"Error: {result.stderr}")
        return False


def post_thread(posts: list[str], dry_run: bool = False):
    """Post a thread (multiple posts in sequence)."""
    if dry_run:
        print("[DRAFT] Thread preview:")
        for i, p in enumerate(posts, 1):
            print(f"  [{i}/{len(posts)}] {p} ({len(p)} chars)")
        return True

    for i, post in enumerate(posts):
        print(f"\n--- Post {i+1}/{len(posts)} ---")
        success = post_single(post, dry_run=False)
        if not success:
            print(f"Thread stopped at post {i+1}")
            return False
        if i < len(posts) - 1:
            time.sleep(5)  # Wait between thread posts

    print(f"\nThread complete ({len(posts)} posts)")
    return True


if __name__ == "__main__":
    args = sys.argv[1:]

    if not args:
        print(__doc__)
        sys.exit(1)

    if args[0] == "--draft":
        if "--thread" in args:
            args.remove("--thread")
            args.remove("--draft")
            post_thread(args, dry_run=True)
        else:
            args.remove("--draft")
            post_single(" ".join(args), dry_run=True)
    elif args[0] == "--thread":
        post_thread(args[1:])
    else:
        post_single(" ".join(args))
