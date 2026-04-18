const urlPattern = /(https?:\/\/[^\s]+)/g;

export function MessageContent({ text, isMine }: { text: string; isMine: boolean }) {
  const parts = text.split(urlPattern);

  return (
    <p className="text-sm whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={`${part}-${index}`}
              href={part}
              target="_blank"
              rel="noreferrer"
              className={`font-semibold underline underline-offset-2 ${isMine ? "text-primary-foreground" : "text-primary"}`}
            >
              {part}
            </a>
          );
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </p>
  );
}