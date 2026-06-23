import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./SupabaseClient";

export interface AuthUser {
    id: string;
    email: string;
}

function mapUser(user: User | null): AuthUser | null {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email ?? ""
    };
}

export class CloudAuthService {
    async getSession(): Promise<Session | null> {
        const client = getSupabaseClient();

        if (!client) {
            return null;
        }

        const { data, error } = await client.auth.getSession();

        if (error) {
            throw error;
        }

        return data.session;
    }

    async getCurrentUser(): Promise<AuthUser | null> {
        const session = await this.getSession();
        return mapUser(session?.user ?? null);
    }

    async register(email: string, password: string): Promise<AuthUser> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { data, error } = await client.auth.signUp({
            email,
            password
        });

        if (error) {
            throw error;
        }

        const user = mapUser(data.user);

        if (!user) {
            throw new Error("Registration did not return a user.");
        }

        return user;
    }

    async login(email: string, password: string): Promise<AuthUser> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        const user = mapUser(data.user);

        if (!user) {
            throw new Error("Login did not return a user.");
        }

        return user;
    }

    async logout(): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            return;
        }

        const { error } = await client.auth.signOut();

        if (error) {
            throw error;
        }
    }

    onAuthStateChange(callback: (user: AuthUser | null) => void) {
        const client = getSupabaseClient();

        if (!client) {
            callback(null);
            return () => undefined;
        }

        const { data } = client.auth.onAuthStateChange((_event, session) => {
            callback(mapUser(session?.user ?? null));
        });

        return () => {
            data.subscription.unsubscribe();
        };
    }
}

export const cloudAuthService = new CloudAuthService();

export async function login(email: string, password: string): Promise<AuthUser> {
    return cloudAuthService.login(email, password);
}

export async function register(email: string, password: string): Promise<AuthUser> {
    return cloudAuthService.register(email, password);
}

export async function logout(): Promise<void> {
    return cloudAuthService.logout();
}
