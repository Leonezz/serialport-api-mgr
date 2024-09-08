import {
  Card,
  CardBody,
  CardHeader,
  Listbox,
  ListboxItem,
  ScrollShadow,
} from "@nextui-org/react";
import { ReactNode, useState } from "react";

type ListWithDetailProps<T extends { id: string; modified: boolean }> = {
  items: T[];
  defaultSelectId: string;
  detailView: (item: T | undefined) => ReactNode;
  renderTitle: (item: T) => ReactNode;
  topContent?: ReactNode;
};
const ListWithDetail = <T extends { id: string; modified: boolean }>({
  items,
  defaultSelectId,
  detailView,
  renderTitle,
  topContent,
}: ListWithDetailProps<T>) => {
  const [selectedId, setSelectedId] = useState(defaultSelectId);
  const selectedItem = items.find((v) => v.id === selectedId);

  return (
    <div className="flex flex-row gap-2 w-full">
      <Card className="w-max min-w-[250px]">
        <CardHeader>{topContent}</CardHeader>
        <CardBody>
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
              defaultSelectedKeys={[defaultSelectId]}
              items={items}
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
              variant="solid"
            >
              {(item) => (
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
                    {renderTitle(item)}
                  </div>
                </ListboxItem>
              )}
            </Listbox>
          </ScrollShadow>
        </CardBody>
      </Card>
      {detailView(selectedItem)}
    </div>
  );
};

export default ListWithDetail;
