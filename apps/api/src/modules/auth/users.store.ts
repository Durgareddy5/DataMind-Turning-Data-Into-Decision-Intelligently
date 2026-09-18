import bcrypt from "bcrypt";

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  roles: string[];
}

// In-memory placeholder, same pattern as conversations.store.ts: swap for a
// real user directory (a DB table or an identity provider like Okta/Auth0)
// before running this beyond local development. Passwords here are seed
// values for demo/testing only.
const SEED_CREDENTIALS: Array<{ id: string; username: string; password: string; roles: string[] }> = [
  { id: "u-admin", username: "admin", password: "admin123", roles: ["admin"] },
  { id: "u-analyst", username: "analyst", password: "analyst123", roles: ["analyst"] },
  { id: "u-sales", username: "sales", password: "sales123", roles: ["sales"] },
  { id: "u-finance", username: "finance", password: "finance123", roles: ["finance"] },
  { id: "u-hr", username: "hr", password: "hr123", roles: ["hr"] },
];

const usersByUsername = new Map<string, StoredUser>(
  SEED_CREDENTIALS.map((u) => [
    u.username,
    { id: u.id, username: u.username, passwordHash: bcrypt.hashSync(u.password, 10), roles: u.roles },
  ])
);

export function findUserByUsername(username: string): StoredUser | undefined {
  return usersByUsername.get(username);
}
