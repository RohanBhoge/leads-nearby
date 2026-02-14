import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const AdminRoute = () => {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setChecking(false);
                return;
            }

            try {
                // @ts-ignore
                const { data, error } = await supabase.rpc('has_role', {
                    _user_id: user.id,
                    _role: 'admin',
                });

                if (error) {
                    console.error('Error checking admin role:', error);
                    setIsAdmin(false);
                } else {
                    setIsAdmin(data === true);
                }
            } catch (error) {
                console.error('Failed to check admin status:', error);
                setIsAdmin(false);
            } finally {
                setChecking(false);
            }
        };

        if (!authLoading) {
            checkAdminStatus();
        }
    }, [user, authLoading]);

    if (authLoading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // If user is not logged in, ProtectedRoute (if wrapped) or this will send to Auth
    // But if logged in and not admin, send to Dashboard
    if (!user) return <Navigate to="/auth" />;

    return isAdmin ? <Outlet /> : <Navigate to="/dashboard" />;
};
