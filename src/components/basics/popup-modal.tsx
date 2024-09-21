import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { ReactNode } from "react";
import { Fragment } from "react/jsx-runtime";

type PopupModalProps = {
  onCancel?: () => void;
  onConfirm?: () => void;
  content: Readonly<ReactNode>;
  title: Readonly<ReactNode>;
  tooltipIcon: Readonly<ReactNode>;
  tooltipContent: Readonly<ReactNode>;
};
const PopupModal = ({
  onCancel,
  onConfirm,
  content,
  title,
  tooltipIcon,
  tooltipContent,
}: PopupModalProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <Fragment>
      <Tooltip content={tooltipContent}>
        <Button
          onClick={onOpen}
          variant="light"
          size="sm"
          isIconOnly
          className="text-lg cursor-pointer active:opacity-50"
        >
          {tooltipIcon}
        </Button>
      </Tooltip>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
        isKeyboardDismissDisabled={false}
      >
        <ModalContent>
          {(onClose) => (
            <Fragment>
              <ModalHeader>{title}</ModalHeader>
              <ModalBody>{content}</ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    onCancel && onCancel();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onConfirm && onConfirm();
                    onClose();
                  }}
                >
                  Confirm
                </Button>
              </ModalFooter>
            </Fragment>
          )}
        </ModalContent>
      </Modal>
    </Fragment>
  );
};

export { PopupModal };
