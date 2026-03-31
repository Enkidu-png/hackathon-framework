import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const HACKATHON_DIR = path.resolve(process.cwd(), ".hackathon");
const REPO_ROOT = process.cwd();

// --- Git sync helpers ---

let lastPullTime = 0;
const PULL_COOLDOWN_MS = 3000; // Don't pull more than once every 3 seconds

function gitPull() {
  const now = Date.now();
  if (now - lastPullTime < PULL_COOLDOWN_MS) return;
  try {
    execSync("git pull --rebase --quiet", {
      cwd: REPO_ROOT,
      stdio: "ignore",
      timeout: 10000,
    });
    lastPullTime = Date.now();
  } catch {
    // Pull failed (offline, conflict, etc.) — continue with local state
  }
}

function gitPush(files) {
  try {
    for (const f of files) {
      execSync(`git add "${f}"`, { cwd: REPO_ROOT, stdio: "ignore" });
    }
    execSync(
      'git commit -m "brain: sync state" --no-verify',
      { cwd: REPO_ROOT, stdio: "ignore", timeout: 10000 }
    );
    execSync("git push", {
      cwd: REPO_ROOT,
      stdio: "ignore",
      timeout: 15000,
    });
  } catch {
    // Push failed — changes stay local, next push will include them
  }
}

// --- File helpers ---

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return { error: `Not found or invalid: ${filePath}` };
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readAllInDir(dir) {
  if (!fs.existsSync(dir)) return {};
  const result = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    result[path.basename(f, ".json")] = readJson(path.join(dir, f));
  }
  return result;
}

const server = new McpServer({
  name: "hackathon-brain",
  version: "1.0.0",
});

// Tool: get_vision
server.tool(
  "get_vision",
  "Read the app spec — problem, users, features, flows, data model, success criteria",
  {},
  async () => {
    gitPull();
    const spec = readJson(path.join(HACKATHON_DIR, "app-spec.json"));
    return { content: [{ type: "text", text: JSON.stringify(spec, null, 2) }] };
  }
);

// Tool: get_constitution
server.tool(
  "get_constitution",
  "Read team rules, working agreements, and conventions",
  {},
  async () => {
    gitPull();
    const data = readJson(path.join(HACKATHON_DIR, "constitution.json"));
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: get_techstack
server.tool(
  "get_techstack",
  "Read tech stack decisions and rationale",
  {},
  async () => {
    gitPull();
    const data = readJson(path.join(HACKATHON_DIR, "techstack.json"));
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: get_architecture
server.tool(
  "get_architecture",
  "Read module definitions, interfaces, and API contracts",
  {},
  async () => {
    gitPull();
    const data = readJson(path.join(HACKATHON_DIR, "architecture.json"));
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// Tool: get_module_context
server.tool(
  "get_module_context",
  "Get full context for a specific module — spec, interfaces, research findings",
  { module_name: z.string().describe("Module name (e.g. 'auth', 'frontend')") },
  async ({ module_name }) => {
    gitPull();
    const moduleSpec = readJson(
      path.join(HACKATHON_DIR, "modules", `${module_name}.json`)
    );
    const researchPath = path.join(
      HACKATHON_DIR,
      "research",
      `${module_name}.md`
    );
    const research = fs.existsSync(researchPath)
      ? fs.readFileSync(researchPath, "utf8")
      : "No research yet.";
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ spec: moduleSpec, research }, null, 2),
        },
      ],
    };
  }
);

// Tool: get_progress
server.tool(
  "get_progress",
  "See what team members are working on — one member or all",
  {
    member: z
      .string()
      .optional()
      .describe("Member name, or omit for all members"),
  },
  async ({ member }) => {
    gitPull();
    if (member) {
      const data = readJson(
        path.join(HACKATHON_DIR, "progress", `${member}.json`)
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
    const all = readAllInDir(path.join(HACKATHON_DIR, "progress"));
    return {
      content: [{ type: "text", text: JSON.stringify(all, null, 2) }],
    };
  }
);

// Tool: update_progress
server.tool(
  "update_progress",
  "Report what you are currently working on",
  {
    member: z.string().describe("Your name"),
    status: z.enum(["idle", "working", "blocked", "reviewing", "done"]),
    working_on: z.string().describe("What you are currently doing"),
    completed: z
      .array(z.string())
      .optional()
      .describe("Items completed so far"),
    blockers: z
      .array(z.string())
      .optional()
      .describe("Current blockers, if any"),
  },
  async ({ member, status, working_on, completed, blockers }) => {
    gitPull();
    const filePath = path.join(HACKATHON_DIR, "progress", `${member}.json`);
    const existing = fs.existsSync(filePath) ? readJson(filePath) : {};
    const updated = {
      ...existing,
      member,
      status,
      working_on,
      completed: completed || existing.completed || [],
      blockers: blockers || [],
      last_updated: new Date().toISOString(),
    };
    writeJson(filePath, updated);
    gitPush([filePath]);
    return {
      content: [{ type: "text", text: `Progress updated for ${member}` }],
    };
  }
);

// Tool: get_all — single call for full context (saves tokens vs calling 5 tools)
server.tool(
  "get_all",
  "Get a compact summary of the entire hackathon state in one call — vision, techstack, architecture, assignments, and team progress. Use this instead of calling multiple get_* tools.",
  {},
  async () => {
    gitPull();
    const state = readJson(path.join(HACKATHON_DIR, "state.json"));
    const spec = readJson(path.join(HACKATHON_DIR, "app-spec.json"));
    const techstack = readJson(path.join(HACKATHON_DIR, "techstack.json"));
    const arch = readJson(path.join(HACKATHON_DIR, "architecture.json"));
    const progress = readAllInDir(path.join(HACKATHON_DIR, "progress"));

    // Build compact summary
    const summary = {
      hackathon: state.hackathon_name,
      phase: state.current_phase,
      team: state.team,
      assignments: state.assignments || {},
      vision: spec.error
        ? "Not defined yet"
        : { pitch: spec.value_proposition, problem: spec.problem, mvp_features: (spec.features?.mvp || []).map((f) => f.name) },
      techstack: techstack.error
        ? "Not decided yet"
        : { frontend: techstack.frontend?.framework, backend: techstack.backend?.platform, database: techstack.database?.provider, auth: techstack.auth?.provider },
      modules: arch.error
        ? []
        : (arch.modules || []).map((m) => ({
            name: m.name,
            owner: m.owner || "unassigned",
            complexity: m.complexity,
            status: m.status || "not_started",
          })),
      progress: Object.fromEntries(
        Object.entries(progress).map(([name, p]) => [
          name,
          { status: p.status, working_on: p.working_on, blockers: p.blockers },
        ])
      ),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
