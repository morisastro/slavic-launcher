import { Auth } from "msmc";

export interface MsResult {
  profile: { id: string; name: string };
  mclc: {
    access_token: string;
    client_token?: string;
    uuid: string;
    name: string;
    user_properties: unknown;
    meta?: { type: "mojang" | "msa"; xuid?: string; demo?: boolean };
  };
}

// Microsoft login via an Electron BrowserWindow (msmc's "electron" framework).
export async function loginMicrosoft(): Promise<MsResult> {
  const authManager = new Auth("select_account");
  const xbox = await authManager.launch("electron");
  const mc = await xbox.getMinecraft();
  if (!mc.profile) throw new Error("This Microsoft account does not own Minecraft.");
  const mclc = mc.mclc(true) as MsResult["mclc"];
  return {
    profile: { id: mc.profile.id, name: mc.profile.name },
    mclc,
  };
}
