import ListWithDetail from "@/components/basics/list-with-detail";
import { StyledTitle } from "@/components/basics/styled_title";
import { ConfigTitle } from "@/components/config_mgr/config_title";
import { DeviceTester } from "@/components/device/device_tester";
import { useNamedSerialportDeviceStore } from "@/hooks/store/useNamedDeviceConfigStore";
import { Card, CardBody } from "@nextui-org/react";
const EMPTY_SET = new Set<string>();
const DeviceConfigList = ListWithDetail<"device">;
const DeviceTesterPage = () => {
  const { getAll } = useNamedSerialportDeviceStore();
  const allDeviceConfig = getAll();
  return (
    <div className="w-full h-full">
      <DeviceConfigList
        items={allDeviceConfig}
        modifiedItems={EMPTY_SET}
        defaultSelectId=""
        detailView={(configItem) => (
          <Card className="w-full">
            <CardBody className="px-1">
              <DeviceTester config={configItem.config} />
            </CardBody>
          </Card>
        )}
        renderTitle={({ item }) => (
          <ConfigTitle type="device" content={item.name} />
        )}
        topContent={
          <div className="flex flex-row gap-1 justify-between items-center w-full">
            <StyledTitle> Device Config List</StyledTitle>
          </div>
        }
      />
    </div>
  );
};

export { DeviceTesterPage };
