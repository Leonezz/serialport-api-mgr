import {
  Card,
  CardBody,
  CardHeader,
  Listbox,
  ListboxItem,
  ScrollShadow,
} from "@nextui-org/react";
import { ComponentType, ReactNode, useMemo, useState } from "react";
import { SupportedConfig } from "../config_mgr/util";
import { useUpdateEffect } from "ahooks";

type ListWithDetailProps<Key extends keyof SupportedConfig> = {
  items: SupportedConfig[Key]["namedConfigType"][];
  modifiedItems: Set<string>;
  defaultSelectId: string;
  detailView: (item: SupportedConfig[Key]["namedConfigType"]) => ReactNode;
  renderTitle: ComponentType<{
    item: SupportedConfig[Key]["namedConfigType"];
  }>;
  topContent?: ReactNode;
};
const ListWithDetail = <Key extends keyof SupportedConfig>({
  items,
  modifiedItems,
  defaultSelectId,
  detailView,
  renderTitle: Title,
  topContent,
}: ListWithDetailProps<Key>) => {
  const [selectedId, setSelectedId] = useState(defaultSelectId);
  useUpdateEffect(() => {
    setSelectedId(defaultSelectId);
  }, [defaultSelectId]);
  const selectedItem = useMemo(() => {
    return items.filter((v) => v.id === selectedId);
  }, [items, selectedId]);

  const configDetailView = useMemo(
    () =>
      selectedItem && selectedItem.length === 1 ? (
        detailView(selectedItem[0])
      ) : (
        <Card className="w-full justify-center">
          <span className="text-neutral-500 text-3xl text-center">
            Not Selected
          </span>
        </Card>
      ),
    [selectedItem]
  );
  return (
    <div className="flex flex-row gap-2 w-full h-full">
      <Card className="w-max min-w-[250px]">
        <CardHeader className="w-full">{topContent}</CardHeader>
        <CardBody className="pt-0">
          <ScrollShadow
            size={100}
            hideScrollBar
            className="flex flex-grow w-fit"
          >
            <Listbox
              classNames={{
                base: "scrollbar-hide min-w-fit min-w-[200px] max-w-max",
              }}
              selectionMode="single"
              disallowEmptySelection
              shouldHighlightOnFocus
              autoFocus
              defaultSelectedKeys={[selectedId]}
              selectedKeys={[selectedId]}
              selectionBehavior="replace"
              items={items.map((v) => ({
                ...v,
                modified: modifiedItems.has(v.id),
              }))}
              onSelectionChange={(keys) => {
                if (keys === "all") {
                  return;
                }
                if (keys.size !== 1) {
                  return;
                }
                const key = [...keys.values()][0].toString();
                setSelectedId(key);
              }}
              variant="shadow"
              color="warning"
            >
              {(item) => {
                return (
                  <ListboxItem
                    key={item.id}
                    endContent={
                      item.modified ? (
                        <span className=" text-medium font-mono text-red-500">
                          M
                        </span>
                      ) : null
                    }
                  >
                    <div className="flex flex-row justify-between">
                      <Title item={item} />
                    </div>
                  </ListboxItem>
                );
              }}
            </Listbox>
          </ScrollShadow>
        </CardBody>
      </Card>
      {configDetailView}
    </div>
  );
};

export default ListWithDetail;
