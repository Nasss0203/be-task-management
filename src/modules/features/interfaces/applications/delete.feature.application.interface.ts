export interface DeleteFeatureApplication {
  delete(id: string): Promise<void>;
}
