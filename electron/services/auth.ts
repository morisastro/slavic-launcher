import * as path from "path";
import { readJson, writeJson, DATA_DIR } from "./storage";
import { randomUuid } from "../util/uuid";
import { loginMicrosoft as msLogin } from "./ms-auth";

export interface Account {
  uuid: string;
  username: string;
  type: "offline" | "microsoft";
  accessToken?: string;
  /** MCLC-shaped auth object used at launch time */
  mclcAuth?: {
    access_token: string;
    client_token?: string;
    uuid: string;
    name: string;
    user_properties: unknown;
    meta?: { type: "mojang" | "msa"; xuid?: string; demo?: boolean };
  };
}

interface AccountStore {
  accounts: Account[];
  active: string | null;
}

const FILE = path.join(DATA_DIR, "accounts.json");

function load(): AccountStore {
  return readJson<AccountStore>(FILE, { accounts: [], active: null });
}
function save(s: AccountStore) {
  writeJson(FILE, s);
}

class AuthService {
  list(): Account[] {
    return load().accounts;
  }
  getActive(): Account | null {
    const s = load();
    return s.accounts.find((a) => a.uuid === s.active) ?? null;
  }
  setActive(uuid: string) {
    const s = load();
    if (s.accounts.some((a) => a.uuid === uuid)) {
      s.active = uuid;
      save(s);
    }
  }
  addOffline(name: string): Account {
    const s = load();
    const uuid = randomUuid();
    const acc: Account = {
      uuid,
      username: name,
      type: "offline",
      mclcAuth: {
        access_token: "offline",
        client_token: uuid,
        uuid,
        name,
        user_properties: "{}",
        meta: { type: "mojang" },
      },
    };
    s.accounts.push(acc);
    if (!s.active) s.active = acc.uuid;
    save(s);
    return acc;
  }
  remove(uuid: string) {
    const s = load();
    s.accounts = s.accounts.filter((a) => a.uuid !== uuid);
    if (s.active === uuid) s.active = s.accounts[0]?.uuid ?? null;
    save(s);
  }
  async loginMicrosoft(): Promise<Account> {
    const result = await msLogin();
    const s = load();
    const acc: Account = {
      uuid: result.profile.id,
      username: result.profile.name,
      type: "microsoft",
      accessToken: result.mclc.access_token,
      mclcAuth: result.mclc,
    };
    const existing = s.accounts.findIndex((a) => a.uuid === acc.uuid);
    if (existing >= 0) s.accounts[existing] = acc;
    else s.accounts.push(acc);
    s.active = acc.uuid;
    save(s);
    return acc;
  }
}

export const authService = new AuthService();
