const INITIALS_MAX = 2;

export function userInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter((part) => part !== '')
    .slice(0, INITIALS_MAX)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
