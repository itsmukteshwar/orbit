/** Application footer with brand tagline. */
export function Footer() {
  return (
    <footer className="py-4 text-center text-[12px] text-slate-400">
      Copyright © {new Date().getFullYear()}{" "}
      <span className="font-medium text-slate-600">Orbit Event ERP</span>. One Platform. Endless Possibilities.
    </footer>
  );
}
