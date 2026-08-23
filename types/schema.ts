/* ============================================================================
 * VERO — Auth & Onboarding data model
 * ----------------------------------------------------------------------------
 * TypeScript types + a portable SQL schema for the three tables the onboarding
 * flow writes: `users`, `user_preferences`, `user_sizes` (all keyed by user_id).
 *
 * The live prototype persists these to localStorage under:
 *   users             → "vero_users"              (array of User)
 *   user_preferences  → "vero_user_preferences"   ({ [userId]: UserPreferences })
 *   user_sizes        → "vero_user_sizes"          ({ [userId]: UserSizes })
 *   saved accounts    → "vero_saved_accounts"      (SavedAccount[], device-local)
 *   active session    → "vero_session"             (Session | null)
 *
 * Swapping localStorage for a real backend means implementing the same shapes;
 * the pages (login.html / signup.html / onboarding.html) only touch VeroAuth.
 * ==========================================================================*/

/* ------------------------------- enums ---------------------------------- */

export type InterestScope = 'fashion' | 'art' | 'both';

export type PrimaryIntent = 'buy' | 'sell' | 'both' | 'explore';

export type FashionStyle =
    | 'Quiet Luxury / Old Money'
    | '90s Minimalism'
    | 'Streetwear & Urban'
    | 'Y2K & Vintage Trend'
    | 'Classic & Tailored'
    | 'Casual & Everyday'
    | 'Goth & Dark Aesthetic';

export type ArtCategory =
    | 'Plastic Arts & Painting'
    | 'Sculpture & 3D Design'
    | 'Art Photography'
    | 'Collectible Design & Furniture'
    | 'Art Investment & Conservation';

export type LetterSize = 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type ShirtSize = LetterSize | 'Custom';

/** EU pants 34–46 (even steps) — maps to roughly US 26–38. */
export type PantsSizeEu = 34 | 36 | 38 | 40 | 42 | 44 | 46;

export type HatSize = 'S' | 'M' | 'L' | 'One size';
export type GlassesSize = 'Narrow' | 'Regular' | 'Wide';
export type GloveSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

/* ------------------------------- tables --------------------------------- */

/** `users` — one row per personal (individual) account. */
export interface User {
    id: string;                 // PK, e.g. "u_ab12cd"
    email: string;              // unique, lowercased
    username: string;           // handle derived from email or chosen
    name: string;               // display name
    avatar: string;             // avatar URL (may be empty)
    pwHash: string;             // hashed password (NEVER plaintext; prototype uses an obfuscation stand-in)
    createdAt: number;          // epoch ms
}

/** `user_preferences` — 1:1 with users, holds onboarding answers. */
export interface UserPreferences {
    userId: string;             // FK → users.id (PK)
    scope: InterestScope | null;
    fashionStyles: FashionStyle[];
    artCategories: ArtCategory[];
    intent: PrimaryIntent | null;
    skipped: boolean;           // true if the user skipped the quiz
    updatedAt: number;
}

/** `user_sizes` — 1:1 with users, personal sizing profile (fashion only). */
export interface UserSizes {
    userId: string;             // FK → users.id (PK)
    shirt: ShirtSize | null;
    pantsEu: PantsSizeEu | null;
    jacket: LetterSize | null;
    coat: LetterSize | null;
    hat: HatSize | null;
    glasses: GlassesSize | null;
    gloves: GloveSize | null;
    updatedAt: number;
}

/* --------------------------- auth / session ----------------------------- */

/** Active session (access token). Presence ⇒ logged in. */
export interface Session {
    userId: string;
    accessToken: string;
    issuedAt: number;
    expiresAt: number;
}

/**
 * Device-local "saved account" retained across logout for one-tap re-auth.
 * `refresh` is the sealed (encrypted) refresh token — in a native build this
 * lives in Keychain/Keystore, not in web storage.
 */
export interface SavedAccount {
    id: string;                 // = User.id
    username: string;
    name: string;
    avatar: string;
    refresh: string;            // sealed refresh token (opaque)
    lastLogin: number;
}

/* ---- The VeroAuth surface exposed by auth.js (for typed callers) -------- */
export interface VeroAuthApi {
    session(): Session | null;
    isLoggedIn(): boolean;
    currentUser(): User | null;
    savedAccounts(): SavedAccount[];
    forgetAccount(id: string): void;
    signUp(email: string, password: string, name?: string): User;
    login(email: string, password: string): User;   // throws 'NO_USER' | 'BAD_PASSWORD'
    oneTap(accountId: string): User;                 // throws 'NOT_SAVED' | 'STALE_TOKEN'
    logout(): void;
    hasOnboarded(userId?: string): boolean;
    markOnboarded(userId?: string): void;
    guard(role: 'protected' | 'onboarding' | 'auth'): boolean;
}
