export interface AvatarStoragePort {
  upload(userId: string, image: Buffer): Promise<string>;

  remove(userId: string): Promise<void>;
}
