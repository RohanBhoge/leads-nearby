import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationData {
    id: string;
    senderName: string;
    senderImage: string | null;
    conversationId: string;
}

const NOTIFICATION_DURATION = 5000;

const MessageNotificationBanner: React.FC = () => {
    const [notification, setNotification] = useState<NotificationData | null>(null);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const dismiss = useCallback(() => {
        setVisible(false);
        setTimeout(() => setNotification(null), 350);
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('global-msg-notif')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload) => {
                    const msg = payload.new as {
                        id: string;
                        conversation_id: string;
                        sender_id: string;
                    };

                    // Skip messages from self
                    if (msg.sender_id === user.id) return;

                    // Skip if already on messages page
                    if (location.pathname === '/messages') return;

                    // Check user is a participant
                    const { data: part } = await supabase
                        .from('conversation_participants')
                        .select('conversation_id')
                        .eq('conversation_id', msg.conversation_id)
                        .eq('user_id', user.id)
                        .maybeSingle();

                    if (!part) return;

                    // Get sender info
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('user_name, profile_image')
                        .eq('id', msg.sender_id)
                        .maybeSingle();

                    const notif: NotificationData = {
                        id: msg.id,
                        senderName: (profile as any)?.user_name || 'Someone',
                        senderImage: (profile as any)?.profile_image || null,
                        conversationId: msg.conversation_id,
                    };

                    setNotification(notif);
                    setVisible(true);

                    if (timerRef.current) clearTimeout(timerRef.current);
                    timerRef.current = setTimeout(dismiss, NOTIFICATION_DURATION);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [user, location.pathname, dismiss]);

    if (!notification) return null;

    return (
        <div
            className={`
                fixed top-4 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm
                transform -translate-x-1/2 transition-all duration-300 ease-out
                ${visible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'}
            `}
            style={{ pointerEvents: visible ? 'auto' : 'none' }}
        >
            <button
                onClick={() => { navigate('/messages'); dismiss(); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl shadow-2xl text-left
                    backdrop-blur-xl bg-card/95 border border-border/60
                    hover:scale-[1.01] active:scale-[0.99] transition-transform"
            >
                {/* Avatar */}
                <div className="relative shrink-0">
                    {notification.senderImage ? (
                        <img
                            src={notification.senderImage}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center">
                            <MessageSquare size={20} className="text-primary" />
                        </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-primary">Leads Nearby</span>
                        <span className="text-xs text-muted-foreground">· now</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">
                        {notification.senderName}
                    </p>
                    <p className="text-xs text-muted-foreground">🔒 New encrypted message</p>
                </div>

                {/* Dismiss button */}
                <button
                    onClick={(e) => { e.stopPropagation(); dismiss(); }}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                        hover:bg-muted/70 text-muted-foreground transition-colors"
                >
                    <X size={14} />
                </button>
            </button>
        </div>
    );
};

export default MessageNotificationBanner;
