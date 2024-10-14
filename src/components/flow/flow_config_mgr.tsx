import { FlowConfigStore } from "@/hooks/store/useFlowConfigStore";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { FlowView } from "./canves/flow_view";
type SerialportFlowConfigMgrDetailProps = {
  configId: string;
  onValueChange: (value: Partial<FlowConfigStore>) => void;
  value: {};
};
export const SerialportFlowConfigMgrDetail = ({
  configId,
}: SerialportFlowConfigMgrDetailProps) => {
  return (
    <ReactFlowProvider>
      <FlowView configId={configId} />
    </ReactFlowProvider>
  );
};
