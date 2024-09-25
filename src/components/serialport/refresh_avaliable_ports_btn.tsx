import { Button } from "@nextui-org/react";
import useAvaliablePorts from "@/hooks/commands/useAvaliablePorts";
import { useUpdateEffect } from "ahooks";

const RefreshAvaliablePortsBtn = () => {
  const { refresh, refreshing } = useAvaliablePorts();
  useUpdateEffect(() => {
    refresh();
  }, []);
  return (
    <Button color="primary" onClick={refresh} isLoading={refreshing}>
      Refresh
    </Button>
  );
};

export default RefreshAvaliablePortsBtn;
