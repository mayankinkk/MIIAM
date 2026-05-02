"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_type: "user" | "rider" | "vendor" | "support";
  message: string;
  created_at: string;
  read: boolean;
}

export interface ChatRoom {
  order_id: string;
  participants: string[];
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useChat(orderId: string, currentUserId: string) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`chat-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
          
          if (newMessage.sender_id !== currentUserId) {
            markAsRead([newMessage.id]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase, currentUserId]);

  async function loadMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  }

  async function sendMessage(message: string, senderType: "user" | "rider" | "vendor" = "user") {
    if (!message.trim()) return null;

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        order_id: orderId,
        sender_id: currentUserId,
        sender_type: senderType,
        message: message.trim(),
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to send message:", error);
      return null;
    }

    return data;
  }

  async function markAsRead(messageIds: string[]) {
    await supabase
      .from("chat_messages")
      .update({ read: true })
      .in("id", messageIds)
      .neq("sender_id", currentUserId);
  }

  async function sendTypingIndicator(isTyping: boolean) {
    const channel = supabase.channel(`typing-${orderId}`);
    
    if (isTyping) {
      await channel.track({ user_id: currentUserId, typing: true });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(async () => {
        await channel.track({ user_id: currentUserId, typing: false });
      }, 3000);
    } else {
      await channel.track({ user_id: currentUserId, typing: false });
    }
  }

  useEffect(() => {
    const channel = supabase.channel(`typing-listeners-${orderId}`);

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const typing: string[] = [];
      
      Object.entries(state).forEach(([key, presences]) => {
        const presence = presences[0] as any;
        if (presence?.typing && key !== currentUserId) {
          typing.push(key);
        }
      });
      
      setTypingUsers(typing);
      setIsTyping(typing.length > 0);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase, currentUserId]);

  return {
    messages,
    loading,
    isTyping,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    refetch: loadMessages,
  };
}

export function useChatList(userId: string) {
  const supabase = createClient();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChats() {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("order_id, sender_id, message, created_at")
        .or(`sender_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const chatMap: Record<string, ChatRoom> = {};
        
        data.forEach((msg) => {
          if (!chatMap[msg.order_id]) {
            chatMap[msg.order_id] = {
              order_id: msg.order_id,
              participants: [],
              last_message: msg.message,
              last_message_at: msg.created_at,
              unread_count: 0,
            };
          }
        });

        setChats(Object.values(chatMap));
      }
      setLoading(false);
    }

    loadChats();

    const channel = supabase
      .channel("chat-list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          if (payload.new.sender_id !== userId) {
            loadChats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { chats, loading };
}