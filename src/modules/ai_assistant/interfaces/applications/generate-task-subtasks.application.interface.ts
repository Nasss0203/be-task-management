export interface GenerateTaskSubtasksApplication {
  generate(input: { taskId: string; userId: string }): Promise<any[]>;
}
