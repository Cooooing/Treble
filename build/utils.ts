export interface ViteEnv {
  VITE_COMPRESS?: boolean;
  VITE_DROP_CONSOLE?: boolean;
  [key: string]: string | boolean | undefined;
}

export function wrapperEnv(envConf: Record<string, string>): ViteEnv {
  const ret: ViteEnv = {};

  for (const envName of Object.keys(envConf)) {
    let realName: string | boolean = envConf[envName].replace(/\\n/g, "\n");
    realName = realName === "true" ? true : realName === "false" ? false : realName;

    ret[envName] = realName;
    if (typeof realName === "string") {
      process.env[envName] = realName;
    }
  }
  return ret;
}
