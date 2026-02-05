import React, { useState } from "react";
import { Check } from "lucide-react";
import { Button, Input, Modal } from "./ui";

interface Props {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const SimpleInputModal: React.FC<Props> = ({
  title,
  defaultValue = "",
  placeholder,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSave(value.trim());
      onClose();
    }
  };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" form="simple-input-form">
        <Check className="w-4 h-4 mr-2" /> Save
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <form id="simple-input-form" onSubmit={handleSubmit}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          required
        />
      </form>
    </Modal>
  );
};

export default SimpleInputModal;
