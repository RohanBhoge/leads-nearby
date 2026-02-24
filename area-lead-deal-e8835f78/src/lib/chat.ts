/**
 * Chat service layer — CRUD operations + Supabase Realtime
 * Messages stored as plaintext, secured by RLS policies + HTTPS
 */

import { supabase } from '@/integrations/supabase/client';

// ========== Types ==========

export interface Conversation {
    id: string;
    lead_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
    otherUser: {
        id: string;
        name: string;
        profile_image: string | null;
    };
    lastMessage?: {
        text: string;
        created_at: string;
        sender_id: string;
    };
    unreadCount: number;
    leadCategory?: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

// ========== Conversation Operations ==========

/**
 * Find an existing conversation between two users for a specific lead,
 * or create a new one.
 */
export async function getOrCreateConversation(
    currentUserId: string,
    otherUserId: string,
    leadId?: string
): Promise<string> {
    // Look for existing conversation between these users for this lead
    if (leadId) {
        const { data: existing } = await (supabase as any)
            .from('conversations')
            .select(`
        id,
        conversation_participants!inner(user_id)
      `)
            .eq('lead_id', leadId);

        if (existing && existing.length > 0) {
            for (const conv of existing) {
                const participantIds = conv.conversation_participants.map((p: any) => p.user_id);
                if (participantIds.includes(currentUserId) && participantIds.includes(otherUserId)) {
                    return conv.id;
                }
            }
        }
    }

    // Look for any existing conversation between these users (without lead)
    if (!leadId) {
        const { data: myConvs } = await (supabase as any)
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', currentUserId);

        if (myConvs && myConvs.length > 0) {
            const convIds = myConvs.map((c: any) => c.conversation_id);

            const { data: sharedConvs } = await (supabase as any)
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', otherUserId)
                .in('conversation_id', convIds);

            if (sharedConvs && sharedConvs.length > 0) {
                const { data: conv } = await (supabase as any)
                    .from('conversations')
                    .select('id')
                    .in('id', sharedConvs.map((c: any) => c.conversation_id))
                    .is('lead_id', null)
                    .limit(1)
                    .maybeSingle();

                if (conv) return conv.id;
            }
        }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await (supabase as any)
        .from('conversations')
        .insert({
            lead_id: leadId || null,
        })
        .select('id')
        .single();

    if (convError) {
        console.error('Conversation insert error:', convError);
        const { data: fallback } = await (supabase as any)
            .from('conversations')
            .select('id')
            .eq('lead_id', leadId || '')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!fallback) {
            throw new Error('Failed to create conversation: ' + convError.message);
        }

        const { error: partError } = await (supabase as any)
            .from('conversation_participants')
            .insert([
                { conversation_id: fallback.id, user_id: currentUserId },
                { conversation_id: fallback.id, user_id: otherUserId },
            ]);

        if (partError) console.error('Participant insert error:', partError);
        return fallback.id;
    }

    const { error: partError } = await (supabase as any)
        .from('conversation_participants')
        .insert([
            { conversation_id: newConv.id, user_id: currentUserId },
            { conversation_id: newConv.id, user_id: otherUserId },
        ]);

    if (partError) console.error('Participant insert error:', partError);
    return newConv.id;
}

/**
 * Fetch all conversations for a user with details
 */
export async function fetchConversations(
    currentUserId: string
): Promise<ConversationWithDetails[]> {
    const { data: participantRows } = await (supabase as any)
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', currentUserId);

    if (!participantRows || participantRows.length === 0) return [];

    const convIds = participantRows.map((p: any) => p.conversation_id);
    const lastReadMap = new Map(
        participantRows.map((p: any) => [p.conversation_id, p.last_read_at])
    );

    const { data: conversations } = await (supabase as any)
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('updated_at', { ascending: false });

    if (!conversations) return [];

    const results: ConversationWithDetails[] = [];

    for (const conv of conversations) {
        const { data: participants } = await (supabase as any)
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .neq('user_id', currentUserId);

        if (!participants || participants.length === 0) continue;

        const otherUserId = participants[0].user_id;

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, user_name, profile_image')
            .eq('id', otherUserId)
            .maybeSingle();

        const displayName = (profile as any)?.user_name || 'User';

        // Get last message — now plaintext
        const { data: lastMsgRows } = await (supabase as any)
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

        let lastMessage: ConversationWithDetails['lastMessage'] | undefined;
        if (lastMsgRows && lastMsgRows.length > 0) {
            const msg = lastMsgRows[0];
            const text = msg.content || '';
            lastMessage = {
                text: text.length > 50 ? text.substring(0, 50) + '...' : text,
                created_at: msg.created_at,
                sender_id: msg.sender_id,
            };
        }

        // Count unread messages
        const lastReadAt = lastReadMap.get(conv.id) || '1970-01-01';
        const { count: unreadCount } = await (supabase as any)
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', currentUserId)
            .gt('created_at', lastReadAt);

        // Get lead category if linked
        let leadCategory: string | undefined;
        if (conv.lead_id) {
            const { data: lead } = await supabase
                .from('leads')
                .select('categories(name)')
                .eq('id', conv.lead_id)
                .maybeSingle();
            leadCategory = (lead as any)?.categories?.name;
        }

        results.push({
            ...conv,
            otherUser: {
                id: otherUserId,
                name: displayName,
                profile_image: (profile as any)?.profile_image || null,
            },
            lastMessage,
            unreadCount: unreadCount || 0,
            leadCategory,
        });
    }

    return results;
}

// ========== Message Operations ==========

/**
 * Send a plaintext message
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    _otherUserId: string,
    text: string
): Promise<void> {
    const { error } = await (supabase as any)
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: text,
        });

    if (error) {
        throw new Error('Failed to send message: ' + error.message);
    }
}

/**
 * Fetch messages for a conversation
 */
export async function fetchMessages(
    conversationId: string,
    _otherUserId: string,
    limit = 50,
    offset = 0
): Promise<Message[]> {
    const { data: rows } = await (supabase as any)
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

    if (!rows || rows.length === 0) return [];

    return rows.map((row: any) => ({
        id: row.id,
        conversation_id: row.conversation_id,
        sender_id: row.sender_id,
        content: row.content || '',
        created_at: row.created_at,
    }));
}

/**
 * Subscribe to real-time messages for a conversation
 */
export function subscribeToMessages(
    conversationId: string,
    _otherUserId: string,
    onMessage: (msg: Message) => void
) {
    const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
                const row = payload.new as any;
                onMessage({
                    id: row.id,
                    conversation_id: row.conversation_id,
                    sender_id: row.sender_id,
                    content: row.content || '',
                    created_at: row.created_at,
                });
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Mark a conversation as read for the current user
 */
export async function markConversationAsRead(
    conversationId: string,
    userId: string
): Promise<void> {
    await (supabase as any)
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
}

/**
 * Get the other user ID in a conversation
 */
export async function getOtherUserId(
    conversationId: string,
    currentUserId: string
): Promise<string | null> {
    const { data } = await (supabase as any)
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', currentUserId)
        .maybeSingle();

    return data?.user_id || null;
}
