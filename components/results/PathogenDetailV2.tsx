import PestDetailV2 from "@/components/results/PestDetailV2";
import type { ResultViewProps } from "@/components/results/useResult";

export default function PathogenDetailV2(props: ResultViewProps = {}) {
  return <PestDetailV2 {...props} tipo="enfermedad" />;
}
