import { ToolsLayout } from "@/components/tools/ToolsLayout";
import { ReconstitutionCalc } from "@/components/tools/ReconstitutionCalc";

export const metadata = {
  title: "Reconstitution Calculator | PeptideSearch Pro",
  description: "Calculate peptide concentration after adding bacteriostatic water.",
};

export default function ReconstitutionPage() {
  return (
    <ToolsLayout
      title="Reconstitution Calculator"
      description="Enter peptide amount and bac water volume to get mg/mL, mcg/mL, and units per draw."
      toolSlug="reconstitution"
    >
      <ReconstitutionCalc />
    </ToolsLayout>
  );
}
