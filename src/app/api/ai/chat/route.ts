import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, workspaceId, userRole } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch workspace context if provided
    let workspaceContext = "";
    if (workspaceId) {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("*, client:profiles!workspaces_client_id_fkey(full_name)")
        .eq("id", workspaceId)
        .single();

      if (workspace) {
        workspaceContext = `Workspace: ${workspace.name}, Type: ${workspace.project_type || 'N/A'}, Status: ${workspace.status}, Client: ${workspace.client?.full_name || 'N/A'}`;
      }
    }

    // Get recent conversation history
    const { data: history } = await supabase
      .from("ai_conversations")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Generate contextual response based on user query
    const response = generateAIResponse(message, userRole, workspaceContext, history || []);

    // Store user message
    await supabase.from("ai_conversations").insert({
      user_id: user.id,
      workspace_id: workspaceId || null,
      role: "user",
      content: message,
      context: { workspaceId, userRole }
    });

    // Store AI response
    await supabase.from("ai_conversations").insert({
      user_id: user.id,
      workspace_id: workspaceId || null,
      role: "assistant",
      content: response,
      context: { workspaceId, userRole }
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

function generateAIResponse(
  message: string,
  userRole: string,
  workspaceContext: string,
  history: Array<{ role: string; content: string }>
): string {
  const lowerMsg = message.toLowerCase();

  // Freelancer-specific responses
  if (userRole === "freelancer") {
    if (lowerMsg.includes("proposal") || lowerMsg.includes("quote")) {
      return "To create a professional proposal, go to your workspace's Documents tab, click 'New Proposal', and fill in the project scope, timeline, and pricing. The system will auto-generate a document number for tracking.";
    }
    if (lowerMsg.includes("invoice") || lowerMsg.includes("payment") || lowerMsg.includes("bill")) {
      return "You can create invoices from the Documents tab in any workspace. Add line items with quantities and rates, and the system will calculate the total including tax. Once sent, the client will be notified automatically.";
    }
    if (lowerMsg.includes("contract") || lowerMsg.includes("agreement")) {
      return "Use the Contract document type to create agreements. Pre-fill party details and customize standard clauses. Both parties can view the contract status in real-time.";
    }
    if (lowerMsg.includes("client") || lowerMsg.includes("find client")) {
      return "Share your referral code from the Referrals page. When clients use it to sign up, they'll be automatically linked to your account. You can track all linked clients in your dashboard.";
    }
    if (lowerMsg.includes("task") || lowerMsg.includes("todo")) {
      return "Manage tasks in the workspace's To-Do tab. Create tasks with priorities (low/medium/high), mark them complete, and track progress. All changes sync in real-time.";
    }
    if (lowerMsg.includes("status") || lowerMsg.includes("progress")) {
      return workspaceContext
        ? `Based on your current workspace (${workspaceContext}), I recommend checking the Overview tab for the latest activity and pipeline stage updates.`
        : "Check your workspace Overview tab for real-time status updates, recent activity, and pipeline progress.";
    }
    if (lowerMsg.includes("help") || lowerMsg.includes("what can you do")) {
      return "I'm your AI assistant! I can help you with:\n\n• Creating proposals, invoices, and contracts\n• Managing client relationships\n• Tracking project progress\n• Task management tips\n• General CRM guidance\n\nWhat would you like help with?";
    }
    return "I understand you're looking for help as a freelancer. Could you be more specific? I can assist with proposals, invoices, contracts, client management, or task tracking.";
  }

  // Client-specific responses
  if (userRole === "client") {
    if (lowerMsg.includes("document") || lowerMsg.includes("proposal") || lowerMsg.includes("invoice")) {
      return "You can view all documents sent by your freelancer in the Documents section. Each document shows its status (sent, viewed, approved, paid). Click 'View' to see details.";
    }
    if (lowerMsg.includes("status") || lowerMsg.includes("progress")) {
      return workspaceContext
        ? `Your project (${workspaceContext}) is being managed actively. Check your workspace for real-time updates, task progress, and recent messages.`
        : "Check your workspace dashboard for real-time project updates, completed tasks, and recent communications.";
    }
    if (lowerMsg.includes("pay") || lowerMsg.includes("payment")) {
      return "Invoices will appear in your Documents section with a 'Mark as Paid' option once your freelancer sends them. Contact your freelancer for payment methods.";
    }
    if (lowerMsg.includes("message") || lowerMsg.includes("chat")) {
      return "Use the workspace Chat tab to communicate directly with your freelancer. All messages are stored and sync in real-time.";
    }
    if (lowerMsg.includes("help") || lowerMsg.includes("what can you do")) {
      return "I'm your AI assistant! I can help you with:\n\n• Understanding your documents\n• Checking project status\n• Communication tips\n• General platform guidance\n\nWhat would you like to know?";
    }
    return "I'm here to help! As a client, I can assist with understanding documents, checking project progress, or explaining platform features. What do you need?";
  }

  // Default response
  return "I'm your ClientFlow AI assistant. I can help with project management, document creation, and platform navigation. How can I assist you today?";
}
