import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from "@copilotkit/runtime";
import cors from "cors";
import express from "express";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
const port = Number(process.env.RUNTIME_PORT ?? 3001);
const endpoint = "/api/copilotkit";

const app = express();
const serviceAdapter = new ExperimentalEmptyAdapter();
const runtime = new CopilotRuntime({
  agents: {
    recipe_agent: new HttpAgent({ url: `${backendUrl}/copilotkit` }) as never,
  },
});

const handler = copilotRuntimeNodeHttpEndpoint({
  endpoint,
  runtime,
  serviceAdapter,
});

app.use(cors());
app.use((req, res) => handler(req, res));

app.listen(port, () => {
  console.log(`CopilotKit runtime listening on http://localhost:${port}${endpoint}`);
});
