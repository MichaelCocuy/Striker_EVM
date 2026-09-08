"""Domain exceptions of the EVM module."""


class InvalidActivityError(ValueError):
    """Raised when an activity input violates the EVM domain rules."""

    def __init__(self, field: str, message: str) -> None:
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")
