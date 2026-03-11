import type { ComponentType } from "react";

import { EquilibriumModule } from "./equilibrium-module";
import { MonopolyModule } from "./monopoly-module";
import type { GraphPracticeInteraction } from "./module-shell";
import { PPCModule } from "./ppc-module";
import { SubsidyMarketModule } from "./subsidy-market-module";
import { TaxMarketModule } from "./tax-market-module";

export type GraphModuleComponentProps = {
  practiceInteraction?: GraphPracticeInteraction;
};

export type GraphModuleMeta = {
  id: string;
  title: string;
  summary: string;
  component: ComponentType<GraphModuleComponentProps>;
};

export const graphModules: GraphModuleMeta[] = [
  {
    id: "supply-demand-equilibrium",
    title: "Supply and Demand Equilibrium",
    summary: "Core market-clearing logic, surplus shading, and draggable intercepts.",
    component: EquilibriumModule,
  },
  {
    id: "tax-market",
    title: "Tax on a Competitive Market",
    summary: "Wedge logic, incidence split, tax revenue, and deadweight loss.",
    component: TaxMarketModule,
  },
  {
    id: "subsidy-market",
    title: "Subsidy on a Competitive Market",
    summary: "Government spending, overproduction, and subsidy-driven DWL.",
    component: SubsidyMarketModule,
  },
  {
    id: "ppc",
    title: "PPC and Opportunity Cost",
    summary: "Tradeoff curves, attainable sets, and opportunity-cost math.",
    component: PPCModule,
  },
  {
    id: "monopoly-costs",
    title: "Monopoly Profit and Deadweight Loss",
    summary: "MR = MC quantity, demand price, ATC profit, and allocative inefficiency.",
    component: MonopolyModule,
  },
];

export const graphModuleMap = Object.fromEntries(graphModules.map((module) => [module.id, module])) as Record<
  string,
  GraphModuleMeta
>;

export const graphIdToModuleId: Record<string, string> = {
  equilibrium: "supply-demand-equilibrium",
  tax: "tax-market",
  subsidy: "subsidy-market",
  ppc: "ppc",
  monopoly: "monopoly-costs",
};
