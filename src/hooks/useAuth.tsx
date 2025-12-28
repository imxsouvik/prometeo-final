import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UserRole = "user" | "admin" | "super_admin" | null;
type AdminStatus = "pending" | "approved" | "rejected" | "suspended" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  adminStatus: AdminStatus;
  loading: boolean;
  signUp: (email: string, password: string, metadata: UserMetadata) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface UserMetadata {
  name: string;
  phone: string;
  isAdmin: boolean;
  department?: "hospital" | "fire_station" | "police";
  verificationIdUrl?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [adminStatus, setAdminStatus] = useState<AdminStatus>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data?.role as UserRole;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  const fetchAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("status")
        .eq("user_id", userId)
        .single();

      if (error) {
        return null;
      }

      return data?.status as AdminStatus;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Defer role fetching with setTimeout to prevent deadlock
      if (session?.user) {
        setTimeout(async () => {
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);

          // Always refresh admin status when the user is an admin
          if (role === "admin") {
            const status = await fetchAdminStatus(session.user.id);
            setAdminStatus(status);
          } else {
            setAdminStatus(null);
          }
        }, 0);
      } else {
        setUserRole(null);
        setAdminStatus(null);
      }

      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id).then((role) => {
          setUserRole(role);
          if (role === "admin") {
            fetchAdminStatus(session.user.id).then(setAdminStatus);
          } else {
            setAdminStatus(null);
          }
        });
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keep adminStatus in sync if a Super Admin approves/rejects while the admin is logged in
  useEffect(() => {
    if (!user?.id || userRole !== "admin") return;

    const channel = supabase
      .channel(`admin-profile-status:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admin_profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const next = (payload.new as { status?: AdminStatus })?.status ?? null;
          setAdminStatus(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, userRole]);


  const signUp = async (email: string, password: string, metadata: UserMetadata) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      const userId = authData.user.id;

      if (metadata.isAdmin) {
        // Create admin profile
        const { error: profileError } = await supabase
          .from("admin_profiles")
          .insert({
            user_id: userId,
            name: metadata.name,
            phone: metadata.phone,
            email: email,
            department: metadata.department!,
            verification_id_url: metadata.verificationIdUrl!,
            status: "pending",
          });

        if (profileError) throw profileError;

        // Create admin role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "admin",
          });

        if (roleError) throw roleError;

        setAdminStatus("pending");
      } else {
        // Create user profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            name: metadata.name,
            phone: metadata.phone,
            email: email,
          });

        if (profileError) throw profileError;

        // Create user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "user",
          });

        if (roleError) throw roleError;
      }

      return { error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setAdminStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        adminStatus,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
