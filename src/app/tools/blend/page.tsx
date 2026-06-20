import { ToolsLayout } from "@/components/tools/ToolsLayout";
import { BlendCalc } from "@/components/tools/BlendCalc";

export const metadata = {
  title: "Blend / Combo Calculator | PeptideSearch Pro",
  description: "Calculate individual peptide concentrations in a multi-peptide vial.",
};

export default function BlendPage() {
  return (
    <ToolsLayout
      title="Blend / Combo Calculator"
      description="Two peptides reconstituted together — see each peptide's individual concentration."
      toolSlug="blend"
    >
      <BlendCalc />
    </ToolsLayout>
  );
}
