import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";

interface Message {
  id: number;
  content: string;
  role: "user" | "assistant";
  isStreaming?: boolean;
}

interface Neo4jResponse {
  askNeo4jQuestion: {
    response: string;
    thread_id: string;
  };
}

interface QueryResponse {
  data: { askNeo4jQuestion: Neo4jResponse["askNeo4jQuestion"] } | null;
  errors?: any[];
}

const fetchQuery = async ({
  query,
  variables,
}: {
  query: string;
  variables: {
    question: string;
    thread_id?: string;
  };
}): Promise<QueryResponse> => {
  try {
    const res = await fetch(import.meta.env.VITE_MODUS_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_MODUS_API_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(res.statusText);
    }

    const { data, errors } = await res.json();
    return { data, errors };
  } catch (err) {
    console.error("error in fetchQuery:", err);
    return { data: null, errors: [err] };
  }
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      content:
        "Welcome! I interact with your Neo4j knowledge graph to give you accurate answers from your data.",
      role: "assistant",
    },
  ]);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollViewportRef.current && scrollContentRef.current) {
      requestAnimationFrame(() => {
        scrollViewportRef.current?.scrollTo({
          top: scrollContentRef.current?.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  };

  // Scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Faster streaming with larger chunks
  const simulateStreaming = async (fullContent: string, messageId: number) => {
    return new Promise<void>((resolve) => {
      let currentIndex = 0;
      const chunkSize = 10; // Increased from 3
      const streamInterval = setInterval(() => {
        if (currentIndex < fullContent.length) {
          currentIndex += chunkSize;
          const displayContent = fullContent.slice(0, currentIndex);

          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === messageId
                ? { ...msg, content: displayContent, isStreaming: true }
                : msg
            )
          );
          scrollToBottom();
        } else {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === messageId
                ? { ...msg, content: fullContent, isStreaming: false }
                : msg
            )
          );
          clearInterval(streamInterval);
          resolve();
        }
      }, 10);
    });
  };

  const askNeo4jQuestion = async (question: string) => {
    const graphqlQuery = `
      query($question: String!, $thread_id: String) {
        askNeo4jQuestion(question: $question, thread_id: $thread_id) {
          response
          thread_id
        }
      }
    `;

    return await fetchQuery({
      query: graphqlQuery,
      variables: {
        question,
        thread_id: threadId,
      },
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("message") as HTMLInputElement;
    const content = input.value.trim();

    if (content) {
      const userMessage: Message = {
        id: Date.now(),
        content,
        role: "user",
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      input.value = "";
      setIsLoading(true);

      const loadingMessageId = Date.now() + 1;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: loadingMessageId,
          content: "",
          role: "assistant",
          isStreaming: true,
        },
      ]);

      try {
        const { data, errors } = await askNeo4jQuestion(content);

        if (errors) {
          throw errors[0];
        }

        if (data?.askNeo4jQuestion) {
          const response = data.askNeo4jQuestion;

          if (response.thread_id) {
            setThreadId(response.thread_id.replace(/"/g, ""));
          }

          await simulateStreaming(response.response, loadingMessageId);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === loadingMessageId
              ? {
                  ...msg,
                  content: "Sorry, there was an error processing your message.",
                  isStreaming: false,
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden">
      <ScrollArea className="h-[400px] p-4" ref={scrollViewportRef}>
        <div ref={scrollContentRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.content ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : message.isStreaming ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 flex space-x-2">
        <Input
          name="message"
          placeholder="Ask a question about Neo4j..."
          className="flex-grow"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </Button>
      </form>
    </div>
  );
};

export default Chat;
