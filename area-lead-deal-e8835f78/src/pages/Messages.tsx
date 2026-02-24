import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Send, Loader2, MessageCircle, ArrowLeft, Search, User,
    Shield, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
    fetchConversations,
    getOrCreateConversation,
    fetchMessages,
    sendMessage,
    subscribeToMessages,
    markConversationAsRead,
    getOtherUserId,
    ensureUserKeysExist,
    type ConversationWithDetails,
    type DecryptedMessage,
} from '@/lib/chat';

const Messages: React.FC = () => {
    const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [activeOtherUser, setActiveOtherUser] = useState<ConversationWithDetails['otherUser'] | null>(null);
    const [activeLeadCategory, setActiveLeadCategory] = useState<string | undefined>();
    const [messages, setMessages] = useState<DecryptedMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showChat, setShowChat] = useState(false); // mobile: toggle list/chat

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    // ── Init: load conversations + check for lead-specific chat ──
    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }

        const init = async () => {
            setLoading(true);
            try {
                await ensureUserKeysExist(user.id);
                await loadConversations();

                // If ?lead=<id> in URL, open that chat
                const leadId = searchParams.get('lead');
                if (leadId) {
                    await openLeadChat(leadId);
                }
            } catch (err) {
                console.error('Failed to init chat:', err);
            }
            setLoading(false);
        };

        init();
    }, [user]);

    const loadConversations = async () => {
        if (!user) return;
        const convs = await fetchConversations(user.id);
        setConversations(convs);
    };

    // ── Open a lead-specific chat ──
    const openLeadChat = async (leadId: string) => {
        if (!user) return;

        // Fetch the lead to find the other user
        const { data: lead } = await supabase
            .from('leads')
            .select('created_by, claimed_by, categories(name)')
            .eq('id', leadId)
            .maybeSingle();

        if (!lead) return;

        const otherUserId = lead.created_by === user.id ? lead.claimed_by : lead.created_by;
        if (!otherUserId) return;

        try {
            const convId = await getOrCreateConversation(user.id, otherUserId, leadId);
            await loadConversations();
            await openConversation(convId);
        } catch (err) {
            console.error('Failed to open lead chat:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to open chat. The other user may not have set up their encryption keys yet.',
            });
        }
    };

    // ── Open a conversation ──
    const openConversation = async (convId: string) => {
        if (!user) return;

        setChatLoading(true);
        setActiveConvId(convId);
        setShowChat(true);

        // Find the conversation details
        const conv = conversations.find(c => c.id === convId);
        if (conv) {
            setActiveOtherUser(conv.otherUser);
            setActiveLeadCategory(conv.leadCategory);
        } else {
            // Fetch other user info
            const otherId = await getOtherUserId(convId, user.id);
            if (otherId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, user_name, profile_image')
                    .eq('id', otherId)
                    .maybeSingle();

                setActiveOtherUser({
                    id: otherId,
                    name: (profile as any)?.user_name || 'User',
                    profile_image: (profile as any)?.profile_image || null,
                });
            }
        }

        // Fetch messages
        const otherId = conv?.otherUser?.id || (await getOtherUserId(convId, user.id));
        if (otherId) {
            const msgs = await fetchMessages(convId, otherId);
            setMessages(msgs);
            await markConversationAsRead(convId, user.id);
        }

        setChatLoading(false);
    };

    // ── Realtime subscription ──
    useEffect(() => {
        if (!activeConvId || !activeOtherUser || !user) return;

        const unsubscribe = subscribeToMessages(
            activeConvId,
            activeOtherUser.id,
            (msg) => {
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                // Mark as read if from other user
                if (msg.sender_id !== user.id) {
                    markConversationAsRead(activeConvId, user.id);
                }
            }
        );

        return unsubscribe;
    }, [activeConvId, activeOtherUser?.id, user?.id]);

    // ── Auto-scroll to bottom ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Send message ──
    const handleSend = async () => {
        if (!newMessage.trim() || !activeConvId || !activeOtherUser || !user || sending) return;

        const text = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            await sendMessage(activeConvId, user.id, activeOtherUser.id, text);
            // Refresh conversation list to update last message
            loadConversations();
        } catch (err) {
            console.error('Send failed:', err);
            toast({
                variant: 'destructive',
                title: 'Failed to send',
                description: 'Message could not be sent. Please try again.',
            });
            setNewMessage(text); // restore the message
        }

        setSending(false);
        inputRef.current?.focus();
    };

    // ── Filter conversations ──
    const filteredConversations = conversations.filter(c =>
        c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.leadCategory && c.leadCategory.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // ── Back to list (mobile) ──
    const handleBackToList = () => {
        setShowChat(false);
        setActiveConvId(null);
        loadConversations(); // refresh
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Setting up secure chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background md:ml-60">
            {/* Mobile Header */}
            <div className="md:hidden">
                {showChat && activeOtherUser ? (
                    <Header
                        title={activeOtherUser.name}
                        showBack
                        onBack={handleBackToList}
                    />
                ) : (
                    <Header title="Messages" />
                )}
            </div>

            <div className="flex h-[calc(100vh-4rem)] md:h-screen">
                {/* ── Left Panel: Conversation List ── */}
                <div className={`
          w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col
          ${showChat ? 'hidden md:flex' : 'flex'}
        `}>
                    {/* Desktop Header */}
                    <div className="hidden md:flex items-center justify-between p-4 border-b border-border">
                        <h1 className="text-lg font-bold text-foreground">Messages</h1>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield size={12} />
                            E2E Encrypted
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/50 border-0 rounded-xl h-10"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <MessageCircle className="text-primary" size={28} />
                                </div>
                                <h3 className="text-base font-semibold text-foreground mb-1">No conversations yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Chat with lead generators or claimers from the Lead Details page.
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => openConversation(conv.id)}
                                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border/50 text-left ${activeConvId === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        {conv.otherUser.profile_image ? (
                                            <img
                                                src={conv.otherUser.profile_image}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User size={20} className="text-primary" />
                                            </div>
                                        )}
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className="text-sm font-semibold text-foreground truncate">
                                                {conv.otherUser.name}
                                            </h4>
                                            {conv.lastMessage && (
                                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                    {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false })}
                                                </span>
                                            )}
                                        </div>
                                        {conv.leadCategory && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 mb-0.5 border-primary/30 text-primary">
                                                {conv.leadCategory}
                                            </Badge>
                                        )}
                                        {conv.lastMessage && (
                                            <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                {conv.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                                                {conv.lastMessage.text}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Right Panel: Chat Window ── */}
                <div className={`
          flex-1 flex flex-col bg-background
          ${!showChat ? 'hidden md:flex' : 'flex'}
        `}>
                    {activeConvId && activeOtherUser ? (
                        <>
                            {/* Desktop Chat Header */}
                            <div className="hidden md:flex items-center gap-3 p-4 border-b border-border bg-card">
                                {activeOtherUser.profile_image ? (
                                    <img
                                        src={activeOtherUser.profile_image}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User size={18} className="text-primary" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-foreground truncate">
                                        {activeOtherUser.name}
                                    </h3>
                                    {activeLeadCategory && (
                                        <p className="text-xs text-muted-foreground">
                                            Lead: {activeLeadCategory}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                                    <Lock size={10} />
                                    Encrypted
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                {chatLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                                            <Lock className="text-primary" size={24} />
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground mb-1">End-to-end encrypted</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Messages are encrypted. Only you and {activeOtherUser.name} can read them.
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isOwn = msg.sender_id === user?.id;
                                        const showTimestamp = i === 0 || (
                                            new Date(msg.created_at).getTime() -
                                            new Date(messages[i - 1].created_at).getTime() > 300000
                                        );

                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showTimestamp && (
                                                    <div className="flex justify-center">
                                                        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                                            {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`
                            max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                            ${isOwn
                                                            ? 'bg-primary text-primary-foreground rounded-br-md'
                                                            : 'bg-card border border-border text-foreground rounded-bl-md'
                                                        }
                          `}>
                                                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                                        <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                                                            }`}>
                                                            {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-3 border-t border-border bg-card safe-area-bottom">
                                <form
                                    onSubmit={e => { e.preventDefault(); handleSend(); }}
                                    className="flex items-center gap-2"
                                >
                                    <Input
                                        ref={inputRef}
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-muted/50 border-0 rounded-xl h-11"
                                        disabled={sending}
                                    />
                                    <Button
                                        type="submit"
                                        variant="hero"
                                        size="icon"
                                        className="shrink-0 rounded-xl w-11 h-11"
                                        disabled={!newMessage.trim() || sending}
                                    >
                                        {sending ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        /* Empty state — no chat selected (desktop) */
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-center px-6">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="text-primary" size={36} />
                            </div>
                            <h2 className="text-lg font-bold text-foreground mb-2">Your Messages</h2>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Select a conversation to start chatting, or open a lead to begin a new conversation.
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4 bg-muted/50 px-3 py-1.5 rounded-full">
                                <Shield size={12} />
                                All messages are end-to-end encrypted
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default Messages;
