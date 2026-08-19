declare global {
  type MetaPixelCommand = "consent" | "init" | "track" | "trackCustom";

  type MetaPixelFunction = {
    (command: MetaPixelCommand, ...args: unknown[]): void;
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[][];
    loaded: boolean;
    version: string;
    push: MetaPixelFunction;
  };

  type TcfApiData = {
    eventStatus?: "tcloaded" | "cmpuishown" | "useractioncomplete";
    gdprApplies?: boolean;
    listenerId?: number;
    purpose?: {
      consents?: Record<string, boolean>;
    };
  };

  type TcfApi = (
    command: "addEventListener" | "removeEventListener",
    version: 2,
    callback: (data: TcfApiData, success: boolean) => void,
    parameter?: number,
  ) => void;

  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
    __tcfapi?: TcfApi;
    __vmDinnerPlanRegistrationRequested?: boolean;
  }
}

export {};
