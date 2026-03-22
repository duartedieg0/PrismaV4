export type AdminConfigSection = {
  title: string;
  description: string;
  href: string;
};

export type EnabledNameEntity = {
  id: string;
  name: string;
  enabled: boolean;
};

export type SelectOption = {
  id: string;
  name: string;
};

export type AdminRouteAccess =
  | {
      kind: "ok";
      userId: string;
      role: "admin";
    }
  | {
      kind: "error";
      response: Response;
    };
