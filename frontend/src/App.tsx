import { useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { RecipeWorkspace } from "./components/RecipeWorkspace";
import type { RecipeContext } from "./lib/types";
import { EMPTY_RECIPE_CONTEXT } from "./lib/types";

export default function App() {
  const [initialState, setInitialState] = useState<RecipeContext>(EMPTY_RECIPE_CONTEXT);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="recipe_agent"
      threadId={threadId}
      enableInspector={false}
      showDevConsole={false}
    >
      <main className="app-shell min-h-screen bg-[linear-gradient(135deg,#f6f2ea,#edf1e8)] p-3.5 text-[#17211b] md:h-dvh md:min-h-0 md:overflow-hidden md:p-6">
        <RecipeWorkspace
          key={threadId ?? "empty"}
          initialState={initialState}
          threadId={threadId}
          uploading={uploading}
          uploadError={uploadError}
          onUploadStart={() => {
            setUploadError(null);
            setUploading(true);
          }}
          onUploadComplete={(response) => {
            setThreadId(response.threadId);
            setInitialState(response.state);
            setUploading(false);
          }}
          onUploadError={(message) => {
            setUploadError(message);
            setUploading(false);
          }}
        />
      </main>
    </CopilotKit>
  );
}
