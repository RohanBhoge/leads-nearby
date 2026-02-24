/**
 * Chat service layer — CRUD operations + Supabase Realtime
 * Handles conversation management, message sending/receiving with E2E encryption
 */

import { supabase } from '@/integrations/supabase/client';
import {
    getOrCreateKeyPair,
    importPublicKey,
    deriveSharedKey,
    encryptMessage,
    decryptMessage,
} from './crypto';

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
    ciphertext: string;
    iv: string;
    created_at: string;
}

export interface DecryptedMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    text: string;
    created_at: string;
}

// Cache derived shared keys so we don't re-derive every message
const sharedKeyCache = new Map<string, CryptoKey>();

// ========== Key Management ==========

/**
 * Ensure the current user's public key is stored in Supabase.
 * Call this on app init or first chat usage.
 */
export async function ensureUserKeysExist(userId: string): Promise<string> {
    const { privateKey, publicKeyJwk } = await getOrCreateKeyPair();

    // Check if key already exists in DB
    const { data: existing } = await (supabase as any)
        .from('user_keys')
        .select('public_key')
        .eq('user_id', userId)
        .maybeSingle();

    if (existing?.public_key) {
        return existing.public_key;
    }

    // Upsert public key
    await (supabase as any)
        .from('user_keys')
        .upsert({
            user_id: userId,
            public_key: publicKeyJwk,
        }, { onConflict: 'user_id' });

    return publicKeyJwk;
}

/**
 * Get or derive the shared AES key for a conversation with another user
 */
async function getSharedKey(otherUserId: string): Promise<CryptoKey> {
    if (sharedKeyCache.has(otherUserId)) {
        return sharedKeyCache.get(otherUserId)!;
    }

    const { privateKey } = await getOrCreateKeyPair();

    // Fetch other user's public key
    const { data: keyRow } = await (supabase as any)
        .from('user_keys')
        .select('public_key')
        .eq('user_id', otherUserId)
        .maybeSingle();

    if (!keyRow?.public_key) {
        throw new Error('Other user has not set up encryption keys yet');
    }

    const otherPublicKey = await importPublicKey(keyRow.public_key);
    const shared = await deriveSharedKey(privateKey, otherPublicKey);

    sharedKeyCache.set(otherUserId, shared);
    return shared;
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
    // First, ensure both users have keys
    await ensureUserKeysExist(currentUserId);

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
            // Check if both users are in any of these conversations
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
                // Find one without a lead_id (general chat)
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
        // If RLS blocks the select after insert, try fetching the latest
        // conversation we just created
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

        // Add both participants
        const { error: partError } = await (supabase as any)
            .from('conversation_participants')
            .insert([
                { conversation_id: fallback.id, user_id: currentUserId },
                { conversation_id: fallback.id, user_id: otherUserId },
            ]);

        if (partError) {
            console.error('Participant insert error:', partError);
        }

        return fallback.id;
    }

    // Add both participants
    const { error: partError } = await (supabase as any)
        .from('conversation_participants')
        .insert([
            { conversation_id: newConv.id, user_id: currentUserId },
            { conversation_id: newConv.id, user_id: otherUserId },
        ]);

    if (partError) {
        console.error('Participant insert error:', partError);
    }

    return newConv.id;
}

/**
 * Fetch all conversations for a user with details
 */
export async function fetchConversations(
    currentUserId: string
): Promise<ConversationWithDetails[]> {
    // Get all conversation IDs for this user
    const { data: participantRows } = await (supabase as any)
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', currentUserId);

    if (!participantRows || participantRows.length === 0) return [];

    const convIds = participantRows.map((p: any) => p.conversation_id);
    const lastReadMap = new Map(
        participantRows.map((p: any) => [p.conversation_id, p.last_read_at])
    );

    // Fetch conversations
    const { data: conversations } = await (supabase as any)
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('updated_at', { ascending: false });

    if (!conversations) return [];

    // For each conversation, get the other participant and last message
    const results: ConversationWithDetails[] = [];

    for (const conv of conversations) {
        // Get other participant
        const { data: participants } = await (supabase as any)
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .neq('user_id', currentUserId);

        if (!participants || participants.length === 0) continue;

        const otherUserId = participants[0].user_id;

        // Get other user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, user_name, profile_image')
            .eq('id', otherUserId)
            .maybeSingle();

        const displayName = (profile as any)?.user_name || 'User';

        // Get last message
        const { data: lastMsgRows } = await (supabase as any)
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

        let lastMessage: ConversationWithDetails['lastMessage'] | undefined;
        if (lastMsgRows && lastMsgRows.length > 0) {
            const msg = lastMsgRows[0];
            try {
                const sharedKey = await getSharedKey(otherUserId);
                const text = await decryptMessage(sharedKey, msg.ciphertext, msg.iv);
                lastMessage = {
                    text: text.length > 50 ? text.substring(0, 50) + '...' : text,
                    created_at: msg.created_at,
                    sender_id: msg.sender_id,
                };
            } catch {
                lastMessage = {
                    text: '🔒 Encrypted message',
                    created_at: msg.created_at,
                    sender_id: msg.sender_id,
                };
            }
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
 * Send an encrypted message
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    otherUserId: string,
    plaintext: string
): Promise<void> {
    const sharedKey = await getSharedKey(otherUserId);
    const { ciphertext, iv } = await encryptMessage(sharedKey, plaintext);

    const { error } = await (supabase as any)
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            ciphertext,
            iv,
        });

    if (error) {
        throw new Error('Failed to send message: ' + error.message);
    }
}

/**
 * Fetch and decrypt messages for a conversation
 */
export async function fetchMessages(
    conversationId: string,
    otherUserId: string,
    limit = 50,
    offset = 0
): Promise<DecryptedMessage[]> {
    const { data: rows } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

    if (!rows || rows.length === 0) return [];

    const sharedKey = await getSharedKey(otherUserId);

    const decrypted: DecryptedMessage[] = [];
    for (const row of rows) {
        try {
            const text = await decryptMessage(sharedKey, row.ciphertext, row.iv);
            decrypted.push({
                id: row.id,
                conversation_id: row.conversation_id,
                sender_id: row.sender_id,
                text,
                created_at: row.created_at,
            });
        } catch {
            decrypted.push({
                id: row.id,
                conversation_id: row.conversation_id,
                sender_id: row.sender_id,
                text: '🔒 Unable to decrypt',
                created_at: row.created_at,
            });
        }
    }

    return decrypted;
}

/**
 * Subscribe to real-time messages for a conversation
 */
export function subscribeToMessages(
    conversationId: string,
    otherUserId: string,
    onMessage: (msg: DecryptedMessage) => void
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
            async (payload) => {
                const row = payload.new as Message;
                try {
                    const sharedKey = await getSharedKey(otherUserId);
                    const text = await decryptMessage(sharedKey, row.ciphertext, row.iv);
                    onMessage({
                        id: row.id,
                        conversation_id: row.conversation_id,
                        sender_id: row.sender_id,
                        text,
                        created_at: row.created_at,
                    });
                } catch {
                    onMessage({
                        id: row.id,
                        conversation_id: row.conversation_id,
                        sender_id: row.sender_id,
                        text: '🔒 Unable to decrypt',
                        created_at: row.created_at,
                    });
                }
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
