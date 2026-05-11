import { useParams } from "@solidjs/router";
import { CompsExplorer } from "~/components/comps-explorer/CompsExplorer";

export default function InternalCompsComponentRoute() {
  const params = useParams<{ component: string }>();
  return <CompsExplorer selectedComponent={params.component} />;
}
