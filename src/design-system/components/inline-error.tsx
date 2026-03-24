type InlineErrorProps = Readonly<{
  message: string;
}>;

export function InlineError({ message }: InlineErrorProps) {
  return (
    <p
      role="alert"
      style={{
        color: "var(--danger)",
        margin: 0,
        fontSize: "0.92rem",
        fontWeight: 600,
      }}
    >
      {message}
    </p>
  );
}
