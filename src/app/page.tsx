import { Header } from "@/components/Header";
import { SearchHero } from "@/components/SearchHero";
import { TRACKED_PROVIDER_COUNT } from "@/lib/providers-config";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4">
        <SearchHero />

        <section className="py-16 border-t border-border/50">
          <h2 className="text-center text-2xl font-bold mb-2">How it works</h2>
          <p className="text-center text-muted mb-10 max-w-lg mx-auto">
            We aggregate listings from {TRACKED_PROVIDER_COUNT} tracked research peptide
            suppliers so you can find the lowest price in seconds.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Search any peptide",
                desc: "Type BPC-157, Semaglutide, Tirzepatide, or any research peptide. We understand aliases and brand names.",
              },
              {
                step: "02",
                title: "Scan the web",
                desc: `We search the open web for stores selling your peptide, plus ${TRACKED_PROVIDER_COUNT} tracked suppliers. Prices normalized to $/mg.`,
              },
              {
                step: "03",
                title: "Buy from the best deal",
                desc: "Click through to the supplier with the best price. We never mark up — we're the comparison layer, not a store.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <span className="text-5xl font-bold text-accent/10 absolute -top-4 left-0">
                  {item.step}
                </span>
                <div className="pt-8">
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 border-t border-border/50 text-center">
          <p className="text-xs text-muted max-w-2xl mx-auto leading-relaxed">
            PeptideSearch Pro is an independent price comparison tool for research peptides.
            We are not a peptide vendor and do not sell products. All products listed are
            for laboratory research use only. Always verify supplier credentials, COAs, and
            current operating status before purchasing.
          </p>
        </section>
      </main>
    </>
  );
}
