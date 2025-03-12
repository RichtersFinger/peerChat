"""Definitions for desktop notifications."""

import threading
import asyncio

from desktop_notifier import DesktopNotifier

from peer_chat.common import Conversation, Message


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
        self._notifier_stop = threading.Event()

    def start(self) -> None:
        """Starts the service-loop."""
        with self._notifier_thread_lock:
            if self.thread is None or not self.thread.is_alive():
                self.thread = threading.Thread(
                    target=self._run_notifier, daemon=True
                )
                self.thread.start()

    def stop(self) -> None:
        """Stops the service-loop."""
        self.send_notifications.set()
        self._notifier_stop.set()

    def _run_notifier(self) -> None:
        """Service-loop definition."""
        loop = asyncio.new_event_loop()

        async def notify(c: Conversation, m: Message):
            await self.notifier.send(f"New message in '{c.name}'", m.body)

        self._notifier_stop.clear()
        while not self._notifier_stop.is_set():
            if self.send_notifications.is_set():
                with self.queue_lock:
                    for c, m in self.queue:
                        loop.run_until_complete(notify(c, m))
                    self.queue.clear()
                self.send_notifications.clear()

            self.send_notifications.wait(1)
        loop.close()

    def enqueue(self, c: Conversation, m: Message) -> None:
        """
        Add request to queue, run `start` if not running, and trigger
        immediate processing.
        """
        with self.queue_lock:
            self.queue.append((c, m))
        self.start()
        self.send_notifications.set()
