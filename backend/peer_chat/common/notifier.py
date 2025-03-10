"""Definitions for desktop notifications."""

import threading
import asyncio

try:
    from desktop_notifier import DesktopNotifier

    USE_NOTIFICATIONS = True
except ImportError:
    DesktopNotifier = None
    USE_NOTIFICATIONS = False


class Notifier:
    """
    Threaded notification-worker class. Generates desktop notifications
    based on `desktop_notifier.DesktopNotifier`.
    """
    def __init__(self, notifier: DesktopNotifier) -> None:
        self.notifier = notifier

        self.send_notifications = threading.Event()
        self.queue_lock = threading.Lock()
        self.queue = []

        self.thread = None
        self._notifier_thread_lock = threading.Lock()

    def start(self):
        """Starts the service-loop."""
        with self._notifier_thread_lock:
            if self.thread is None or not self.thread.is_alive():
                self.thread = threading.Thread(
                    target=self._run_notifier, daemon=True
                )
                self.thread.start()

    def _run_notifier(self):
        """Service-loop definition."""
        loop = asyncio.new_event_loop()

        async def notify(c, m):
            await self.notifier.send(f"New message in '{c.name}'", m.body)

        while True:
            if self.send_notifications.is_set():
                with self.queue_lock:
                    for c, m in self.queue:
                        loop.run_until_complete(notify(c, m))
                    self.queue.clear()
                self.send_notifications.clear()

            self.send_notifications.wait(1)
        loop.close()
