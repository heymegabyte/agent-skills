# Design

**Architect Role:** assigned

Exit when switching to the repository root fails so verification cannot continue against the caller's directory. Apply shfmt 3.10.0 to the affected script. Keep the ownership checks, messages, and exit behavior for normal invocations.
