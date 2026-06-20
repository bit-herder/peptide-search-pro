import { ToolsLayout } from "@/components/tools/ToolsLayout";
import { UnitConverter } from "@/components/tools/UnitConverter";

export const metadata = {
  title: "Peptide Unit Converter | PeptideSearch Pro",
  description: "Convert between mg, mcg (µg), and grams for peptide amounts.",
};

export default function UnitsPage() {
  return (
    <ToolsLayout
      title="Unit Converter"
      description="Quick conversion between milligrams, micrograms, and grams."
      toolSlug="units"
    >
      <UnitConverter />
    </ToolsLayout>
  );
}
