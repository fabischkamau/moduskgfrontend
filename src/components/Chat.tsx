import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface Message {
  id: number;
  content: string;
  role: "user" | "assistant";
}

interface Neo4jResponse {
  askNeo4jQuestion: {
    response: string;
    logs: string[];
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
      content: "Welcome! How can I assist you with Neo4j today?",
      role: "assistant",
    },
  ]);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  const askNeo4jQuestion = async (question: string) => {
    const graphqlQuery = `
      query($question: String!, $thread_id: String) {
        askNeo4jQuestion(question: $question, thread_id: $thread_id) {
          response
          logs
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

      try {
        const { data, errors } = await askNeo4jQuestion(content);

        if (errors) {
          throw errors[0];
        }

        if (data?.askNeo4jQuestion) {
          const response = data.askNeo4jQuestion;

          // Store thread_id for subsequent requests
          if (response.thread_id) {
            setThreadId(response.thread_id.replace(/"/g, "")); // Remove quotes from thread_id
          }

          // Add assistant's response
          const assistantMessage: Message = {
            id: Date.now(),
            content: response.response,
            role: "assistant",
          };
          setMessages((prevMessages) => [...prevMessages, assistantMessage]);

          // If there are logs, add them as a separate message
          if (response.logs && response.logs.length > 0) {
            const logsMessage: Message = {
              id: Date.now() + 1,
              content: `Debug logs:\n\`\`\`\n${response.logs.join(
                "\n"
              )}\n\`\`\``,
              role: "assistant",
            };
            setMessages((prevMessages) => [...prevMessages, logsMessage]);
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now(),
            content: "Sorry, there was an error processing your message.",
            role: "assistant",
          },
        ]);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden">
      <ScrollArea className="h-[400px] p-4">
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
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 flex space-x-2">
        <Input
          name="message"
          placeholder="Ask a question about Neo4j..."
          className="flex-grow"
        />
        <Button
          type="submit"
          size="icon"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send size={20} />
        </Button>
      </form>
    </div>
  );
};

export default Chat;
