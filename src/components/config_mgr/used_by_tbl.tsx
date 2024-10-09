import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { SupportedConfig, UseStoreHandles } from "./util";
import { useCallback } from "react";
import { StyledTitle } from "../basics/styled_title";

type UsedByTableProps = {
  usedByList: { id: string; type: keyof SupportedConfig }[];
};
const columns = [
  {
    name: "name",
    uid: "name",
  },
  {
    name: "type",
    uid: "type",
  },
];
const UsedByTable = ({ usedByList }: UsedByTableProps) => {
  const { get: getDeviceConfig } = UseStoreHandles["device"]();
  const getConfigNameById = ({
    id,
    type,
  }: UsedByTableProps["usedByList"][number]) => {
    if (type === "device") {
      return getDeviceConfig({ id: id })?.name;
    }
    return "BUG";
  };
  const renderCell = useCallback(
    (
      item: (typeof usedByList)[number],
      columnKey: (typeof columns)[number]["name"]
    ) => {
      switch (columnKey) {
        case "name": {
          return getConfigNameById(item) || "Unknown";
        }
        case "type": {
          return <Chip>{item.type.toUpperCase()}</Chip>;
        }
        default: {
          return "ERROR";
        }
      }
    },
    [getConfigNameById]
  );
  return (
    <Table
      className="w-full"
      removeWrapper
      isCompact
      topContent={
        <div className="flex flex-row justify-between px-2">
          <span className="text-sm font-semibold font-mono">Used By</span>
          <span className="text-sm font-mono text-neutral-700">
            {usedByList.length} configs
          </span>
        </div>
      }
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "name" ? "start" : "end"}
          >
            {column.name.toUpperCase()}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"Not used by any other config."}>
        {usedByList.map((item) => (
          <TableRow>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey.toString())}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export { UsedByTable };
