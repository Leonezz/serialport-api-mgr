import { SerialportDevice } from "@/types/device";
import { PresetConfigSelector } from "../serialport/config/config_selector";
import { useNamedSerialortConfigStore } from "@/hooks/store/useNamedSerialPortConfig";
import { useNamedMessageMetaConfigStore } from "@/hooks/store/useNamedMessageMetaConfig";
import {
  useNamedApiStore,
  NamedSerialportApi,
} from "@/hooks/store/useNamedConversationStore";
import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@nextui-org/react";
import { DeleteIcon, EditIcon, Plus } from "lucide-react";
import { ReactNode, useState } from "react";
import { PopupModal } from "../basics/popup-modal";
import { ConversationConfiger } from "../conversation/conversation_config_detail_view";

const SerialportApiConfigModal = ({
  value,
  readonly,
  tooltipIcon,
  tooltipContent,
}: {
  value: NamedSerialportApi;
  readonly: boolean;
  tooltipIcon: Readonly<ReactNode>;
  tooltipContent: Readonly<ReactNode>;
}) => {
  const { update } = useNamedApiStore();
  const [localValue, setLocalValue] = useState(value.config);
  return (
    <PopupModal
      tooltipContent={tooltipContent}
      onConfirm={() => update({ id: value.id, config: localValue })}
      title={<span>{value.name}</span>}
      tooltipIcon={tooltipIcon}
      content={
        <ConversationConfiger
          readonly={readonly}
          value={value.config}
          onValueChange={(v) =>
            setLocalValue((prev) => ({
              ...prev,
              ...v,
            }))
          }
        />
      }
    />
  );
};

const ApiTable = ({
  apiIDs,
  onDelete,
  onAdd,
}: {
  apiIDs: string[];
  onDelete: (id: string) => void;
  onAdd: (id: string) => void;
}) => {
  const columns = [
    { name: "name", uid: "name" },
    { name: "status", uid: "status" },
    { name: "actions", uid: "actions" },
  ];
  const { getAll: getAllApiConfigs } = useNamedApiStore();
  const allApiConfig = getAllApiConfigs();

  const renderCell = (
    item: NamedSerialportApi,
    columnKey: (typeof columns)[number]["name"]
  ) => {
    const selected = apiIDs.includes(item.id);
    switch (columnKey) {
      case "actions": {
        return (
          <div className="relative flex items-center justify-end gap-2">
            {/* <SerialportApiConfigModal
              tooltipContent={"View Detail"}
              value={item}
              readonly
              tooltipIcon={<EyeIcon />}
            /> */}
            <SerialportApiConfigModal
              tooltipContent={"Edit"}
              value={item}
              readonly={false}
              tooltipIcon={<EditIcon />}
            />
            <Tooltip color="danger" content={selected ? "Delete" : "Add"}>
              <Button
                onClick={() => (selected ? onDelete(item.id) : onAdd(item.id))}
                variant="light"
                size="sm"
                isIconOnly
                className="text-lg text-danger cursor-pointer active:opacity-50"
              >
                {selected ? <DeleteIcon /> : <Plus />}
              </Button>
            </Tooltip>
          </div>
        );
      }
      case "name": {
        return item.name;
      }
      case "status": {
        return (
          <Chip color={selected ? "primary" : "default"} variant="dot">
            {selected ? "used" : "not used"}
          </Chip>
        );
      }
      default:
        return "ERROR";
    }
  };

  return (
    <Table className="w-full h-full" removeWrapper>
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "end" : "start"}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"No rows to display."}>
        {allApiConfig.map(
          //NOTE - have to do this to make sure it re-renders every time
          (item) => (
            <TableRow>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey.toString())}</TableCell>
              )}
            </TableRow>
          )
        )}
      </TableBody>
    </Table>
  );
};

type SerialportDeviceConfigDetailViewProps = {
  value: SerialportDevice;
  onValueChange: (v: Partial<SerialportDevice>) => void;
  verticalLayout?: boolean;
};
const SerialportDeviceConfigDetailView = ({
  value,
  onValueChange,
  verticalLayout,
}: SerialportDeviceConfigDetailViewProps) => {
  const { get: getSerialportConfigById, getByName: getSerialportConfigByName } =
    useNamedSerialortConfigStore();
  const { api_ids, device_config_id, message_meta_id } = value;
  const defaultSerialportConfig = getSerialportConfigById({
    id: device_config_id,
  });
  const { get: getMessageMetaById, getByName: getMessageMetaByName } =
    useNamedMessageMetaConfigStore();
  const defaultMessageMetaConfig = getMessageMetaById({
    id: message_meta_id,
  });

  const SerialportPresetConfigSelector = PresetConfigSelector("serialport");
  const MessageMetaPresetConfigSelector = PresetConfigSelector("message");
  console.log(api_ids);
  return (
    <div className="flex flex-col gap-2 w-full">
      <SerialportPresetConfigSelector
        fullWidth={verticalLayout}
        selectedName={defaultSerialportConfig?.name || ""}
        readonly={false}
        setSelectedName={(name: string) => {
          const selectedConfig = getSerialportConfigByName({ name: name });
          if (!selectedConfig) {
            return;
          }
          onValueChange({ device_config_id: selectedConfig.id });
        }}
      />
      <MessageMetaPresetConfigSelector
        fullWidth={verticalLayout}
        selectedName={defaultMessageMetaConfig?.name || ""}
        readonly={false}
        setSelectedName={(name: string) => {
          const selectedConfig = getMessageMetaByName({ name: name });
          if (!selectedConfig) {
            return;
          }
          onValueChange({ message_meta_id: selectedConfig.id });
        }}
      />

      <ApiTable
        apiIDs={api_ids}
        onDelete={(id: string) => {
          onValueChange({
            api_ids: [...api_ids.filter((v) => v !== id)],
          });
        }}
        onAdd={(id) => {
          onValueChange({ api_ids: [...api_ids, id] });
        }}
      />
    </div>
  );
};

export default SerialportDeviceConfigDetailView;
