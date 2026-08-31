export type AuthorizationTarget =
  | {
      type: 'workspace';
      id: string;
    }
  | {
      type: 'teamspace';
      id: string;
      workspaceId?: string;
    }
  | {
      type: 'page';
      id: string;
    }
  | {
      type: 'pageBlock';
      id: string;
    };
