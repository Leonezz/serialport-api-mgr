import {
  SerialportLogItem,
  useSerialportLog,
} from "@/hooks/store/useSerialportLogStore";
import { DEFAULT_DATETIME_FORMAT } from "@/util/datetime";
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Selection,
  Snippet,
  SortDescriptor,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { capitalize, uniq } from "es-toolkit";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

const columns = [
  { name: "PORT", uid: "port_name", sortable: true },
  { name: "TIME", uid: "time", sortable: true },
  { name: "EVENT", uid: "type", sortable: true },
  { name: "ERROR", uid: "error" },
  { name: "DATA", uid: "data" },
];
const renderCell = (item: SerialportLogItem, columnKey: string) => {
  switch (columnKey) {
    case "port_name": {
      return <code>{item.port_name}</code>;
    }
    case "time": {
      return (
        <code className="min-w-fit">
          {item.time.toFormat(DEFAULT_DATETIME_FORMAT)}
        </code>
      );
    }
    case "type": {
      return (
        <Chip
          size="sm"
          radius="sm"
          className="h-fit p-1 min-w-fit bg-warning-300"
        >
          {capitalize(item.type.split("_").join(" "))}
        </Chip>
      );
    }
    case "error": {
      return <code>{item.error_msg}</code>;
    }
    case "data": {
      if (item.data === undefined) {
        return null;
      }
      return (
        <Snippet hideSymbol size="sm" className="w-full" codeString={item.data}>
          <div className="flex flex-row gap-2 items-center">
            <code className="truncate max-w-[300px]">{item.data}</code>
            <Chip
              size="sm"
              radius="sm"
              className="text-xs font-mono p-0.5 h-fit bg-success-300"
              variant="shadow"
            >{`${item.data?.split(" ").length} bytes`}</Chip>
          </div>
        </Snippet>
      );
    }
  }
};
export const SerialportLogs = () => {
  const { get } = useSerialportLog();
  const logs = get();

  const ports = uniq(logs.map((v) => v.port_name));
  const events = uniq(logs.map((v) => v.type));

  const [filterPorts, setFilterPorts] = useState<Selection>("all");
  const [filterEvents, setFilterEvents] = useState<Selection>("all");
  const [searchText, setSearchText] = useState<string>("");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "time",
    direction: "descending",
  });

  const filteredItems = useMemo(() => {
    let filteredLogs = logs;
    if (
      filterPorts !== "all" &&
      Array.from(filterPorts).length !== ports.length
    ) {
      filteredLogs = filteredLogs.filter((log) =>
        Array.from(filterPorts).includes(log.port_name)
      );
    }

    if (
      filterEvents !== "all" &&
      Array.from(filterEvents).length !== events.length
    ) {
      filteredLogs = filteredLogs.filter((log) =>
        Array.from(filterEvents).includes(log.type)
      );
    }

    if (searchText.length > 0) {
      filteredLogs = filteredLogs.filter((log) =>
        `${log.data}${log.error_msg}${log.port_name}${log.time.toFormat(
          DEFAULT_DATETIME_FORMAT
        )}${log.type}`
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
    }
    return filteredLogs;
  }, [logs, filterPorts, filterEvents, searchText]);

  const sortedItems = useMemo(() => {
    return filteredItems.sort((a: SerialportLogItem, b: SerialportLogItem) => {
      const first =
        a[sortDescriptor.column as keyof SerialportLogItem]?.toString();
      const second =
        b[sortDescriptor.column as keyof SerialportLogItem]?.toString();
      const cmp =
        (first && second && (first < second ? -1 : first > second ? 1 : 0)) ||
        0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredItems, sortDescriptor]);

  return (
    <Table
      className="w-full h-full"
      isHeaderSticky
      isStriped
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      topContent={
        <div className="flex flex-row gap-2">
          <Input
            isClearable
            className="w-full"
            placeholder="Search"
            startContent={<SearchIcon />}
            value={searchText}
            onClear={() => setSearchText("")}
            onValueChange={setSearchText}
          />
          <Dropdown>
            <DropdownTrigger className="sm:flex">
              <Button
                endContent={<ChevronDownIcon className="text-small" />}
                variant="solid"
                color="primary"
              >
                PORT
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Table Columns"
              closeOnSelect={false}
              selectedKeys={filterPorts}
              selectionMode="multiple"
              onSelectionChange={setFilterPorts}
            >
              {ports.map((port) => (
                <DropdownItem key={port} className="capitalize">
                  {port}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger className="sm:flex">
              <Button
                endContent={<ChevronDownIcon className="text-small" />}
                color="primary"
                variant="solid"
              >
                EVENT
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Table Columns"
              closeOnSelect={false}
              selectedKeys={filterEvents}
              selectionMode="multiple"
              onSelectionChange={setFilterEvents}
            >
              {events.map((event) => (
                <DropdownItem key={event} className="capitalize">
                  {event}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      }
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={sortedItems} emptyContent={"No logs"}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey.toString())}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
