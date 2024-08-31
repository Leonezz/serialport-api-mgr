import { Button } from "@nextui-org/react";
import useAvaliablePorts from "@/hooks/commands/useAvaliablePorts";

const RefreshAvaliablePortsBtn = () => {
  const { refresh, refreshing } = useAvaliablePorts();
  return (
    <Button color="primary" onClick={refresh} isLoading={refreshing}>
      Refresh
    </Button>
  );
};

export default RefreshAvaliablePortsBtn;
