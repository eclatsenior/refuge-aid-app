import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  relatedAlertId?: string;
}

export function MessageDialog({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  relatedAlertId,
}: MessageDialogProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, markMessageAsRead, user } = useAppStore();
  
  // Filter messages for this conversation
  const conversationMessages = messages.filter(
    (msg) =>
      (msg.sender_id === user?.id && msg.recipient_id === recipientId) ||
      (msg.recipient_id === user?.id && msg.sender_id === recipientId)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages]);

  // Mark unread messages as read when dialog opens
  useEffect(() => {
    if (isOpen) {
      conversationMessages
        .filter((msg) => msg.recipient_id === user?.id && !msg.is_read)
        .forEach((msg) => markMessageAsRead(msg.id));
    }
  }, [isOpen, conversationMessages, user?.id, markMessageAsRead]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(recipientId, message.trim(), relatedAlertId);
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>💬 {recipientName}</DialogTitle>
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {conversationMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No hay mensajes aún. Envía el primero.
              </div>
            ) : (
              conversationMessages.map((msg) => {
                const isSender = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col",
                      isSender ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        isSender
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {format(new Date(msg.created_at), "HH:mm", { locale: es })}
                      {isSender && msg.is_read && " · Leído"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="min-h-[60px] resize-none"
              maxLength={500}
              disabled={isSending}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {message.length}/500 caracteres
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
