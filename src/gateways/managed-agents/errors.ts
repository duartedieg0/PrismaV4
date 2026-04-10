export class ManagedAgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ManagedAgentError";
  }
}

export class SessionNotFoundError extends ManagedAgentError {
  constructor(sessionId: string) {
    super(`Sessão não encontrada: ${sessionId}`, "SESSION_NOT_FOUND");
    this.name = "SessionNotFoundError";
  }
}

export class SessionStreamError extends ManagedAgentError {
  constructor(message: string) {
    super(message, "SESSION_STREAM_ERROR");
    this.name = "SessionStreamError";
  }
}
