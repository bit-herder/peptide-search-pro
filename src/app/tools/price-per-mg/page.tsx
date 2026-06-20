import { ToolsLayout } from "@/components/tools/ToolsLayout";
import { PricePerMgCalc } from "@/components/tools/PricePerMgCalc";

export const metadata = {
  title: "Price per mg Calculator | PeptideSearch Pro",
  description: "Normalize peptide vial prices to compare value across different sizes.",
};

export default function PricePerMgPage() {
  return (
    <ToolsLayout
      title="Price per mg Calculator"
      description="Compare vial value by normalizing total price to cost per milligram."
      toolSlug="price-per-mg"
    >
      <PricePerMgCalc />
    </ToolsLayout>
  );
}
