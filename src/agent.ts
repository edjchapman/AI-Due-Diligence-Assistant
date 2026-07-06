import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { CHECKS, type Check, type Finding, type Report, toCitation } from './checks';
import { searchByVector } from './db/search';
import { embedQuery } from './embeddings';
import { reason } from './reasoner';

/**
 * The due-diligence agent as a LangGraph.js state graph — the inspectable
 * artefact. Each check is its own node: it retrieves company-scoped evidence,
 * reasons a verdict, and appends a cited finding. Nodes fan out from START and
 * run independently; the `findings` reducer merges their outputs.
 */
const ReportState = Annotation.Root({
  company: Annotation<string>(),
  findings: Annotation<Finding[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),
});

type State = typeof ReportState.State;

function checkNode(check: Check) {
  return async (state: State): Promise<Partial<State>> => {
    const chunks = await searchByVector(await embedQuery(check.query), 4, {
      company: state.company,
    });
    const { verdict, summary } = await reason(check, state.company, chunks);
    const finding: Finding = {
      checkId: check.id,
      label: check.label,
      verdict,
      summary,
      citations: chunks.slice(0, 2).map((c) => toCitation(c)),
    };
    return { findings: [finding] };
  };
}

const byId = (id: string): Check => {
  const check = CHECKS.find((c) => c.id === id);
  if (!check) throw new Error(`unknown check: ${id}`);
  return check;
};

// Fluent construction (literal node names) keeps LangGraph's node-name types
// intact. Every check fans out from START and rejoins at END; the `findings`
// reducer merges their outputs. Adding an M-N check = one node + two edges here.
const graph = new StateGraph(ReportState)
  .addNode('revenue-concentration', checkNode(byId('revenue-concentration')))
  .addNode('related-party', checkNode(byId('related-party')))
  .addNode('going-concern', checkNode(byId('going-concern')))
  .addNode('auditor-change', checkNode(byId('auditor-change')))
  .addEdge(START, 'revenue-concentration')
  .addEdge(START, 'related-party')
  .addEdge(START, 'going-concern')
  .addEdge(START, 'auditor-change')
  .addEdge('revenue-concentration', END)
  .addEdge('related-party', END)
  .addEdge('going-concern', END)
  .addEdge('auditor-change', END)
  .compile();

/** Run every due-diligence check for one company and assemble the cited report. */
export async function runReport(company: string): Promise<Report> {
  const result = await graph.invoke({ company });
  const order = new Map(CHECKS.map((c, i) => [c.id, i]));
  const findings = [...result.findings].sort(
    (a, b) => (order.get(a.checkId) ?? 0) - (order.get(b.checkId) ?? 0),
  );
  return { company, generatedAt: new Date().toISOString(), findings };
}
