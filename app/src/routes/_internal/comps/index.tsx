import { CompsExplorer } from "~/components/comps-explorer/CompsExplorer";
import { DESIGN_SYSTEM_LAYOUT_KEY } from "~/components/comps-explorer/compsExplorer.shared";

export default function InternalCompsIndexRoute() {
  return <CompsExplorer selectedComponent={DESIGN_SYSTEM_LAYOUT_KEY} />;
}
