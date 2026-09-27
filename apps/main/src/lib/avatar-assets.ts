export type AssetAvatarReference = {
  type: "asset";
  asset_id: string;
};

const AVATAR_ASSETS: Record<string, string> = {
  avatar_001: "/avatars/avatar_001.jpg",
};

export function resolveAvatarAsset(avatar: AssetAvatarReference | null | undefined): string | null {
  if (!avatar || avatar.type !== "asset") return null;
  return AVATAR_ASSETS[avatar.asset_id] ?? null;
}
