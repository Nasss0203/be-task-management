/**
 * Mention trong nội dung lưu dạng `@[Tên hiển thị](user:<uuid>)`.
 * Tên chỉ để hiển thị; ai được nhắc tới lấy theo uuid.
 */
const MENTION_TOKEN = /@\[([^\]\n]{1,100})\]\(user:([0-9a-f-]{36})\)/gi;

export function parseMentionedUserIds(body: string): string[] {
  const ids = [...body.matchAll(MENTION_TOKEN)].map((match) =>
    match[2].toLowerCase(),
  );

  return [...new Set(ids)];
}

const ANY_MENTION_TOKEN =
  /@\[([^\]\n]{1,100})\]\((user|page|database):([0-9a-f-]{36})\)/gi;

/** Nội dung dạng chữ thường (`@Tên`) để đặt vào thông báo. */
export function mentionTokensToText(body: string): string {
  return body.replace(
    ANY_MENTION_TOKEN,
    (_, label: string, kind: string) =>
      `@${kind.toLowerCase() === 'user' ? label : kind.toLowerCase()}`,
  );
}
