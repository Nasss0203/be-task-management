export interface AvatarStoragePort {
  upload(userId: string, image: Buffer, contentType: string): Promise<string>;

  remove(userId: string, avatarUrl: string): Promise<void>;
}
