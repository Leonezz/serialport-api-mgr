import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { ReactNode, useState } from "react";

type DeleteConfirmPopoverProps = {
  content: ReactNode;
  onCancel?: () => void;
  onConfirm?: () => void;
};
const DeleteConfirmPopover = ({
  content,
  onCancel,
  onConfirm,
}: DeleteConfirmPopoverProps) => {
  const [opened, setOpened] = useState(false);
  return (
    <Popover isOpen={opened}>
      <PopoverTrigger>
        <Button color="danger" variant="light" onClick={() => setOpened(true)}>
          Delete
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Card>
          <CardHeader className="text-lg font-bold">Caution</CardHeader>
          <CardBody>{content}</CardBody>
          <CardFooter className="flex flex-row gap-2 justify-end">
            <Button
              color="warning"
              size="sm"
              onClick={() => {
                onCancel && onCancel();
                setOpened(false);
              }}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              size="sm"
              onClick={() => {
                onConfirm && onConfirm();
                setOpened(false);
              }}
            >
              Yes
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default DeleteConfirmPopover;
