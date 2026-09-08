"""Domain exceptions of the authorization policy."""


class ActivityOwnerError(ValueError):
    """Base class of the errors raised while resolving who owns an activity."""


class OwnerRequiredError(ActivityOwnerError):
    """A REVIEWER created or edited an activity without stating its owner."""

    def __init__(self) -> None:
        super().__init__("ownerId is required for REVIEWER users")


class OwnerNotAllowedError(ActivityOwnerError):
    """A REGISTRAR tried to assign an activity to somebody else."""

    def __init__(self) -> None:
        super().__init__("REGISTRAR users can only own their own activities")
