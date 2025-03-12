"""Definitions for desktop notifications."""

import threading
import asyncio
import webbrowser

from desktop_notifier import DesktopNotifier, Button

from peer_chat.common import Conversation, Message


class Notifier:
    """
    Threaded notification-worker class. Generates desktop notifications
    based on `desktop_notifier.DesktopNotifier`.
    """

    def __init__(self, notifier: DesktopNotifier, url: str) -> None:
        self.notifier = notifier
        self.url = url

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
            await self.notifier.send(
                f"New message in '{c.name}'",
                m.body,
                buttons=[
                    Button(
                        title="View",
                        on_pressed=lambda: webbrowser.open(self.url),
                    )
                ],
            )

        async def handle_user_interaction():
            await asyncio.sleep(0)

        self._notifier_stop.clear()
        while not self._notifier_stop.is_set():
            # handle user-interaction of existing notifications by
            # restarting the loop frequently
            loop.run_until_complete(handle_user_interaction())
            if self.send_notifications.is_set():
                with self.queue_lock:
                    for c, m in self.queue:
                        # stops after creating notification
                        # relies on next task to handle user-interaction
                        loop.run_until_complete(notify(c, m))
                    self.queue.clear()
                self.send_notifications.clear()

            self.send_notifications.wait(0.1)
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
