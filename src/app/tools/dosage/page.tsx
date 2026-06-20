import { ToolsLayout } from "@/components/tools/ToolsLayout";
import { DosageCalc } from "@/components/tools/DosageCalc";

export const metadata = {
  title: "Dosage & Syringe Calculator | PeptideSearch Pro",
  description: "Convert desired peptide dose to mL and insulin syringe units.",
};

export default function DosagePage() {
  return (
    <ToolsLayout
      title="Dosage & Syringe Calculator"
      description="Given your solution concentration and target dose, calculate how much to draw."
      toolSlug="dosage"
    >
      <DosageCalc />
    </ToolsLayout>
  );
}
