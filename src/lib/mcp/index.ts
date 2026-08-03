import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listColaboradores from "./tools/list-colaboradores";
import listAfastamentos from "./tools/list-afastamentos";
import listDesligamentos from "./tools/list-desligamentos";
import listTreinamentosEventos from "./tools/list-treinamentos-eventos";
import hrSummary from "./tools/hr-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "rh-insights",
  title: "RH Insights",
  version: "0.1.0",
  instructions:
    "People analytics tools for RH Insights. Use `hr_summary` for headcount, hires, terminations, turnover and absence indicators over a period; `list_colaboradores` for employee records; `list_afastamentos` for leaves; `list_desligamentos` for terminations; `list_treinamentos_eventos` for trainings and institutional events. All dates use the YYYY-MM-DD format.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [hrSummary, listColaboradores, listAfastamentos, listDesligamentos, listTreinamentosEventos],
});
