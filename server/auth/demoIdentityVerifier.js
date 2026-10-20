import { scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export function createDemoIdentityVerifier(db) {
  const find = db.prepare('SELECT actor_id, password_salt, password_hash FROM demo_identities WHERE email = ?');
  const fallback = db.prepare('SELECT password_salt, password_hash FROM demo_identities LIMIT 1');
  return async function verify({ email, password }) {
    const identity = find.get(email.toLowerCase());
    const verifier = identity ?? fallback.get();
    if (!verifier) return null;
    const actual = await scrypt(password, Buffer.from(verifier.password_salt, 'hex'), 64);
    const expected = Buffer.from(verifier.password_hash, 'hex');
    return timingSafeEqual(actual, expected) && identity ? identity.actor_id : null;
  };
}
